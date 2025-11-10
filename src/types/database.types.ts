export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      // All 18 tables with full type definitions
      // Generated from Supabase schema
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Product Name Types
export interface ProductName {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  store_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Product Template Types
export interface ProductTemplate {
  id: string;
  name: string;
  product_name_id: string | null;
  sku: string | null;
  category_id: string | null;
  unit: string;
  mrp: number | null;
  has_ingredients: boolean; // TRUE for recipe-based, FALSE for purchased products
  producible_quantity: number | null; // How many units can be made with the recipe
  store_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductTemplateWithDetails extends ProductTemplate {
  product_name: string | null;
  category_name: string | null;
  ingredient_count: number;
}

export interface ProductIngredient {
  id: string;
  product_template_id: string;
  raw_material_id: string;
  quantity_needed: number;
  unit: string;
  store_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProductIngredientWithDetails extends ProductIngredient {
  raw_material_name: string;
  available_stock: number;
  stock_unit: string;
}

// Recipe Batch Types
export interface RecipeBatch {
  id: string;
  product_template_id: string;
  batch_name: string;
  producible_quantity: number;
  is_default: boolean;
  store_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipeBatchIngredient {
  id: string;
  recipe_batch_id: string;
  raw_material_id: string;
  quantity_needed: number;
  unit: string;
  store_id: string;
  created_at: string;
  updated_at: string;
}

export interface RecipeBatchWithIngredients extends RecipeBatch {
  ingredients: RecipeBatchIngredient[];
}

export interface RecipeBatchIngredientWithDetails extends RecipeBatchIngredient {
  raw_material_name: string;
  available_stock: number;
  stock_unit: string;
}

export interface RawMaterialStock {
  id: string;
  raw_material_id: string;
  store_id: string;
  unit: string;
  quantity: number;
  purchase_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RawMaterialUsageLog {
  id: string;
  raw_material_id: string;
  store_id: string;
  quantity_used: number;
  unit: string;
  usage_type: 'sale' | 'production' | 'wastage' | 'adjustment';
  reference_type: string | null;
  reference_id: string | null;
  unit_cost: number | null;
  total_cost: number | null;
  used_at: string;
  notes: string | null;
  created_at: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  store_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Production Log Types
export interface ProductionLog {
  id: string;
  product_id: string;
  product_template_id: string;
  product_name: string;
  recipe_batch_id: string | null;
  batch_name: string;
  quantity_produced: number;
  unit: string;
  produced_at: string;
  production_date: string;
  produced_by: string | null;
  store_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductionLogIngredient {
  id: string;
  production_log_id: string;
  raw_material_id: string;
  raw_material_name: string;
  quantity_used: number;
  unit: string;
  unit_cost: number | null;
  total_cost: number | null;
  store_id: string;
  created_at: string;
}

export interface ProductionLogWithDetails extends ProductionLog {
  ingredients: ProductionLogIngredient[];
  produced_by_name: string | null;
  ingredient_count: number;
  has_ingredients: boolean;
  template_yield: number | null;
}

// Stock Expiration Types
export interface StockExpiration {
  id: string;
  store_id: string;
  item_type: 'raw_material' | 'tea_stock' | 'product';
  item_id: string | null;
  item_name: string;
  sku: string | null;
  quantity_expired: number;
  unit: string;
  stock_before_expiration: number;
  stock_after_expiration: number;
  expired_date: string;
  expired_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpirationSummary {
  store_id: string;
  item_name: string;
  item_type: 'raw_material' | 'tea_stock' | 'product';
  sku: string | null;
  unit: string;
  expiration_count: number;
  total_quantity_expired: number;
  first_expiration_date: string;
  last_expiration_date: string;
  last_updated: string;
}

export interface ExpirationDetail {
  id: string;
  item_type: 'raw_material' | 'tea_stock' | 'product';
  item_name: string;
  sku: string | null;
  quantity_expired: number;
  unit: string;
  stock_before_expiration: number;
  stock_after_expiration: number;
  expired_date: string;
  expired_by_name: string | null;
  notes: string | null;
  created_at: string;
}

export interface AvailableStockItem {
  id: string;
  name: string;
  type: 'raw_material' | 'tea_stock' | 'product';
  sku: string | null;
  current_stock: number;
  unit: string;
}
