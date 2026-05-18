import api from './api';

export const communicationService = {
  getComunicados: async () => {
    const { data } = await api.get('/api/v1/communication/comunicados/');
    return data;
  },
  getNotificaciones: async (params?: Record<string, any>) => {
    const { data } = await api.get('/api/v1/communication/notificaciones/', { params });
    return data;
  },
  marcarLeidas: async () => {
    const { data } = await api.post('/api/v1/communication/notificaciones/');
    return data;
  }
};
