# Copyright (c) 2026, Balanstones and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class StoneEnquiry(Document):

	def before_insert(self):
		"""Set defaults on creation."""
		if not self.enquiry_date:
			self.enquiry_date = frappe.utils.today()
		if not self.status:
			self.status = "New"

	def on_update(self):
		"""Auto-update status to Won when customer is linked."""
		if self.customer and self.status not in ("Won", "Lost"):
			self.db_set("status", "Won", notify=True)

	# ── Public API Methods ────────────────────────────────────────────────

	@frappe.whitelist()
	def convert_to_customer(self):
		"""
		Create a Customer from this enquiry and link it back.
		Called by the 'Convert to Customer' button in the form JS.
		"""
		if self.customer:
			frappe.throw(
				f"Already converted — Customer: {self.customer}",
				title="Already Converted"
			)

		if self.status not in ("Quoted", "Won", "Reviewing"):
			frappe.throw(
				"Please set Status to 'Reviewing', 'Quoted', or 'Won' before converting.",
				title="Status Check"
			)

		# Create the Customer
		customer = frappe.get_doc({
			"doctype":        "Customer",
			"customer_name":  self.customer_name,
			"customer_type":  "Individual",
			"customer_group": frappe.db.get_single_value("Selling Settings", "customer_group")
			                  or "Individual",
			"territory":      frappe.db.get_single_value("Selling Settings", "territory")
			                  or "India",
			"mobile_no":      self.phone,
			"email_id":       self.email,
		})
		customer.insert(ignore_permissions=True)

		# Link back
		self.db_set("customer", customer.name)
		self.db_set("status",   "Won")
		frappe.db.commit()

		return customer.name

	@frappe.whitelist()
	def create_quotation(self):
		"""
		Create a draft Quotation linked to this enquiry's Customer.
		Called by the 'Create Quotation' button in the form JS.
		"""
		if not self.customer:
			frappe.throw("Convert to Customer first before creating a Quotation.")

		if self.quotation:
			frappe.throw(f"Quotation already exists: {self.quotation}")

		quotation = frappe.get_doc({
			"doctype":                   "Quotation",
			"party_name":                self.customer,
			"quotation_to":              "Customer",
			"custom_stone_enquiry":      self.name,       # link field on Quotation
			"transaction_date":          frappe.utils.today(),
			# Pre-fill the first item with enquiry details so salesperson
			# just needs to add price and qty
			"items": [{
				"item_name":        f"Stone Sculpture — {self.material or 'Custom'}",
				"description":      self.description or "",
				"qty":              1,
				"uom":              "Nos",
				"rate":             self.estimated_budget or 0,
			}]
		})
		quotation.insert(ignore_permissions=True)

		# Link back to this enquiry
		self.db_set("quotation", quotation.name)
		frappe.db.commit()

		return quotation.name
