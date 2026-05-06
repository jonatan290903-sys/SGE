import api from './api';
import { Estudiante, Curso } from '../types';

export const studentService = {
  async getEstudiantes(params?: { estado?: string; curso?: number }): Promise<Estudiante[]> {
    const { data } = await api.get<Estudiante[]>('/api/v1/auth/estudiantes/', { params });
    return data;
  },
  async getEstudiante(id: number): Promise<Estudiante> {
    const { data } = await api.get<Estudiante>(`/api/v1/auth/estudiantes/${id}/`);
    return data;
  },
  async createEstudiante(payload: any): Promise<Estudiante> {
    const { data } = await api.post<Estudiante>('/api/v1/auth/estudiantes/', payload);
    return data;
  },
  async updateEstudiante(id: number, payload: any): Promise<Estudiante> {
    const { data } = await api.put<Estudiante>(`/api/v1/auth/estudiantes/${id}/`, payload);
    return data;
  },
  async deleteEstudiante(id: number): Promise<void> {
    await api.delete(`/api/v1/auth/estudiantes/${id}/`);
  },

  async getCursos(): Promise<Curso[]> {
    const { data } = await api.get<Curso[]>('/api/v1/auth/cursos/');
    return data;
  },
  async createCurso(payload: any): Promise<Curso> {
    const { data } = await api.post<Curso>('/api/v1/auth/cursos/', payload);
    return data;
  },
  async updateCurso(id: number, payload: any): Promise<Curso> {
    const { data } = await api.put<Curso>(`/api/v1/auth/cursos/${id}/`, payload);
    return data;
  },
  async deleteCurso(id: number): Promise<void> {
    await api.delete(`/api/v1/auth/cursos/${id}/`);
  },
};
