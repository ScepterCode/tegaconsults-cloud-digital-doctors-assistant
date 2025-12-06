# Hospital Subscription Management System

## Overview
A comprehensive subscription billing system for managing hospital subscriptions with automatic trial periods, flexible pricing, and role-based access control.

## Key Features

### 1. Automatic 60-Day Trial Period
- Every new hospital automatically gets a 60-day free trial
- Trial countdown visible to hospital admins
- Automatic expiration after 60 days
- Alerts when trial is ending (7 days before expiration)

### 2. Flexible Subscription Plans

#### Monthly Plan
- **Price**: ₦150,000/month
- **Duration**: 30 days
- **Best for**: Small to medium hospitals testing the system

#### Yearly Plan
- **Price**: ₦1,400,000/year
- **Duration**: 365 days
- **Savings**: ₦400,000 compared to monthly (₦1,800,000 - ₦1,400,000)
- **Best for**: Established hospitals with long-term commitment

### 3. Role-Based Access

#### Hospital Admin
- View subscription status and expiration
- Subscribe to monthly or yearly plans
- Make payments and enter payment references
- View payment history
- Receive subscription alerts
- **Access**: `/subscription` page

#### System Admin
- View all hospital subscriptions
- Monitor payment status across all hospitals
- See which hospitals have paid vs unpaid
- Manually adjust subscription pricing
- View revenue statistics
- Identify hospitals needing renewal
- **Access**: `/system-subscriptions` page

#### Other Staff (Doctors, Nurses, etc.)
- **No billing access** - Only hospital admins handle subscriptions
- Staff can focus on patient care without billing concerns

## Subscription Status Types

### Trial
- **Duration**: 60 days from hospital creation
- **Status**: Active during trial period
- **Access**: Full system access
- **Alert**: Warning 7 days before expiration

### Active
- **Status**: Paid subscription (monthly or yearly)
- **Access**: Full system access
- **Renewal**: Required before expiration date

### Expired
- **Status**: Trial ended or subscription expired
- **Access**: Limited (read-only or blocked)
- **Action Required**: Subscribe to continue

## Hospital Admin Workflow

### 1. View Subscription Status
```
Navigate to: Subscription & Billing
See:
- Current plan type (Trial/Monthly/Yearly)
- Days remaining
- Expiration date
- Payment history
```

### 2. Subscribe to a Plan
```
1. Click "Subscribe Now" on desired plan
2. Select payment method (Bank Transfer/Card/USSD)
3. Make payment to provided bank account
4. Enter payment reference/transaction ID
5. Click "Confirm Subscription"
6. Subscription activated immediately
```

### 3. Renewal Process
```
- System shows alert 7 days before expiration
- Follow same subscription process
- New subscription period starts after current expires
- No service interruption if renewed before expiration
```

## System Admin Workflow

### 1. Monitor All Subscriptions
```
Navigate to: Subscriptions
View tabs:
- All: All hospital subscriptions
- Active: Currently paid subscriptions
- Trial: Hospitals on trial period
- Expired: Subscriptions that need renewal
- Needs Renewal: Expiring within 7 days
```

### 2. View Statistics
```
Dashboard shows:
- Total hospitals
- Active subscriptions
- Hospitals on trial
- Expired subscriptions
- Total revenue generated
```

### 3. Adjust Pricing
```
1. Click "Manage Pricing"
2. Select plan type (Monthly/Yearly)
3. Enter new price
4. Update description (optional)
5. Click "Update Pricing"
6. New pricing applies to future subscriptions
```

### 4. Identify Payment Issues
```
- Filter by "Expired" to see unpaid hospitals
- Filter by "Needs Renewal" for upcoming expirations
- Contact hospital admins for payment follow-up
```

## API Endpoints

### Get Pricing
```
GET /api/subscriptions/pricing
Response: List of available plans with prices
```

### Update Pricing (System Admin Only)
```
PUT /api/subscriptions/pricing/{plan_type}
Headers: user-id: <system_admin_id>
Body: {
  plan_type: "monthly" | "yearly",
  price: number,
  description: string
}
```

### Get Hospital Subscription
```
GET /api/subscriptions/hospital/{hospital_id}
Response: Current subscription details
```

### Subscribe/Renew
```
POST /api/subscriptions/subscribe
Headers: user-id: <hospital_admin_id>
Body: {
  hospital_id: string,
  plan_type: "monthly" | "yearly",
  payment_reference: string,
  payment_method: string
}
```

