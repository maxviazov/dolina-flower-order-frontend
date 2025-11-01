import { create } from 'zustand';
import { Order, OrderItem, CreateOrderRequest } from '../types';
import { ordersApi } from '../services/api';

interface OrderState {
  currentOrder: Order | null;
  orderItems: OrderItem[];
  loading: boolean;
  error: string | null;
  orderForm: {
    markBox: string;
    customerId: string;
    notes: string;
  };
  addItem: (item: OrderItem) => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, item: OrderItem) => void;
  setOrderForm: (form: Partial<OrderState['orderForm']>) => void;
  createOrder: () => Promise<string | null>;
  fetchOrder: (id: string) => Promise<void>;
  clearOrder: () => void;
  getTotalAmount: () => number;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  currentOrder: null,
  orderItems: [],
  loading: false,
  error: null,
  orderForm: {
    markBox: '',
    customerId: '',
    notes: '',
  },

  addItem: (item) => set((state) => ({ 
    orderItems: [...state.orderItems, item] 
  })),

  removeItem: (index) => set((state) => ({
    orderItems: state.orderItems.filter((_, i) => i !== index)
  })),

  updateItem: (index, item) => set((state) => ({
    orderItems: state.orderItems.map((existingItem, i) => 
      i === index ? item : existingItem
    )
  })),

  setOrderForm: (form) => set((state) => ({
    orderForm: { ...state.orderForm, ...form }
  })),

  createOrder: async () => {
    const { orderItems, orderForm } = get();
    
    if (orderItems.length === 0) {
      set({ error: 'Добавьте товары в заказ' });
      return null;
    }

    if (!orderForm.markBox || !orderForm.customerId) {
      set({ error: 'Заполните обязательные поля' });
      return null;
    }

    set({ loading: true, error: null });
    
    try {
      const orderData: CreateOrderRequest = {
        mark_box: orderForm.markBox,
        customer_id: orderForm.customerId,
        items: orderItems,
        notes: orderForm.notes || undefined,
      };

      const order = await ordersApi.createOrder(orderData);
      set({ currentOrder: order, loading: false });
      return order.id;
    } catch (error) {
      set({ error: 'Ошибка создания заказа', loading: false });
      return null;
    }
  },

  fetchOrder: async (id) => {
    set({ loading: true, error: null });
    try {
      const order = await ordersApi.getOrder(id);
      set({ currentOrder: order, loading: false });
    } catch (error) {
      set({ error: 'Ошибка загрузки заказа', loading: false });
    }
  },

  clearOrder: () => set({
    currentOrder: null,
    orderItems: [],
    orderForm: { markBox: '', customerId: '', notes: '' },
    error: null,
  }),

  getTotalAmount: () => {
    const { orderItems } = get();
    return orderItems.reduce((total, item) => {
      return total + (item.price || 0) * item.total_stems;
    }, 0);
  },
}));