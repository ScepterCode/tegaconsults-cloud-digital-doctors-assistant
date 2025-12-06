# Hospital Accounting & Billing Department System - Design Document

## Executive Summary

A comprehensive accounting and billing system that integrates with all hospital departments to track services, generate invoices, process payments, and maintain financial records. This system ensures accurate billing, revenue tracking, and financial transparency.

---

## 1. System Overview

### Purpose
Centralize all hospital billing operations, from service delivery to payment collection, with complete audit trails and financial reporting.

### Key Objectives
- **Accurate Billing**: Capture all billable services automatically
- **Revenue Tracking**: Real-time financial monitoring
- **Patient Transparency**: Clear, itemized invoices
- **Insurance Integration**: Handle insurance claims and payments
- **Financial Reporting**: Comprehensive analytics and reports
- **Audit Compliance**: Complete transaction history

---

## 2. Billable Services & Pricing

### Service Categories

#### A. Consultation Fees
- **General Consultation**: ₦5,000 - ₦10,000
- **Specialist Consultation**: ₦15,000 - ₦30,000
- **Emergency Consultation**: ₦20,000 - ₦50,000
- **Follow-up Visit**: ₦3,000 - ₦5,000
- **Telemedicine Consultation**: ₦3,000 - ₦8,000

#### B. Laboratory Tests
- **Blood Tests**:
  - Complete Blood Count (CBC): ₦3,000
  - Blood Sugar: ₦1,500
  - Lipid Profile: ₦5,000
  - Liver Function Test: ₦8,000
  - Kidney Function Test: ₦7,000
- **Imaging**:
  - X-Ray: ₦5,000 - ₦15,000
  - Ultrasound: ₦10,000 - ₦25,000
  - CT Scan: ₦50,000 - ₦100,000
  - MRI: ₦80,000 - ₦150,000
- **Microbiology**:
  - Culture & Sensitivity: ₦8,000
  - Urinalysis: ₦2,000

#### C. Pharmacy/Medications
- **Prescription Medications**: Variable (from inventory)
- **Dispensing Fee**: ₦500 per prescription
- **Compounding Fee**: ₦1,000 (if applicable)

#### D. Procedures & Treatments
- **Minor Procedures**: ₦10,000 - ₦50,000
- **Major Procedures**: ₦100,000 - ₦500,000
- **Surgical Operations**: ₦200,000 - ₦2,000,000
- **Physiotherapy Session**: ₦5,000 - ₦10,000
- **Dialysis Session**: ₦50,000 - ₦80,000

#### E. Admission & Accommodation
- **Registration/Card Fee**: ₦1,000 - ₦2,000 (one-time)
- **Folder/File Fee**: ₦500 - ₦1,000 (one-time)
- **Bed Charges**:
  - General Ward: ₦5,000 - ₦10,000/day
  - Private Room: ₦15,000 - ₦30,000/day
  - ICU: ₦50,000 - ₦100,000/day
  - NICU: ₦60,000 - ₦120,000/day
- **Nursing Care**: ₦3,000 - ₦5,000/day
- **Feeding**: ₦2,000 - ₦5,000/day

#### F. Emergency Services
- **Emergency Room Fee**: ₦10,000 - ₦20,000
- **Ambulance Service**: ₦15,000 - ₦50,000
- **Emergency Procedures**: Variable + 50% surcharge

#### G. Administrative Fees
- **Medical Report**: ₦5,000 - ₦10,000
- **Medical Certificate**: ₦3,000 - ₦5,000
- **Referral Letter**: ₦2,000
- **Copy of Medical Records**: ₦1,000/page

---

## 3. Department Interactions & Workflow

### A. Reception/Registration → Accounting
**Trigger**: New patient registration
**Data Flow**:
```
1. Receptionist registers patient
2. System auto-generates:
   - Card/Folder fee charge
   - Registration fee charge
3. Accounting receives notification
4. Invoice created (pending payment)
5. Patient pays at cashier
6. Receipt issued
```

**Integration Points**:
- Patient ID
- Registration timestamp
- Payment status
- Receipt number

