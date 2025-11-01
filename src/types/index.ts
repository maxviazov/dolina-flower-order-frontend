export interface Flower {
  variety: string;
  length: number;
  box_count: number;
  pack_rate: number;
  total_stems: number;
  farm_name: string;
  truck_name: string;
  price?: number;
}

export interface OrderItem {
  variety: string;
  length: number;
  box_count: number;
  pack_rate: number;
  total_stems: number;
  farm_name: string;
  truck_name: string;
  comments?: string;
  price?: number;
}

export type OrderStatus = 'pending' | 'processing' | 'farm_order' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  mark_box: string;
  customer_id: string;
  items: OrderItem[];
  status: OrderStatus;
  created_at: string;
  processed_at?: string;
  farm_order_id?: string;
  notes?: string;
  total_amount: number;
}

export interface CreateOrderRequest {
  mark_box: string;
  customer_id: string;
  items: OrderItem[];
  notes?: string;
}

export interface FlowersResponse {
  flowers: Flower[];
}