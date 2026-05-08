import api from './api';
import { Pago, PaginatedResponse } from '../types';

export const paymentService = {
  async getPagos(params?: any): Promise<PaginatedResponse<Pago>> {
    const { data } = await api.get<PaginatedResponse<Pago>>('/api/v1/pagos/', { params });
    return data;
  },
  async createPago(payload: any): Promise<Pago> {
    const { data } = await api.post<Pago>('/api/v1/pagos/', payload);
    return data;
  },
  async updatePago(id: number, payload: any): Promise<Pago> {
    const { data } = await api.put<Pago>(`/api/v1/pagos/${id}/`, payload);
    return data;
  },
  async deletePago(id: number): Promise<void> {
    await api.delete(`/api/v1/pagos/${id}/`);
  },
  async getResumen(): Promise<any> {
    const { data } = await api.get('/api/v1/pagos/resumen/');
    return data;
  },
};
