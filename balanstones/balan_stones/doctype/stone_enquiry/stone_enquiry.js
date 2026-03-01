// Copyright (c) 2026, Balanstones and contributors
// For license information, please see license.txt

// ── Standalone helpers ───────────────────────────────────────────────────────
// IMPORTANT: These are defined OUTSIDE frappe.ui.form.on intentionally.
// Defining helpers as keys inside frappe.ui.form.on was the original bug —
// Frappe treats every key in that object as an event name, so calling
// frm._setup_buttons() would silently fail (frm has no such property).

function se_set_status_colour(frm) {
	const colours = {
		"New":       "blue",
		"Reviewing": "orange",
		"Quoted":    "yellow",
		"Won":       "green",
		"Lost":      "red",
		"On Hold":   "gray"
	};
	frm.page.set_indicator(
		frm.doc.status || "New",
		colours[frm.doc.status] || "blue"
	);
}

function se_setup_buttons(frm) {
	frm.clear_custom_buttons();

	const s   = frm.doc.status;
	const won = s === "Won";

	// ── Convert to Customer ──────────────────────────────────────────────
	// Show on ANY status if customer not yet created — including Won
	if (!frm.doc.customer) {
		frm.add_custom_button(__("Convert to Customer"), function () {
			frappe.confirm(
				`Create a Customer record for <b>${frm.doc.customer_name}</b>?`,
				() => frm.call({
					method:          "convert_to_customer",
					freeze:          true,
					freeze_message:  "Creating customer…",
					callback(r) {
						if (r.message) {
							frappe.show_alert({ message: `✅ Customer <b>${r.message}</b> created!`, indicator: "green" }, 5);
							frm.reload_doc();
						}
					}
				})
			);
		}, __("Actions")).addClass("btn-primary");
	}

	// ── Create Quotation ─────────────────────────────────────────────────
	if (frm.doc.customer && !frm.doc.quotation) {
		frm.add_custom_button(__("Create Quotation"), function () {
			frm.call({
				method:          "create_quotation",
				freeze:          true,
				freeze_message:  "Creating quotation…",
				callback(r) {
					if (r.message) {
						frappe.show_alert({ message: `📋 Quotation <b>${r.message}</b> created!`, indicator: "green" }, 5);
						frm.reload_doc();
						frappe.set_route("Form", "Quotation", r.message);
					}
				}
			});
		}, __("Actions"));
	}

	// ── View Quotation ───────────────────────────────────────────────────
	if (frm.doc.quotation) {
		frm.add_custom_button(__("View Quotation"), () =>
			frappe.set_route("Form", "Quotation", frm.doc.quotation)
		);
	}

	// ── View Sales Order ─────────────────────────────────────────────────
	if (frm.doc.sales_order) {
		frm.add_custom_button(__("View Sales Order"), () =>
			frappe.set_route("Form", "Sales Order", frm.doc.sales_order)
		);
	}

	// ── Mark as Lost ─────────────────────────────────────────────────────
	if (!["Lost", "Won"].includes(s) && !frm.is_new()) {
		frm.add_custom_button(__("Mark as Lost"), function () {
			frappe.prompt(
				[{ fieldname: "reason", fieldtype: "Small Text", label: "Reason (optional)" }],
				(vals) => {
					frm.set_value("status", "Lost");
					if (vals.reason) {
						const existing = frm.doc.internal_notes || "";
						frm.set_value("internal_notes",
							existing + `\n\n<b>Lost (${frappe.datetime.now_datetime()}):</b>\n${vals.reason}`);
					}
					frm.save();
				},
				__("Mark as Lost"), __("Confirm")
			);
		}, __("Actions"));
	}
}

// ── Event registration ───────────────────────────────────────────────────────
frappe.ui.form.on("Stone Enquiry", {

	refresh(frm) {
		se_set_status_colour(frm);
		se_setup_buttons(frm);
	},

	status(frm) {
		se_set_status_colour(frm);
		se_setup_buttons(frm);
	},

	customer(frm) {
		se_setup_buttons(frm);
	}

});
