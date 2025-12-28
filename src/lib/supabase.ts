import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ydfnnneqdewzebitmqrl.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZm5ubmVxZGV3emViaXRtcXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NTQ2NTcsImV4cCI6MjA4MjQzMDY1N30.VIOW1t_gfsPCbZHv5K3P_dqP0s3eSm76htNqj62cxew";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: 'admin' | 'employee';
  hourly_rate: number;
  is_on_duty: boolean;
  fivem_identifier?: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  stock: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  user_id: string;
  total: number;
  status: 'completed' | 'pending' | 'cancelled';
  payment_method: 'cash' | 'card' | 'banking';
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface Shift {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  total_hours?: number;
  created_at: string;
}