---

### B. Doctor Consultation → Accounting
**Trigger**: Doctor completes consultation
**Data Flow**:
```
1. Doctor sees patient
2. Doctor marks consultation complete
3. System auto-generates:
   - Consultation fee (based on doctor specialty)
   - Time spent (if applicable)
4. Charge added to patient's bill
5. Accounting notified
```

**Integration Points**:
- Appointment ID
- Doctor ID & specialty
- Consultation type (general/specialist/follow-up)
- Duration
- Diagnosis codes (for insurance)

---

### C. Laboratory → Accounting
**Trigger**: Lab test ordered/completed
**Data Flow**:
```
1. Doctor orders lab test
2. System auto-generates charge:
   - Test type and price
   - Urgent/stat fee (if applicable)
3. Lab tech performs test
4. Results uploaded
5. Charge confirmed and added to bill
6. Accounting receives detailed breakdown
```

**Integration Points**:
- Test order ID
- Test type and category
- Ordering doctor
- Urgency level
- Results timestamp

---

### D. Pharmacy → Accounting
**Trigger**: Prescription dispensed
**Data Flow**:
```
1. Pharmacist dispenses medication
2. System calculates:
   - Medication cost (from inventory)
   - Quantity × unit price
   - Dispensing fee
3. Total added to patient bill
4. Inventory updated
5. Accounting receives transaction
```

**Integration Points**:
- Prescription ID
- Medication details
- Quantity dispensed
- Unit price
- Total cost
- Pharmacist ID

---

### E. Admission/Ward → Accounting
**Trigger**: Patient admitted/daily charges
**Data Flow**:
```
1. Patient admitted to ward
2. System starts daily charge tracking:
   - Bed charges (per day)
   - Nursing care
   - Feeding
   - Consumables
3. Daily charges auto-generated at midnight
4. Discharge triggers final bill compilation
5. Accounting receives complete stay summary
```

**Integration Points**:
- Admission ID
- Ward/room type
- Admission date/time
- Discharge date/time
- Daily service logs
- Consumables used

---

### F. Procedures/Surgery → Accounting
**Trigger**: Procedure scheduled/completed
**Data Flow**:
```
1. Procedure scheduled
2. Accounting creates estimate:
   - Procedure fee
   - Anesthesia
   - Theatre charges
   - Consumables
   - Surgeon fees
3. Deposit requested (if major)
4. Procedure completed
5. Final charges calculated
6. Bill updated with actuals
```

**Integration Points**:
- Procedure code
- Surgeon/team IDs
- Theatre time
- Consumables used
- Anesthesia type
- Complications (if any)

---

## 4. Billing Workflow

### Patient Journey - Billing Perspective

```
REGISTRATION
    ↓
[Card Fee + Registration Fee]
    ↓
CONSULTATION
    ↓
[Consultation Fee Added]
    ↓
LAB TESTS ORDERED
    ↓
[Lab Charges Added]
    ↓
PRESCRIPTION GIVEN
    ↓
[Pharmacy Charges Added]
    ↓
ADMISSION (if needed)
    ↓
[Daily Charges Accumulate]
    ↓
PROCEDURES (if needed)
    ↓
[Procedure Charges Added]
    ↓
DISCHARGE/CHECKOUT
    ↓
[Final Bill Generated]
    ↓
PAYMENT PROCESSING
    ↓
[Receipt Issued]
```

---

## 5. Accounting Department Roles

### A. Billing Officer
**Responsibilities**:
- Generate invoices
- Process payments
- Issue receipts
- Handle payment plans
- Answer billing queries

**Access**:
- View all patient bills
- Create/edit invoices
- Process payments
- Generate receipts
- View payment history

### B. Accounts Manager
**Responsibilities**:
- Oversee billing operations
- Approve discounts/waivers
- Handle disputes
- Generate financial reports
- Manage pricing
- Insurance claims processing

**Access**:
- All billing officer functions
- Approve discounts
- Modify pricing
- Access financial reports
- Manage payment plans
- Handle refunds

