# Pharmacy Inventory Management System

## Overview
A comprehensive inventory management system for tracking medications, supplies, stock levels, expiry dates, and transactions in hospital pharmacies.

## Key Features

### 1. Medication Tracking
- **Brand & Generic Names**: Track both brand and generic medication names
- **Categories**: Organize by type (antibiotics, painkillers, antivirals, etc.)
- **Dosage Forms**: Tablets, capsules, syrups, injections, creams, drops, inhalers
- **Strength**: Track dosage strength (e.g., 500mg, 10ml)
- **Batch Numbers**: Track specific batches for recalls
- **Supplier Information**: Record supplier details

### 2. Stock Management
- **Current Stock Levels**: Real-time quantity tracking
- **Reorder Levels**: Automatic low stock alerts
- **Stock Adjustments**: 
  - Restock (add inventory)
  - Dispense (remove for prescriptions)
  - Expired (remove expired items)
  - Adjustment (corrections)
- **Location Tracking**: Shelf/cabinet locations
- **Transaction History**: Complete audit trail

### 3. Expiry Management
- **Expiry Date Tracking**: Monitor medication expiration
- **Expired Items Alert**: Identify expired medications
- **Expiring Soon Alert**: 30-day advance warning
- **Batch Tracking**: Link expiry to specific batches

### 4. Financial Tracking
- **Unit Pricing**: Track cost per unit
- **Total Value**: Calculate inventory value
- **Stock Value**: Real-time inventory valuation
- **Cost Analysis**: By category and medication

### 5. Alerts & Notifications
- **Low Stock Alerts**: When quantity ≤ reorder level
- **Expiry Alerts**: 30 days before expiration
- **Expired Items**: Immediate identification
- **Reorder Recommendations**: Based on usage patterns

## User Roles & Access

### Pharmacists
- **Full Access**: Add, edit, adjust stock
- **Dispense Medications**: Link to prescriptions
- **Stock Management**: Restock and adjustments
- **View Reports**: Inventory statistics

### Hospital Admins
- **Full Access**: All pharmacist features
- **Delete Items**: Remove inventory items
- **View All Transactions**: Complete audit trail
- **Financial Reports**: Inventory value and costs

### System Admins
- **View Only**: Monitor across hospitals
- **Reports**: System-wide inventory statistics

## Medication Categories

1. **Antibiotic** - Bacterial infection treatments
2. **Painkiller** - Pain management medications
3. **Antiviral** - Viral infection treatments
4. **Antifungal** - Fungal infection treatments
5. **Antihistamine** - Allergy medications
6. **Antacid** - Digestive medications
7. **Vitamin** - Vitamin supplements
8. **Supplement** - Nutritional supplements
9. **Injection** - Injectable medications
10. **Other** - Miscellaneous medications

## Dosage Forms

1. **Tablet** - Solid oral medication
2. **Capsule** - Encapsulated medication
3. **Syrup** - Liquid oral medication
4. **Injection** - Injectable solution
5. **Cream** - Topical application
6. **Drops** - Eye/ear drops
7. **Inhaler** - Respiratory medication

## Workflow Examples

### Adding New Medication
```
1. Click "Add Medication"
2. Enter medication details:
   - Name (brand and generic)
   - Category and dosage form
   - Strength (e.g., 500mg)
   - Initial quantity
   - Reorder level
   - Unit price
   - Supplier
   - Batch number
   - Expiry date
   - Location
3. Click "Add to Inventory"
4. System creates initial stock transaction
```

### Restocking Medication
```
1. Find medication in inventory
2. Click adjust stock button
3. Select "Restock (Add)"
4. Enter quantity received
5. Add notes (e.g., "Received from Supplier X")
6. Confirm adjustment
7. Stock level updated
8. Transaction recorded
```

### Dispensing for Prescription
```
1. Pharmacist receives prescription
2. Find medication in inventory
3. Click adjust stock button
4. Select "Dispense (Remove)"
5. Enter quantity dispensed
6. Link to prescription ID
7. Add notes if needed
8. Confirm adjustment
9. Stock reduced
10. Transaction linked to prescription
```

### Handling Expired Medications
```
1. System shows "Expired" badge
2. Pharmacist reviews expired items
3. Click adjust stock button
4. Select "Mark as Expired (Remove)"
5. Enter quantity to remove
6. Add disposal notes
7. Confirm adjustment
8. Stock removed from inventory
9. Transaction recorded for audit
```

## Dashboard Statistics

### Overview Cards
- **Total Items**: Number of unique medications
- **Total Value**: ₦ value of all inventory
- **Low Stock Items**: Count of items needing reorder
- **Expired Items**: Count of expired medications
- **Expiring Soon**: Items expiring within 30 days

### Category Breakdown
- Distribution of inventory by category
- Helps identify stock composition

## Inventory Views

### All Items
- Complete inventory list
- Search by name or generic name
- Filter by category
- Sort by various fields

### Low Stock
- Items at or below reorder level
- Priority for restocking
- Prevents stockouts

### Expired
- Medications past expiry date
- Requires immediate action
- Disposal tracking

### Expiring Soon
- Items expiring within 30 days
- Plan usage or disposal
- Prevent waste

## Transaction Types

### Restock
- **Purpose**: Add new inventory
- **Effect**: Increases stock
- **Use Case**: Receiving shipment from supplier
- **Notes**: Record supplier, batch, expiry

