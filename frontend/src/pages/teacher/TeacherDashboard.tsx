import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardContent, CardActionArea, Chip, CircularProgress } from '@mui/material';
import BookIcon from '@mui/icons-material/Book';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { courseService } from '../../services/courseService';
import { Materia, HorarioCurso } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const DIAS_MAP: Record<number, string> = {
  1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes',
};

function timeToMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  return parts[0] * 60 + (parts[1] || 0);
}

function getActiveMaterias(horarios: HorarioCurso[]): Set<number> {
  const now = new Date();
  const dayStr = DIAS_MAP[now.getDay()];
  if (!dayStr) return new Set();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const active = new Set<number>();
  for (const horario of horarios) {
    for (const periodo of horario.periodos) {
      const start = timeToMinutes(periodo.hora_inicio);
      const end = timeToMinutes(periodo.hora_fin);
      if (currentMin >= start && currentMin <= end) {
        for (const clase of periodo.clases) {
          if (clase.dia === dayStr && clase.materia !== null) {
            active.add(clase.materia);
          }
        }
      }
    }
  }
  return active;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNow, setActiveNow] = useState<Set<number>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const mats = await courseService.getMisMaterias();
        setMaterias(mats);
        const cursoIds = Array.from(new Set(
          mats.map(m => m.curso?.id).filter((id): id is number => id != null)
        ));
        if (cursoIds.length > 0) {
          const horarios = await Promise.all(cursoIds.map(id => courseService.getHorario(id)));
          setActiveNow(getActiveMaterias(horarios));
        }
      } catch {
        // silently fail — badge is non-critical
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Bienvenido, Prof. {user?.first_name} {user?.last_name}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Selecciona una materia para gestionar asistencia, actividades y calificaciones
        </Typography>
      </Box>

      {materias.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <BookIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No tienes materias asignadas actualmente.</Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {materias.map(materia => {
            const isNow = activeNow.has(materia.id);
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={materia.id}>
                <Card sx={{
                  borderRadius: 3,
                  boxShadow: isNow ? 6 : 2,
                  height: '100%',
                  border: '2px solid',
                  borderColor: isNow ? 'primary.main' : 'transparent',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}>
                  <CardActionArea onClick={() => navigate(`/docente/cursos/${materia.id}`)} sx={{ p: 2, height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{materia.nombre}</Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
                          {isNow && (
                            <Chip
                              icon={<AccessTimeIcon />}
                              label="Ahora"
                              size="small"
                              color="primary"
                              sx={{ fontWeight: 700 }}
                            />
                          )}
                          <Chip label={materia.codigo} size="small" variant="outlined" />
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {materia.curso?.nombre} • {materia.numero_horas}h semanales
                      </Typography>
                      {materia.descripcion && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {materia.descripcion}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
                        <PeopleIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">Ver estudiantes y gestionar</Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