### C. Cashier
**Responsibilities**:
- Collect payments
- Issue receipts
- Handle cash/card transactions
- Daily cash reconciliation
- Deposit management

**Access**:
- Process payments
- Issue receipts
- View pending bills
- Cash register management
- Daily reports

---

## 6. Payment Methods & Processing

### Payment Options
1. **Cash**: Direct payment at cashier
2. **Card**: POS terminal (Debit/Credit)
3. **Bank Transfer**: Direct bank deposit
4. **Mobile Money**: USSD/Mobile apps
5. **Insurance**: Third-party billing
6. **Payment Plans**: Installment payments
7. **Corporate**: Company billing

### Payment Workflow
```
1. Bill Generated → Patient notified
2. Payment Method Selected
3. Payment Processed
4. Receipt Generated
5. Payment Recorded
6. Services Released (if held)
7. Accounting Updated
```

---

## 7. Insurance Integration

### Insurance Workflow
```
1. Patient presents insurance card
2. System verifies coverage
3. Services provided
4. Charges accumulated
5. Insurance claim generated
6. Claim submitted to insurer
7. Patient pays co-pay/deductible
8. Insurance pays hospital
9. Transaction reconciled
```

### Insurance Features
- **Pre-authorization**: Check coverage before service
- **Claims Management**: Submit and track claims
- **Co-pay Calculation**: Auto-calculate patient portion
- **Claim Status**: Track approval/rejection
- **Reconciliation**: Match payments to claims

---

## 8. Invoicing System

### Invoice Components
```
INVOICE #INV-2024-00001
Date: 06/12/2024
Patient: John Doe (MRN: P-12345)
Insurance: XYZ Health (Policy: ABC123)

ITEMIZED CHARGES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Service              Date        Amount (₦)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Registration Fee     06/12/24      1,000
Card Fee            06/12/24      1,000
Consultation        06/12/24     10,000
Blood Test (CBC)    06/12/24      3,000
X-Ray (Chest)       06/12/24      8,000
Medications         06/12/24     15,500
Dispensing Fee      06/12/24        500
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Subtotal:                        39,000
Tax (0%):                             0
Discount (10%):                  -3,900
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL DUE:                       35,100

Insurance Coverage:              25,000
Patient Responsibility:          10,100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Payment Status: PARTIALLY PAID
Amount Paid: ₦10,100
Balance: ₦0

Payment Method: Card
Transaction ID: TXN-20241206-001
Cashier: Jane Smith
```

### Invoice Types
1. **Proforma Invoice**: Estimate before service
2. **Final Invoice**: After service completion
3. **Consolidated Invoice**: Multiple visits combined
4. **Insurance Claim**: For insurer submission
5. **Credit Note**: For refunds/adjustments

---

## 9. Financial Reports

### Daily Reports
- **Daily Cash Collection**: Total cash received
- **Payment Methods Breakdown**: Cash/Card/Transfer
- **Outstanding Bills**: Unpaid invoices
- **Deposits Received**: Advance payments
- **Refunds Issued**: Money returned

### Monthly Reports
- **Revenue by Department**: Income per department
- **Revenue by Service**: Income per service type
- **Payment Trends**: Payment method analysis
- **Outstanding Receivables**: Aging report
- **Insurance Claims**: Submitted vs paid
- **Discount Analysis**: Discounts given
- **Bad Debts**: Uncollectible amounts

### Annual Reports
- **Total Revenue**: Yearly income
- **Revenue Growth**: Year-over-year comparison
- **Department Performance**: Profitability analysis
- **Patient Demographics**: Billing patterns
- **Insurance Performance**: Claim success rates

---

## 10. Discount & Waiver Management

### Discount Types
1. **Staff Discount**: 20-50% for hospital staff
2. **Senior Citizen**: 10-15% for elderly
3. **Bulk Services**: 5-10% for multiple services
4. **Insurance Negotiated**: Pre-agreed rates
5. **Promotional**: Special offers
6. **Hardship Waiver**: Case-by-case basis