### Dispense
- **Purpose**: Remove for patient use
- **Effect**: Decreases stock
- **Use Case**: Filling prescription
- **Notes**: Link to prescription ID

### Expired
- **Purpose**: Remove expired items
- **Effect**: Decreases stock
- **Use Case**: Disposing expired medication
- **Notes**: Record disposal method

### Adjustment
- **Purpose**: Correct stock errors
- **Effect**: Can increase or decrease
- **Use Case**: Fixing count discrepancies
- **Notes**: Explain reason for adjustment

## API Endpoints

### Get Inventory
```
GET /api/pharmacy-inventory?hospital_id={id}&category={cat}&low_stock={bool}&expired={bool}
Response: List of inventory items
```

### Add Medication
```
POST /api/pharmacy-inventory?hospital_id={id}&user_id={id}
Body: InventoryCreate object
Response: Created item
```

### Update Medication
```
PUT /api/pharmacy-inventory/{item_id}?user_id={id}
Body: InventoryUpdate object
Response: Updated item
```

### Adjust Stock
```
POST /api/pharmacy-inventory/{item_id}/adjust-stock?user_id={id}
Body: {
  quantity: number,
  transaction_type: string,
  notes: string,
  prescription_id: string (optional)
}
Response: Updated item
```

### Get Transactions
```
GET /api/pharmacy-inventory/{item_id}/transactions
Response: Transaction history
```

### Get Statistics
```
GET /api/pharmacy-inventory/stats/summary?hospital_id={id}
Response: Inventory statistics
```

### Delete Item
```
DELETE /api/pharmacy-inventory/{item_id}?user_id={id}
Response: Success message
```

## Database Models

### PharmacyInventory
- id (UUID)
- hospital_id
- medication_name
- generic_name
- category
- dosage_form
- strength
- quantity_in_stock
- reorder_level
- unit_price
- supplier
- batch_number
- expiry_date
- location
- notes
- created_at
- updated_at

### InventoryTransaction
- id (UUID)
- inventory_id
- transaction_type
- quantity
- previous_quantity
- new_quantity
- performed_by (User ID)
- prescription_id (optional)
- notes
- transaction_date

## Best Practices

### Stock Management
1. **Regular Audits**: Conduct physical counts monthly
2. **FIFO Method**: First In, First Out for expiry management
3. **Reorder Levels**: Set based on usage patterns
4. **Safety Stock**: Maintain buffer for critical medications

### Expiry Management
1. **Monthly Reviews**: Check expiring items
2. **Rotation**: Use older stock first
3. **Alerts**: Act on 30-day warnings
4. **Disposal**: Follow proper disposal protocols

### Data Entry
1. **Accuracy**: Double-check medication names
2. **Batch Numbers**: Always record for traceability
3. **Expiry Dates**: Verify from packaging
4. **Locations**: Keep updated for quick access

### Transaction Notes
1. **Be Specific**: Clear, detailed notes
2. **Include References**: Supplier invoices, prescription IDs
3. **Explain Adjustments**: Reason for corrections
4. **Disposal Records**: Method and authorization

## Reports & Analytics

### Available Reports
1. **Inventory Valuation**: Total stock value
2. **Low Stock Report**: Items needing reorder
3. **Expiry Report**: Expired and expiring items
4. **Usage Report**: Dispensing patterns
5. **Category Analysis**: Stock by category
6. **Transaction History**: Complete audit trail

### Key Metrics
- **Stock Turnover**: How quickly inventory moves
- **Expiry Rate**: Percentage of expired items
- **Stockout Frequency**: How often items run out
- **Inventory Value**: Total investment in stock

## Security & Compliance

### Access Control
- Role-based permissions
- Transaction audit trail
- User accountability

### Regulatory Compliance
- Batch tracking for recalls
- Expiry date monitoring
- Disposal documentation
- Transaction history

### Data Integrity
- All changes logged
- Cannot delete transactions
- Audit trail preserved
- User attribution

## Setup Instructions

### 1. Create Tables
```bash
python migrate_pharmacy_inventory.py
```

### 2. Access System
- **Pharmacists**: Navigate to "Pharmacy Inventory"
- **Hospital Admins**: Access via sidebar

### 3. Initial Setup
1. Add all current medications
2. Set reorder levels
3. Enter expiry dates
4. Assign locations

## Future Enhancements

1. **Barcode Scanning**: Quick item lookup
2. **Auto-Reordering**: Automatic purchase orders
3. **Supplier Integration**: Direct ordering
4. **Usage Analytics**: Predictive reordering
5. **Mobile App**: Inventory on the go
6. **Batch Expiry Alerts**: Email notifications
7. **Integration with Prescriptions**: Auto-dispense
8. **Multi-Location**: Track across multiple pharmacies

## Troubleshooting

### Stock Discrepancy
1. Review transaction history
2. Conduct physical count
3. Use "Adjustment" transaction type
4. Document reason in notes

### Missing Medication
1. Check all locations
2. Review recent transactions
3. Verify not expired/disposed
4. Add if truly missing

### Incorrect Expiry Date
1. Edit medication details
2. Update expiry date
3. Document correction
4. Verify from packaging

## Support

For inventory issues:
1. Check transaction history
2. Review recent adjustments
3. Contact hospital admin
4. Conduct physical audit if needed

---

**Note**: This system helps maintain accurate inventory records, prevent stockouts, manage expiry dates, and ensure medication availability for patient care.
