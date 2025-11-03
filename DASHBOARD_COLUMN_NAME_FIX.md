# Dashboard Column Name Fix

## Issue
The petty cash modals were using incorrect column name `given_to` which doesn't exist in the database.

## Error Message
```
column petty_cash.given_to does not exist
Hint: Perhaps you meant to reference the column "petty_cash.recipient_name"
```

## Root Cause
The `petty_cash` table uses `recipient_name` as the column name, not `given_to`.

## Actual Table Structure
```sql
petty_cash table columns:
- id (uuid)
- petty_cash_number (text)
- recipient_name (text)  ← Correct column name
- amount (numeric)
- given_date (date)
- purpose (text)
- notes (text)
- created_by (uuid)
- created_at (timestamp)
- updated_at (timestamp)
- store_id (uuid)
```

## Files Fixed

### 1. PettyCashDetailsModal.tsx
**Changed:**
- Interface: `given_to` → `recipient_name`
- Display: `record.given_to` → `record.recipient_name`

### 2. TotalCostsDetailsModal.tsx
**Changed:**
- Query: `.select('amount, given_to, purpose, given_date')` → `.select('amount, recipient_name, purpose, given_date')`
- Mapping: `item.given_to` → `item.recipient_name`

### 3. Documentation Updates
**Files Updated:**
- DASHBOARD_VISUAL_GUIDE.md
- DASHBOARD_QUICK_REFERENCE.md
- DASHBOARD_TESTING_GUIDE.md

**Changed:** "Given To" → "Recipient Name" in all table column references

## Testing
✅ TypeScript compilation: SUCCESS
✅ Build: SUCCESS
✅ No diagnostics errors

## Status
**FIXED** ✅

The modals now correctly reference `recipient_name` and will load petty cash data without errors.