### Approval Workflow
```
1. Discount requested
2. Reason documented
3. Approval required:
   - <10%: Billing Officer
   - 10-30%: Accounts Manager
   - >30%: Hospital Admin
4. Discount applied
5. Audit trail created
```

---

## 11. Payment Plans & Credit

### Payment Plan Features
- **Installment Options**: Weekly/Monthly payments
- **Interest-Free Period**: 3-6 months
- **Down Payment**: Minimum 30% required
- **Auto-Reminders**: SMS/Email notifications
- **Default Management**: Track missed payments

### Credit Policy
- **Credit Limit**: Based on patient history
- **Corporate Accounts**: Monthly billing
- **Insurance**: Direct billing
- **Emergency Cases**: Treatment first, bill later

---

## 12. System Features & Capabilities

### Core Features
1. **Auto-Charge Generation**: Services auto-add to bill
2. **Real-Time Billing**: Live bill updates
3. **Multi-Currency**: Support for foreign patients
4. **Tax Management**: VAT/Tax calculations
5. **Receipt Printing**: Thermal/A4 receipts
6. **Email Invoices**: Digital delivery
7. **SMS Notifications**: Payment reminders
8. **Audit Trail**: Complete transaction history
9. **Refund Processing**: Handle returns
10. **Write-Off Management**: Bad debt handling

### Advanced Features
1. **Predictive Billing**: Estimate costs upfront
2. **Package Pricing**: Bundle services
3. **Loyalty Programs**: Reward frequent patients
4. **Analytics Dashboard**: Real-time metrics
5. **Integration APIs**: Connect external systems
6. **Mobile Payments**: QR code/NFC
7. **Automated Reconciliation**: Match payments
8. **Revenue Forecasting**: Predict income

---

## 13. Integration Architecture

### Data Flow Diagram
```
┌─────────────┐
│ Reception   │──→ Registration Fees
└─────────────┘
       ↓
┌─────────────┐
│ Doctor      │──→ Consultation Fees
└─────────────┘
       ↓
┌─────────────┐
│ Laboratory  │──→ Test Charges
└─────────────┘
       ↓
┌─────────────┐
│ Pharmacy    │──→ Medication Costs
└─────────────┘
       ↓
┌─────────────┐
│ Ward/ICU    │──→ Daily Charges
└─────────────┘
       ↓
       ↓
┌─────────────────────────┐
│  ACCOUNTING SYSTEM      │
│  ┌──────────────────┐   │
│  │ Charge Aggregator│   │
│  └──────────────────┘   │
│  ┌──────────────────┐   │
│  │ Invoice Generator│   │
│  └──────────────────┘   │
│  ┌──────────────────┐   │
│  │ Payment Processor│   │
│  └──────────────────┘   │
│  ┌──────────────────┐   │
│  │ Receipt Issuer   │   │
│  └──────────────────┘   │
└─────────────────────────┘
       ↓
┌─────────────┐
│ Cashier     │──→ Payment Collection
└─────────────┘
       ↓
┌─────────────┐
│ Patient     │──→ Receipt & Services
└─────────────┘
```

---

## 14. Security & Compliance

### Access Control
- **Role-Based**: Permissions by role
- **Audit Logging**: All actions logged
- **Data Encryption**: Sensitive data protected
- **Payment Security**: PCI-DSS compliance

### Compliance Requirements
- **Financial Regulations**: Tax compliance
- **Healthcare Regulations**: HIPAA/local laws
- **Audit Requirements**: Maintain records
- **Insurance Standards**: Claim formatting

---

## 15. Recommendations

### Phase 1: Core Implementation (Immediate)
1. ✅ **Service Pricing Module**
   - Create pricing database for all services
   - Allow hospital admin to manage prices
   - Support multiple price tiers (regular/insurance/staff)

2. ✅ **Auto-Charge System**
   - Integrate with existing modules (doctor, lab, pharmacy)
   - Auto-generate charges when services provided
   - Real-time bill accumulation

3. ✅ **Invoice Generation**
   - Itemized invoices with service breakdown
   - Support for discounts and taxes
   - Multiple invoice formats (patient/insurance)

