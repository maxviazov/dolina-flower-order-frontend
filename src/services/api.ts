import axios from 'axios';
import { Flower, Order, CreateOrderRequest, FlowersResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      console.error('Authentication required');
    }
    return Promise.reject(error);
  }
);

// Mock данные для презентации
const mockFlowers: Flower[] = [
  { variety: 'Роза красная', length: 60, box_count: 10, pack_rate: 25, total_stems: 250, farm_name: 'Ферма Долина', truck_name: 'Грузовик-1' },
  { variety: 'Тюльпан желтый', length: 40, box_count: 15, pack_rate: 20, total_stems: 300, farm_name: 'Ферма Цветы', truck_name: 'Грузовик-2' },
  { variety: 'Лилия белая', length: 70, box_count: 8, pack_rate: 15, total_stems: 120, farm_name: 'Ферма Элит', truck_name: 'Грузовик-3' },
  { variety: 'Гвоздика розовая', length: 50, box_count: 12, pack_rate: 30, total_stems: 360, farm_name: 'Ферма Долина', truck_name: 'Грузовик-1' },
];

export const flowersApi = {
  getFlowers: async (): Promise<Flower[]> => {
    try {
      const response = await api.get<FlowersResponse>('/flowers');
      return response.data.flowers;
    } catch (error) {
      console.warn('API недоступен, используем mock данные для презентации');
      console.info('Цены устанавливает специалист Долины после получения заказа');
      return mockFlowers;
    }
  },
};

export const ordersApi = {
  createOrder: async (orderData: CreateOrderRequest): Promise<Order> => {
    const response = await api.post<Order>('/orders', orderData);
    return response.data;
  },

  getOrder: async (id: string): Promise<Order> => {
    const response = await api.get<Order>(`/orders/${id}`);
    return response.data;
  },
};