### Get All Subscriptions (System Admin Only)
```
GET /api/subscriptions/all?admin_id=<system_admin_id>
Response: All hospital subscriptions with status
```

### Get Payment History
```
GET /api/subscriptions/payment-history/{hospital_id}?user_id=<user_id>
Response: List of all payments for hospital
```

## Database Models

### Subscription
- hospital_id (unique)
- plan_type (trial/monthly/yearly)
- status (trial/active/expired)
- trial_start_date
- trial_end_date
- subscription_start_date
- subscription_end_date
- amount_paid
- payment_reference
- auto_renew (future feature)

### SubscriptionPricing
- plan_type (monthly/yearly)
- price
- currency (NGN)
- description

### PaymentHistory
- hospital_id
- subscription_id
- amount
- payment_method
- payment_reference
- status (pending/completed/failed)
- paid_by (hospital admin user ID)
- payment_date

## Alerts & Notifications

### Hospital Admin Alerts
1. **Trial Ending Soon** (7 days before)
   - "Your trial expires in X days. Subscribe to continue."
   
2. **Trial Expired**
   - "Your trial has expired. Please subscribe to continue using the service."
   
3. **Subscription Expiring Soon** (7 days before)
   - "Your subscription expires in X days. Please renew to avoid interruption."
   
4. **Subscription Expired**
   - "Your subscription has expired. Please renew to continue."

### System Admin Alerts
1. **Revenue Dashboard**
   - Total revenue from all subscriptions
   
2. **Expiration Warnings**
   - List of hospitals with expiring subscriptions
   
3. **Unpaid Hospitals**
   - Hospitals with expired subscriptions

## Payment Methods Supported

1. **Bank Transfer**
   - Hospital admin makes transfer
   - Enters transaction reference
   - System admin can verify

2. **Card Payment** (Future)
   - Online card processing
   - Instant activation

3. **USSD** (Future)
   - Mobile banking USSD codes
   - Quick payment option

## Revenue Tracking

### For System Admin
- **Total Revenue**: Sum of all payments
- **Monthly Recurring Revenue (MRR)**: Active monthly subscriptions × ₦150,000
- **Annual Recurring Revenue (ARR)**: Active yearly subscriptions × ₦1,400,000
- **Churn Rate**: Expired subscriptions / Total subscriptions

## Security & Access Control

### Hospital Admin
- Can only view/manage their own hospital's subscription
- Cannot see other hospitals' billing information
- Cannot modify pricing

### System Admin
- Can view all hospital subscriptions
- Can modify pricing for all plans
- Cannot make payments on behalf of hospitals
- Full visibility into revenue and payment status

### Other Staff
- **No access** to billing/subscription features
- Focus on clinical and operational tasks
- Hospital admin handles all financial matters

## Setup Instructions

### 1. Initialize Subscription System
```bash
# Create subscription tables
python migrate_subscriptions.py

# Initialize default pricing and trials
python init_subscriptions.py
```

### 2. Default Configuration
- Monthly: ₦150,000
- Yearly: ₦1,400,000
- Trial Period: 60 days
- Renewal Alert: 7 days before expiration

### 3. Customize Pricing
- Login as system admin
- Navigate to Subscriptions
- Click "Manage Pricing"
- Update prices as needed

## Future Enhancements

1. **Automatic Payment Integration**
   - Paystack/Flutterwave integration
   - Automatic subscription activation
   - Recurring billing

2. **Email Notifications**
   - Automated expiration reminders
   - Payment receipts
   - Renewal confirmations

3. **Usage-Based Pricing**
   - Per-user pricing tiers
   - Feature-based plans
   - Custom enterprise plans

4. **Grace Period**
   - 3-7 day grace period after expiration
   - Reduced functionality during grace period

5. **Discount Codes**
   - Promotional discounts
   - Referral bonuses
   - Bulk purchase discounts

## Troubleshooting

### Hospital Admin Can't Subscribe
- Verify user has `hospital_admin` role
- Check if hospital_id is correct
- Ensure payment reference is entered

### Subscription Not Activating
- Verify payment reference is unique
- Check if API returned success
- Refresh page to see updated status

### Pricing Not Updating
- Verify user has `system_admin` role
- Check if price is a valid number
- Ensure API call includes admin_id

## Support

For subscription issues:
1. Hospital admins contact system admin
2. System admin can view subscription status
3. Manual adjustments can be made if needed
4. Payment verification through bank statements

---

**Note**: This is a demo system. In production, integrate with actual payment gateways (Paystack, Flutterwave) for automated payment processing and verification.
