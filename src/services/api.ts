import axios from 'axios';
import { Flower, Order, CreateOrderRequest, FlowersResponse } from '../types';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

export const flowersApi = {
  getFlowers: async (): Promise<Flower[]> => {
    const response = await api.get<FlowersResponse>('/flowers');
    return response.data.flowers;
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