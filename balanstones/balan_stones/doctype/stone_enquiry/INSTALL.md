# Stone Enquiry — Installation Guide

## File Placement

Copy the `stone_enquiry/` folder to:

```
frappe-16/
└── apps/
    └── balanstones/
        └── balanstones/
            └── balan_stones/
                └── doctype/
                    └── stone_enquiry/        ← place here
                        ├── __init__.py
                        ├── stone_enquiry.json
                        ├── stone_enquiry.py
                        └── stone_enquiry.js
```

## Check modules.txt

Open `balanstones/balanstones/modules.txt` and make sure `Balan Stones` is listed:
```
Balan Stones
```
If the file doesn't exist, create it with just that line.

## Run these bench commands

```bash
cd /home/frappe/frappe-bench

# 1. Register the new DocType with the database
bench --site balastones.localhost migrate

# 2. Clear cache so the JS/form loads fresh
bench --site balastones.localhost clear-cache

# 3. Optional: restart workers
bench restart
```

## Add Stone Enquiry link on Quotation (optional but recommended)

In ERPNext → Customise Form → Quotation → add a field:
- Label: Stone Enquiry
- Fieldname: custom_stone_enquiry
- Fieldtype: Link → Stone Enquiry

Or run in bench console:
```python
frappe.get_doc({
    "doctype": "Custom Field",
    "dt": "Quotation",
    "fieldname": "custom_stone_enquiry",
    "fieldtype": "Link",
    "label": "Stone Enquiry",
    "options": "Stone Enquiry",
    "insert_after": "amended_from",
}).insert(ignore_permissions=True)
frappe.db.commit()
```

## Sales Flow After Setup

```
Stone Enquiry (New)
    ↓  [Review & discuss]
Stone Enquiry (Reviewing)
    ↓  [Click "Convert to Customer"]
Customer record created  ←─────────────────────┐
    ↓  [Click "Create Quotation"]               │
Quotation (Draft)  ─── linked back to enquiry ──┘
    ↓  [Submit quotation, customer approves]
Sales Order
    ↓  [Deliver]
Sales Invoice
```

## Navigate to your enquiries

`/app/stone-enquiry`  
or  
Sidebar → Balan Stones → Stone Enquiry
