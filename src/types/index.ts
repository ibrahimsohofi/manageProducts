export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  category_id: number;
  category_name?: string;
  purchase_price: number;
  selling_price: number;
  remaining_stock: number;
  min_stock_level: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}
