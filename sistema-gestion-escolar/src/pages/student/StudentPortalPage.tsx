import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardActionArea, Chip,
  CircularProgress, Tabs, Tab, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Paper, Divider, Alert,
} from '@mui/material';
import BookIcon from '@mui/icons-material/Book';
import GradeIcon from '@mui/icons-material/Grade';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { courseService } from '../../services/courseService';
import { Materia, CentroNotas, ResumenAsistencia, HorarioCurso } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

// ── Horario ───────────────────────────────────────────────────────────────────

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as const;
const DIA_LABELS: Record<string, string> = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
  jueves: 'Jueves', viernes: 'Viernes',
};
const MAT_COLORS = [
  '#1565c0', '#e65100', '#1b5e20', '#880e4f',
  '#4a148c', '#006064', '#bf360c', '#4e342e',
  '#00695c', '#37474f',
];

function TabHorario({ cursoId, cursoNombre }: { cursoId: number; cursoNombre: string }) {
  const [horario, setHorario] = useState<HorarioCurso | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseService.getHorario(cursoId)
      .then(setHorario).catch(() => {}).finally(() => setLoading(false));
  }, [cursoId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={28} /></Box>;
  if (!horario || horario.periodos.length === 0) {
    return <Alert severity="info">El horario del curso aún no ha sido configurado.</Alert>;
  }

  // Asignar colores únicos por materia
  const colorMap: Record<string, string> = {};
  let colorIdx = 0;
  for (const periodo of horario.periodos) {
    for (const clase of periodo.clases) {
      if (clase.materia_nombre && !(clase.materia_nombre in colorMap)) {
        colorMap[clase.materia_nombre] = MAT_COLORS[colorIdx % MAT_COLORS.length];
        colorIdx++;
      }
    }
  }

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
        Curso: <b>{cursoNombre}</b>
      </Typography>
      <Box sx={{ overflowX: 'auto' }}>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 700, minWidth: 110, borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                  Período
                </TableCell>
                {DIAS.map(dia => (
                  <TableCell key={dia} align="center" sx={{ color: 'white', fontWeight: 700, minWidth: 120 }}>
                    {DIA_LABELS[dia]}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {horario.periodos.map((periodo, rowIdx) => {
                const claseByDia: Record<string, string | null> = {};
                for (const clase of periodo.clases) {
                  claseByDia[clase.dia] = clase.materia_nombre;
                }
                return (
                  <TableRow key={periodo.id} sx={{ bgcolor: rowIdx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <TableCell sx={{
                      fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary',
                      borderRight: '1px solid #e0e0e0', whiteSpace: 'nowrap',
                    }}>
                      {periodo.hora_inicio.slice(0, 5)} – {periodo.hora_fin.slice(0, 5)}
                    </TableCell>
                    {DIAS.map(dia => {
                      const nombre = claseByDia[dia] ?? null;
                      const color = nombre ? colorMap[nombre] : null;
                      return (
                        <TableCell key={dia} align="center" sx={{
                          py: 1.5,
                          borderLeft: color ? `3px solid ${color}` : '3px solid transparent',
                          bgcolor: color ? `${color}12` : 'inherit',
                        }}>
                          {nombre
                            ? <Typography variant="caption" sx={{ fontWeight: 700, color, lineHeight: 1.3, display: 'block' }}>
                                {nombre}
                              </Typography>
                            : <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Leyenda */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
        {Object.entries(colorMap).map(([nombre, color]) => (
          <Chip
            key={nombre}
            label={nombre}
            size="small"
            sx={{ bgcolor: `${color}18`, color, fontWeight: 600, border: `1px solid ${color}40` }}
          />
        ))}
      </Box>
    </Box>
  );
}

// ── Notas y asistencia ────────────────────────────────────────────────────────

function GradeChip({ nota }: { nota: number | null }) {
  if (nota === null) {
    return <Typography variant="body2" color="text.disabled">—</Typography>;
  }
  return <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>●</Typography>;
}

function MateriaDetail({ materia }: { materia: Materia }) {
  const [tab, setTab] = useState(0);
  const [centroNotas, setCentroNotas] = useState<CentroNotas | null>(null);
  const [resumen, setResumen] = useState<ResumenAsistencia | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      courseService.getCentroNotas(materia.id),
      courseService.getResumenAsistencia(materia.id),
    ]).then(([notas, asistencias]) => {
      setCentroNotas(notas);
      setResumen(asistencias[0] ?? null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [materia.id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={28} /></Box>;

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tab label="Mis Notas" icon={<GradeIcon />} iconPosition="start" />
        <Tab label="Mi Asistencia" icon={<EventAvailableIcon />} iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <>
          {!centroNotas || centroNotas.actividades.length === 0 ? (
            <Alert severity="info">No hay actividades registradas aún.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Actividad</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Trimestre</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Nota</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {centroNotas.actividades.map(act => {
                    const fila = centroNotas.filas[0];
                    const nota = fila ? (fila.notas[String(act.id)] ?? null) : null;
                    return (
                      <TableRow key={act.id} hover>
                        <TableCell>{act.nombre}</TableCell>
                        <TableCell><Chip label={act.tipo} size="small" variant="outlined" /></TableCell>
                        <TableCell><Chip label={act.trimestre} size="small" color="primary" variant="outlined" /></TableCell>
                        <TableCell sx={{ textAlign: 'center' }}><GradeChip nota={nota} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {tab === 1 && (
        <>
          {!resumen ? (
            <Alert severity="info">No hay registros de asistencia aún.</Alert>
          ) : (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 4 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2, textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }}>{resumen.presentes}</Typography>
                    <Typography variant="caption" color="text.secondary">Presentes</Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2, textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#c62828' }}>{resumen.faltas}</Typography>
                    <Typography variant="caption" color="text.secondary">Faltas</Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2, textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#e65100' }}>{resumen.licencias}</Typography>
                    <Typography variant="caption" color="text.secondary">Licencias</Typography>
                  </Card>
                </Grid>
              </Grid>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Total clases registradas: {resumen.presentes + resumen.faltas + resumen.licencias}
              </Typography>
              {resumen.faltas + resumen.licencias > 0 && (
                <Alert severity={resumen.faltas >= 3 ? 'warning' : 'info'} sx={{ mt: 2 }}>
                  {resumen.faltas >= 3
                    ? `Tienes ${resumen.faltas} falta(s). Considera hablar con tu docente.`
                    : `Tienes ${resumen.faltas} falta(s) y ${resumen.licencias} licencia(s).`}
                </Alert>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function StudentPortalPage() {
  const { user } = useAuth();
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState(0);

  useEffect(() => {
    courseService.getMisMaterias().then(setMaterias).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  const cursoId = materias[0]?.curso?.id ?? null;
  const cursoNombre = materias[0]?.curso?.nombre ?? '';

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Bienvenido, {user?.first_name} {user?.last_name}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          {cursoNombre && `Curso: ${cursoNombre}`}
        </Typography>
      </Box>

      <Paper sx={{ borderRadius: 3, boxShadow: 2 }}>
        <Tabs
          value={mainTab}
          onChange={(_, v) => { setMainTab(v); setSelectedMateria(null); }}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Mi Horario" icon={<CalendarMonthIcon />} iconPosition="start" />
          <Tab label="Mis Materias" icon={<BookIcon />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* ── Horario ── */}
          {mainTab === 0 && (
            cursoId
              ? <TabHorario cursoId={cursoId} cursoNombre={cursoNombre} />
              : <Alert severity="info">No estás inscrito en ningún curso aún.</Alert>
          )}

          {/* ── Mis materias ── */}
          {mainTab === 1 && (
            materias.length === 0 ? (
              <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3, boxShadow: 0 }}>
                <BookIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">No estás matriculado en ninguna materia.</Typography>
              </Card>
            ) : (
              <Grid container spacing={3}>
                {/* Lista de materias */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {materias.map(materia => (
                      <Card
                        key={materia.id}
                        sx={{
                          borderRadius: 3,
                          boxShadow: selectedMateria?.id === materia.id ? 4 : 1,
                          border: '2px solid',
                          borderColor: selectedMateria?.id === materia.id ? 'primary.main' : 'transparent',
                          transition: 'all 0.15s',
                        }}
                      >
                        <CardActionArea onClick={() => setSelectedMateria(materia)} sx={{ p: 1 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{materia.nombre}</Typography>
                              <Chip label={materia.codigo} size="small" variant="outlined" />
                            </Box>
                            <Typography variant="body2" color="text.secondary">{materia.curso?.nombre}</Typography>
                            {materia.docente && (
                              <Typography variant="caption" color="text.secondary">
                                Prof. {materia.docente.user.first_name} {materia.docente.user.last_name}
                              </Typography>
                            )}
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    ))}
                  </Box>
                </Grid>

                {/* Detalle de la materia */}
                <Grid size={{ xs: 12, md: 8 }}>
                  {selectedMateria ? (
                    <Card sx={{ borderRadius: 3, boxShadow: 1, p: 3 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{selectedMateria.nombre}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedMateria.curso?.nombre} • {selectedMateria.numero_horas}h semanales
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      <MateriaDetail materia={selectedMateria} />
                    </Card>
                  ) : (
                    <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3, boxShadow: 0 }}>
                      <BookIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
                      <Typography color="text.secondary">Selecciona una materia para ver el detalle</Typography>
                    </Card>
                  )}
                </Grid>
              </Grid>
            )
          )}
        </Box>
      </Paper>
    </Box>
  );
}
