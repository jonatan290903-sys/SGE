import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CircularProgress, MenuItem, TextField,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  IconButton, Tooltip, Chip, Select, Alert, Divider, Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { courseService } from '../services/courseService';
import { studentService } from '../services/studentService';
import { Curso, Materia } from '../types';

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as const;
const DIAS_LABEL: Record<string, string> = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes',
};

type Dia = typeof DIAS[number];

interface PeriodoLocal {
  localId: string;
  orden: number;
  hora_inicio: string;
  hora_fin: string;
  clases: Record<Dia, number | ''>;
}

function emptyClases(): Record<Dia, number | ''> {
  return { lunes: '', martes: '', miercoles: '', jueves: '', viernes: '' };
}

function calcDurMin(inicio: string, fin: string): number {
  const [hi, mi] = inicio.split(':').map(Number);
  const [hf, mf] = fin.split(':').map(Number);
  return Math.max(0, hf * 60 + mf - (hi * 60 + mi));
}

function addMinutes(time: string, min: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + min;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function calcResumen(periodos: PeriodoLocal[], materias: Materia[]) {
  const minMap: Record<number, number> = {};
  periodos.forEach(p => {
    const dur = calcDurMin(p.hora_inicio, p.hora_fin);
    DIAS.forEach(dia => {
      const mid = p.clases[dia];
      if (mid !== '') {
        minMap[mid as number] = (minMap[mid as number] || 0) + dur;
      }
    });
  });
  return materias
    .filter(m => minMap[m.id])
    .map(m => ({ materia: m, horas: Math.round((minMap[m.id] / 60) * 10) / 10 }))
    .sort((a, b) => b.horas - a.horas);
}

let localIdCounter = 0;
function newLocalId() { return String(++localIdCounter); }

export default function HorarioPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoId, setCursoId] = useState<string>('');
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHorario, setLoadingHorario] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([studentService.getCursos(), courseService.getMaterias()])
      .then(([c, m]) => { setCursos(c); setMaterias(m); })
      .finally(() => setLoading(false));
  }, []);

  const loadHorario = useCallback(async (cId: number) => {
    setLoadingHorario(true);
    try {
      const [horario, todasMaterias] = await Promise.all([
        courseService.getHorario(cId),
        courseService.getMaterias(),
      ]);
      const filtradas = todasMaterias.filter(m => m.curso.id === cId);
      setMaterias(filtradas);
      const loaded: PeriodoLocal[] = horario.periodos.map(p => ({
        localId: newLocalId(),
        orden: p.orden,
        hora_inicio: p.hora_inicio.slice(0, 5),
        hora_fin: p.hora_fin.slice(0, 5),
        clases: {
          lunes: p.clases.find(c => c.dia === 'lunes')?.materia ?? '',
          martes: p.clases.find(c => c.dia === 'martes')?.materia ?? '',
          miercoles: p.clases.find(c => c.dia === 'miercoles')?.materia ?? '',
          jueves: p.clases.find(c => c.dia === 'jueves')?.materia ?? '',
          viernes: p.clases.find(c => c.dia === 'viernes')?.materia ?? '',
        } as Record<Dia, number | ''>,
      }));
      setPeriodos(loaded);
    } catch {
      setError('Error al cargar el horario.');
    } finally {
      setLoadingHorario(false);
    }
  }, []);

  const handleCursoChange = (cId: string) => {
    setCursoId(cId);
    setPeriodos([]);
    setError('');
    setSaved(false);
    if (cId) loadHorario(Number(cId));
  };

  const addPeriodo = () => {
    const last = periodos[periodos.length - 1];
    const inicio = last ? addMinutes(last.hora_fin, 5) : '07:00';
    const fin = addMinutes(inicio, 45);
    setPeriodos(prev => [...prev, {
      localId: newLocalId(),
      orden: prev.length + 1,
      hora_inicio: inicio,
      hora_fin: fin,
      clases: emptyClases(),
    }]);
  };

  const removePeriodo = (localId: string) => {
    setPeriodos(prev => prev.filter(p => p.localId !== localId).map((p, i) => ({ ...p, orden: i + 1 })));
  };

  const updatePeriodo = (localId: string, field: 'hora_inicio' | 'hora_fin', value: string) => {
    setPeriodos(prev => prev.map(p => p.localId === localId ? { ...p, [field]: value } : p));
  };

  const updateClase = (localId: string, dia: Dia, materiaId: number | '') => {
    setPeriodos(prev => prev.map(p =>
      p.localId === localId ? { ...p, clases: { ...p.clases, [dia]: materiaId } } : p
    ));
  };

  const handleSave = async () => {
    if (!cursoId) return;
    setSaving(true); setError(''); setSaved(false);
    try {
      const payload = {
        periodos: periodos.map(p => ({
          orden: p.orden,
          hora_inicio: p.hora_inicio,
          hora_fin: p.hora_fin,
          clases: DIAS.map(dia => ({
            dia,
            materia_id: p.clases[dia] !== '' ? p.clases[dia] : null,
          })),
        })),
      };
      await courseService.saveHorario(Number(cursoId), payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      loadHorario(Number(cursoId));
    } catch {
      setError('Error al guardar el horario.');
    } finally {
      setSaving(false);
    }
  };

  const resumen = cursoId ? calcResumen(periodos, materias) : [];

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Horario Académico</Typography>
          <Typography variant="body2" color="text.secondary">
            Configura el horario semanal por curso. Las horas de cada materia se calculan automáticamente.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {saved && <Chip label="¡Guardado!" color="success" size="small" />}
          <Button
            variant="contained" startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || !cursoId || periodos.length === 0}
          >
            {saving ? 'Guardando...' : 'Guardar Horario'}
          </Button>
        </Box>
      </Box>

      {/* Curso selector */}
      <Card sx={{ p: 3, borderRadius: 3, boxShadow: 2, mb: 3 }}>
        <TextField
          select label="Seleccionar curso" value={cursoId}
          onChange={e => handleCursoChange(e.target.value)}
          sx={{ minWidth: 300 }}
        >
          <MenuItem value=""><em>— Elige un curso —</em></MenuItem>
          {cursos.filter(c => c.estado).map(c => (
            <MenuItem key={c.id} value={String(c.id)}>
              {c.nombre}{c.periodo ? ` — ${c.periodo}` : ''}
            </MenuItem>
          ))}
        </TextField>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {cursoId && (
        <>
          {loadingHorario ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : (
            <>
              {/* Grid editor */}
              <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 3, overflow: 'auto' }}>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    <CalendarMonthIcon sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: 20 }} />
                    Cuadrícula de horario
                  </Typography>
                  <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={addPeriodo}>
                    Agregar período
                  </Button>
                </Box>
                <Divider />
                {periodos.length === 0 ? (
                  <Box sx={{ p: 5, textAlign: 'center', color: 'text.secondary' }}>
                    <CalendarMonthIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                    <Typography>No hay períodos configurados. Agrega uno para empezar.</Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small" sx={{ minWidth: 800 }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                          <TableCell sx={{ fontWeight: 700, minWidth: 40 }}>#</TableCell>
                          <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Inicio</TableCell>
                          <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Fin</TableCell>
                          {DIAS.map(d => (
                            <TableCell key={d} align="center" sx={{ fontWeight: 700, minWidth: 140 }}>
                              {DIAS_LABEL[d]}
                            </TableCell>
                          ))}
                          <TableCell sx={{ width: 40 }} />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {periodos.map(p => (
                          <TableRow key={p.localId} hover>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>P{p.orden}</TableCell>
                            <TableCell>
                              <TextField
                                type="time" size="small" value={p.hora_inicio}
                                onChange={e => updatePeriodo(p.localId, 'hora_inicio', e.target.value)}
                                slotProps={{ htmlInput: { step: 300 } }}
                                sx={{ width: 110 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="time" size="small" value={p.hora_fin}
                                onChange={e => updatePeriodo(p.localId, 'hora_fin', e.target.value)}
                                slotProps={{ htmlInput: { step: 300 } }}
                                sx={{ width: 110 }}
                              />
                            </TableCell>
                            {DIAS.map(dia => (
                              <TableCell key={dia} align="center" sx={{ p: 0.5 }}>
                                <Select
                                  size="small"
                                  displayEmpty
                                  value={p.clases[dia] === '' ? '' : String(p.clases[dia])}
                                  onChange={e => updateClase(p.localId, dia, e.target.value === '' ? '' : Number(e.target.value))}
                                  sx={{ width: '100%', fontSize: 13 }}
                                  renderValue={val => {
                                    if (!val) return <em style={{ color: '#bbb', fontSize: 12 }}>Libre</em>;
                                    const m = materias.find(m => String(m.id) === val);
                                    return m ? m.nombre : val;
                                  }}
                                >
                                  <MenuItem value=""><em>Libre</em></MenuItem>
                                  {materias.map(m => (
                                    <MenuItem key={m.id} value={String(m.id)}>{m.nombre}</MenuItem>
                                  ))}
                                </Select>
                              </TableCell>
                            ))}
                            <TableCell>
                              <Tooltip title="Eliminar período">
                                <IconButton size="small" color="error" onClick={() => removePeriodo(p.localId)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Card>

              {/* Summary */}
              {resumen.length > 0 && (
                <Card sx={{ borderRadius: 3, boxShadow: 2, p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    Horas semanales por materia
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {resumen.map(({ materia, horas }) => (
                      <Paper key={materia.id} variant="outlined" sx={{ px: 2, py: 1, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{materia.nombre}</Typography>
                        <Chip
                          label={`${horas}h/sem`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Paper>
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                    Al guardar, estas horas se actualizan automáticamente en cada materia.
                  </Typography>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
}
