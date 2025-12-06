# Billing System - Quick Start Guide

## ✅ System Ready!

### User Accounts Created

**1. Cashier**
- Username: `cashier1`
- Password: `cashier123`
- Role: Collect payments, issue receipts

**2. Billing Officer**
- Username: `billing1`
- Password: `billing123`
- Role: Generate invoices, process payments, apply discounts (<10%)

**3. Accounts Manager**
- Username: `accountant1`
- Password: `accountant123`
- Role: Approve discounts, view reports, manage billing operations

**4. Hospital Admin** (Full Access)
- Username: `hospitaladmin`
- Password: `admin123`
- Role: Manage pricing, approve all discounts, view all reports

---

## How to Access

### Frontend
1. Open: http://localhost:5173
2. Login with any billing account above
3. Click "Billing & Payments" in sidebar
4. View dashboard with daily statistics

### Backend API
Base URL: http://localhost:5000/api/billing

---

## Quick Test Workflow

### 1. View Service Pricing
```bash
# Get all services
curl "http://localhost:5000/api/billing/pricing?hospital_id=5f98058e-9bd6-4c92-9f8f-13b58b4c36f9"
```

### 2. Add a Charge (Auto-Charge)
```bash
# Example: Add consultation fee
curl -X POST "http://localhost:5000/api/billing/charges/add?user_id=USER_ID&hospital_id=HOSPITAL_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "PATIENT_ID",
    "service_category": "consultation",
    "service_name": "General Consultation",
    "quantity": 1
  }'
```

### 3. View Daily Report
```bash
curl "http://localhost:5000/api/billing/reports/daily?hospital_id=5f98058e-9bd6-4c92-9f8f-13b58b4c36f9"
```

---

## Features Available

### ✅ Working Now
1. **Service Pricing** - 61 pre-configured services
2. **Auto-Charge System** - Add charges from any department
3. **Bill Management** - View and manage patient bills
4. **Discount Approval** - Workflow based on amount
5. **Payment Processing** - Multiple payment methods
6. **Receipt Generation** - Automatic receipts
7. **Financial Reports** - Daily and monthly reports
8. **Audit Trail** - Complete transaction history

### 🚧 Coming Soon (Frontend)
1. Service Pricing Management Page
2. Patient Bill Detail View
3. Payment Processing Interface
4. Receipt Viewer/Printer
5. Financial Reports Dashboard

---

## Service Categories & Pricing

### Consultations
- General Consultation: ₦7,500
- Specialist Consultation: ₦20,000
- Emergency Consultation: ₦35,000
- Follow-up Visit: ₦4,000
- Telemedicine: ₦5,000

### Laboratory Tests
- Complete Blood Count: ₦3,000
- Blood Sugar: ₦1,500
- X-Ray (Chest): ₦8,000
- Ultrasound: ₦15,000
- CT Scan: ₦75,000
- MRI Scan: ₦120,000

### Ward Charges (per day)
- General Ward: ₦7,500
- Private Room: ₦20,000
- ICU: ₦75,000
- NICU: ₦90,000
- Nursing Care: ₦4,000
- Feeding: ₦3,000

### Procedures
- Wound Dressing: ₦3,000
- Suturing: ₦5,000
- Appendectomy: ₦250,000
- Cesarean Section: ₦300,000
- Dialysis Session: ₦65,000

### Administrative
- Registration Fee: ₦1,000
- Card/Folder Fee: ₦1,000
- Medical Report: ₦7,500
- Medical Certificate: ₦4,000

**Total: 61 services across 7 categories**

---

## Role Permissions

### Cashier
- ✅ Collect payments
- ✅ Issue receipts
- ✅ View pending bills
- ✅ Daily cash reconciliation
- ❌ Cannot apply discounts
- ❌ Cannot modify pricing

### Billing Officer
- ✅ All cashier functions
- ✅ Generate invoices
- ✅ Process payments
- ✅ Apply discounts (<10%)
- ✅ View payment history
- ❌ Cannot approve large discounts
- ❌ Cannot modify pricing

### Accounts Manager
- ✅ All billing officer functions
- ✅ Approve discounts (10-30%)
- ✅ View financial reports
- ✅ Handle disputes
- ✅ Revenue analytics
- ❌ Cannot modify pricing
- ❌ Cannot approve >30% discounts

### Hospital Admin
- ✅ All accounts manager functions
- ✅ Manage service pricing
- ✅ Approve all discounts (>30%)
- ✅ Access all financial reports
- ✅ System configuration

---

## Integration Points

### Auto-Charge from Departments

**Reception → Billing**
```python
# When patient registers
add_charge(
    patient_id="P-001",
    service_category="admin",
    service_name="Registration Fee"
)
# → Adds ₦1,000 to bill
```

**Doctor → Billing**
```python
# When consultation completes
add_charge(
    patient_id="P-001",
    service_category="consultation",
    service_name="General Consultation",
    performed_by=doctor_id
)
# → Adds ₦7,500 to bill
```

**Laboratory → Billing**
```python
# When test is ordered
add_charge(
    patient_id="P-001",
    service_category="laboratory",
    service_name="Complete Blood Count (CBC)"
)
# → Adds ₦3,000 to bill
```

**Pharmacy → Billing**
```python
# When medication dispensed
add_charge(
    patient_id="P-001",
    service_category="pharmacy",
    service_name="Dispensing Fee"
)
# → Adds ₦500 + medication cost
```

**Ward → Billing**
```python
# Daily at midnight
add_charge(
    patient_id="P-001",
    service_category="ward",
    service_name="General Ward Bed (per day)"
)
# → Adds ₦7,500 daily
```

---

## Next Steps

### For Testing
1. Login as `billing1` / `billing123`
2. View the billing dashboard
3. Check daily statistics
4. Test API endpoints with curl

### For Development
1. Complete frontend pages (pricing, bill view, payment)
2. Integrate auto-charge with existing modules
3. Add receipt printing functionality
4. Create financial reports dashboard

### For Production
1. Configure actual hospital pricing
2. Set up payment gateway integration
3. Configure receipt printer
4. Train billing staff
5. Set up backup procedures

---

## Support

**Backend API**: ✅ Fully functional
**Frontend**: ✅ Dashboard ready, additional pages in progress
**Database**: ✅ All tables created and initialized
**User Accounts**: ✅ All roles created

For issues or questions, check:
- Backend logs in terminal
- Browser console for frontend errors
- Database: local_dev.db

---

**Status**: Phase 1 Backend Complete, Frontend Dashboard Ready
**Next**: Complete remaining frontend pages and integrate with departments
