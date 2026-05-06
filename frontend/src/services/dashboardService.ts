import api from './api';

export interface DashboardStats {
  estudiantes: number;
  docentes: number;
  materias: number;
  pagos: number;
  pagosPendientes: number;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>('/api/v1/auth/dashboard-stats/');
    return data;
  },
};