4. ✅ **Payment Processing**
   - Multiple payment methods
   - Receipt generation
   - Payment tracking

### Phase 2: Enhanced Features (Short-term)
5. ✅ **Insurance Integration**
   - Insurance verification
   - Claims management
   - Co-pay calculation
   - Claim tracking

6. ✅ **Payment Plans**
   - Installment options
   - Payment reminders
   - Default tracking

7. ✅ **Financial Reports**
   - Daily/monthly/annual reports
   - Revenue analytics
   - Department performance

### Phase 3: Advanced Features (Long-term)
8. ✅ **Mobile Payments**
   - QR code payments
   - Mobile money integration
   - Online payment portal

9. ✅ **Predictive Analytics**
   - Revenue forecasting
   - Patient billing patterns
   - Service demand prediction

10. ✅ **External Integrations**
    - Bank APIs for reconciliation
    - Insurance company APIs
    - Government health systems

---

## 16. Key Performance Indicators (KPIs)

### Financial KPIs
- **Revenue per Patient**: Average billing amount
- **Collection Rate**: Payments received / Total billed
- **Outstanding Receivables**: Unpaid bills aging
- **Discount Rate**: Discounts / Total revenue
- **Insurance Claim Success**: Approved / Submitted

### Operational KPIs
- **Billing Accuracy**: Errors / Total bills
- **Invoice Generation Time**: Speed of billing
- **Payment Processing Time**: Transaction speed
- **Dispute Resolution Time**: Query handling
- **Staff Productivity**: Bills processed per staff

---

## 17. User Interface Recommendations

### Billing Officer Dashboard
```
┌─────────────────────────────────────────┐
│ BILLING DASHBOARD                       │
├─────────────────────────────────────────┤
│ Today's Collections: ₦2,450,000         │
│ Pending Bills: 45                       │
│ Outstanding: ₦1,200,000                 │
└─────────────────────────────────────────┘

Recent Activities:
• Invoice #INV-001 - John Doe - ₦35,000 PAID
• Invoice #INV-002 - Jane Smith - ₦120,000 PENDING
• Payment Plan - Mike Johnson - ₦50,000/month

Quick Actions:
[Generate Invoice] [Process Payment] [View Reports]
```

### Patient Bill View
```
┌─────────────────────────────────────────┐
│ PATIENT BILL - John Doe (MRN: P-12345)  │
├─────────────────────────────────────────┤
│ Current Balance: ₦35,100                │
│ Status: UNPAID                          │
├─────────────────────────────────────────┤
│ Itemized Charges:                       │
│ • Consultation: ₦10,000                 │
│ • Lab Tests: ₦11,000                    │
│ • Medications: ₦16,000                  │
│ • Discount: -₦3,900                     │
├─────────────────────────────────────────┤
│ [View Details] [Process Payment] [Print]│
└─────────────────────────────────────────┘
```

---

## 18. Implementation Priority

### Must-Have (MVP)
1. Service pricing database
2. Auto-charge from departments
3. Invoice generation
4. Payment processing
5. Receipt printing
6. Basic reports

### Should-Have (Phase 2)
1. Insurance integration
2. Payment plans
3. Discount management
4. Advanced reports
5. Email/SMS notifications

### Nice-to-Have (Phase 3)
1. Mobile payments
2. Predictive analytics
3. External API integrations
4. Patient portal
5. Automated reconciliation

---

## Conclusion

The Accounting & Billing Department system is the financial backbone of the hospital. By automating charge capture, streamlining billing, and providing comprehensive financial visibility, this system will:

- **Increase Revenue**: Capture all billable services
- **Reduce Errors**: Automated charge generation
- **Improve Cash Flow**: Faster payment processing
- **Enhance Transparency**: Clear, itemized billing
- **Support Decision-Making**: Comprehensive financial reports
- **Ensure Compliance**: Complete audit trails

**Next Steps**: Review this design, prioritize features, and begin Phase 1 implementation with the core billing functionality.

