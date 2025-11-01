export const APP_NAME = 'Tea Boys Management'
export const APP_VERSION = '1.0.0'

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  BAKER: 'baker',
} as const

export const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Credit'] as const

export const PRODUCT_TYPES = ['made_in_house', 'bought_out'] as const

export const BATCH_STATUS = ['active', 'expired', 'depleted'] as const

export const EXPIRY_STATUS = {
  EXPIRED: 'expired',
  CRITICAL: 'critical',
  WARNING: 'warning',
  GOOD: 'good',
} as const
