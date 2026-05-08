import api from './api';
import { Materia, Inscripcion, Actividad, Calificacion, Asistencia, Docente,
         ResumenAsistencia, CentroNotas, EstadoAsistencia, HorarioCurso, PaginatedResponse } from '../types';

export const courseService = {
  // Materias
  async getMaterias(): Promise<Materia[]> {
    const { data } = await api.get<Materia[]>('/api/v1/materias/');
    return data;
  },
  async getMisMaterias(): Promise<Materia[]> {
    const { data } = await api.get<Materia[]>('/api/v1/auth/mis-materias/');
    return data;
  },
  async createMateria(payload: any): Promise<Materia> {
    const { data } = await api.post<Materia>('/api/v1/materias/', payload);
    return data;
  },
  async updateMateria(id: number, payload: any): Promise<Materia> {
    const { data } = await api.put<Materia>(`/api/v1/materias/${id}/`, payload);
    return data;
  },
  async deleteMateria(id: number): Promise<void> {
    await api.delete(`/api/v1/materias/${id}/`);
  },

  // Estudiantes de una materia
  async getMateriaEstudiantes(materiaId: number) {
    const { data } = await api.get(`/api/v1/materias/${materiaId}/estudiantes/`);
    return data;
  },

  // Inscripciones (solo administrativo)
  async getInscripciones(params?: { estudiante?: number; curso?: number; estado?: string; page?: number }): Promise<PaginatedResponse<Inscripcion>> {
    const { data } = await api.get<PaginatedResponse<Inscripcion>>('/api/v1/materias/inscripciones/', { params });
    return data;
  },
  async createInscripcion(payload: { estudiante_id: number; curso_id: number }): Promise<Inscripcion> {
    const { data } = await api.post<Inscripcion>('/api/v1/materias/inscripciones/', payload);
    return data;
  },
  async updateInscripcion(id: number, estado: string): Promise<Inscripcion> {
    const { data } = await api.put<Inscripcion>(`/api/v1/materias/inscripciones/${id}/`, { estado });
    return data;
  },
  async deleteInscripcion(id: number): Promise<void> {
    await api.delete(`/api/v1/materias/inscripciones/${id}/`);
  },

// Actividades de una materia
  async getActividades(materiaId: number): Promise<Actividad[]> {
    const { data } = await api.get<Actividad[]>(`/api/v1/materias/${materiaId}/actividades/`);
    return data;
  },
  async createActividad(materiaId: number, payload: any): Promise<Actividad> {
    const { data } = await api.post<Actividad>(`/api/v1/materias/${materiaId}/actividades/`, payload);
    return data;
  },
  async updateActividad(id: number, payload: any): Promise<Actividad> {
    const { data } = await api.put<Actividad>(`/api/v1/materias/actividades/${id}/`, payload);
    return data;
  },
  async deleteActividad(id: number): Promise<void> {
    await api.delete(`/api/v1/materias/actividades/${id}/`);
  },
  async getMisPlantillas(): Promise<Actividad[]> {
    const { data } = await api.get<Actividad[]>('/api/v1/materias/actividades/plantillas/');
    return data;
  },
  async guardarComoPlantilla(actividadId: number): Promise<Actividad> {
    const { data } = await api.post<Actividad>(`/api/v1/materias/actividades/${actividadId}/guardar-plantilla/`);
    return data;
  },
  async usarPlantilla(materiaId: number, plantillaId: number): Promise<Actividad> {
    const { data } = await api.post<Actividad>(`/api/v1/materias/${materiaId}/actividades/${plantillaId}/usar-plantilla/`);
    return data;
  },

  // Centro de notas
  async getCentroNotas(materiaId: number, trimestre?: string): Promise<CentroNotas> {
    const params: Record<string, string> = {};
    if (trimestre) params.trimestre = trimestre;
    const { data } = await api.get<CentroNotas>(`/api/v1/materias/${materiaId}/centro-notas/`, { params });
    return data;
  },
  async guardarNota(estudiante: number, actividad: number, nota: number | null): Promise<Calificacion> {
    const { data } = await api.post<Calificacion>('/api/v1/materias/notas/', { estudiante, actividad, nota });
    return data;
  },

  // Asistencia
  async getAsistenciaMateria(materiaId: number, fecha?: string): Promise<Asistencia[]> {
    const params = fecha ? { fecha } : {};
    const { data } = await api.get<Asistencia[]>(`/api/v1/materias/${materiaId}/asistencia/`, { params });
    return data;
  },
  async registrarAsistenciaBulk(materiaId: number, fecha: string, registros: { estudiante: number; estado: EstadoAsistencia; motivo?: string }[]): Promise<Asistencia[]> {
    const { data } = await api.post<Asistencia[]>(`/api/v1/materias/${materiaId}/asistencia/bulk/`, { fecha, registros });
    return data;
  },
  async getResumenAsistencia(materiaId: number): Promise<ResumenAsistencia[]> {
    const { data } = await api.get<ResumenAsistencia[]>(`/api/v1/materias/${materiaId}/resumen-asistencia/`);
    return data;
  },

  // Docentes
  async getDocentes(): Promise<PaginatedResponse<Docente>> {
    const { data } = await api.get<PaginatedResponse<Docente>>('/api/v1/auth/docentes/');
    return data;
  },

  // Horario
  async getHorario(cursoId: number): Promise<HorarioCurso> {
    const { data } = await api.get<HorarioCurso>(`/api/v1/materias/horario/${cursoId}/`);
    return data;
  },
  async saveHorario(cursoId: number, payload: { periodos: any[] }): Promise<HorarioCurso> {
    const { data } = await api.post<HorarioCurso>(`/api/v1/materias/horario/${cursoId}/`, payload);
    return data;
  },

  // Exportación Excel
  async exportarAsistencia(materiaId: number, params: { fecha_inicio?: string; fecha_fin?: string } = {}): Promise<void> {
    const response = await api.get(`/api/v1/materias/${materiaId}/asistencia/exportar/`, {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `asistencia_materia${materiaId}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
  async exportarNotas(materiaId: number, params: { trimestre?: string } = {}): Promise<void> {
    const response = await api.get(`/api/v1/materias/${materiaId}/notas/exportar/`, {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `notas_materia${materiaId}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Última asistencia (sesión anterior)
  async getUltimaAsistencia(materiaId: number, antesDe?: string): Promise<{ fecha: string | null; registros: Record<string, EstadoAsistencia> }> {
    const params = antesDe ? { antes_de: antesDe } : {};
    const { data } = await api.get(`/api/v1/materias/${materiaId}/ultima-asistencia/`, { params });
    return data;
  },
};
