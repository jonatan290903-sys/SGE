import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Tabs, Tab, CircularProgress, Button, Paper,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  ToggleButton, ToggleButtonGroup, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Chip, IconButton, Tooltip,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import { courseService } from '../../services/courseService';
import { useConfig } from '../../contexts/ConfigContext';
import {
  Materia, Estudiante, Actividad, EstadoAsistencia,
  ResumenAsistencia, CentroNotas, HorarioCurso, Asistencia,
} from '../../types';

const today = new Date().toISOString().split('T')[0];

const ESTADO_COLORS: Record<EstadoAsistencia, string> = { P: '#4caf50', F: '#f44336', L: '#2196f3' };
const ESTADO_LABELS: Record<EstadoAsistencia, string> = { P: 'Presente', F: 'Falta', L: 'Licencia' };

const DIAS_MAP: Record<number, string> = {
  1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes',
};
const DIA_DISPLAY: Record<string, string> = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes',
};
const COL_COLORS = ['#1565c0', '#e65100', '#1b5e20', '#880e4f', '#4a148c', '#006064', '#bf360c'];

const TRIMESTRES = ['T1', 'T2', 'T3'] as const;
const TRIMESTRE_LABEL: Record<string, string> = { T1: 'Trimestre 1', T2: 'Trimestre 2', T3: 'Trimestre 3' };
const TIPOS = ['tarea', 'examen', 'proyecto', 'participacion', 'otro'];

function getDayOfWeek(dateStr: string): string | null {
  const [y, m, d] = dateStr.split('-').map(Number);
  return DIAS_MAP[new Date(y, m - 1, d).getDay()] ?? null;
}

function getMateriasForDay(horario: HorarioCurso, dia: string): { id: number; nombre: string }[] {
  const seen = new Set<number>();
  const result: { id: number; nombre: string }[] = [];
  for (const periodo of horario.periodos) {
    for (const clase of periodo.clases) {
      if (clase.dia === dia && clase.materia !== null && clase.materia_nombre && !seen.has(clase.materia)) {
        seen.add(clase.materia);
        result.push({ id: clase.materia, nombre: clase.materia_nombre });
      }
    }
  }
  return result;
}

function notaColor(nota: number | null): string {
  if (nota === null || nota === undefined) return 'inherit';
  if (nota >= 65) return '#e8f5e9';
  if (nota >= 51) return '#fff8e1';
  return '#ffebee';
}

// ── Tab 1: Asistencia ─────────────────────────────────────────────────────────

function TabAsistencia({ materiaId, claseCursoId }: { materiaId: number; claseCursoId: number }) {
  const [fecha, setFecha] = useState(today);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [estados, setEstados] = useState<Record<number, EstadoAsistencia>>({});
  const [motivos, setMotivos] = useState<Record<number, string>>({});
  const [resumen, setResumen] = useState<ResumenAsistencia[]>([]);
  const [anterior, setAnterior] = useState<{ fecha: string | null; registros: Record<string, EstadoAsistencia> }>({ fecha: null, registros: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [vista, setVista] = useState<'tomar' | 'resumen' | 'dia'>('tomar');

  // Estado descarga
  const [exportInicio, setExportInicio] = useState('');
  const [exportFin, setExportFin] = useState('');
  const [exporting, setExporting] = useState(false);

  // Vista del día
  const [materiasDelDia, setMateriasDelDia] = useState<{ id: number; nombre: string }[]>([]);
  const [asistenciaDia, setAsistenciaDia] = useState<Record<number, Record<number, EstadoAsistencia | null>>>({});
  const [loadingDia, setLoadingDia] = useState(false);

  const loadEstudiantes = useCallback(async () => {
    const est = await courseService.getMateriaEstudiantes(materiaId);
    setEstudiantes(est);
    const defaultEstados: Record<number, EstadoAsistencia> = {};
    est.forEach((e: Estudiante) => { defaultEstados[e.id] = 'P'; });
    setEstados(defaultEstados);
    setLoading(false);
  }, [materiaId]);

  const loadAsistenciaFecha = useCallback(async () => {
    const [asis, ant] = await Promise.all([
      courseService.getAsistenciaMateria(materiaId, fecha),
      courseService.getUltimaAsistencia(materiaId, fecha),
    ]);
    if (asis.length > 0) {
      const nuevoEstados: Record<number, EstadoAsistencia> = {};
      const nuevosMotivos: Record<number, string> = {};
      asis.forEach(a => { nuevoEstados[a.estudiante] = a.estado; nuevosMotivos[a.estudiante] = a.motivo || ''; });
      setEstados(prev => ({ ...prev, ...nuevoEstados }));
      setMotivos(nuevosMotivos);
    }
    setAnterior(ant);
  }, [materiaId, fecha]);

  const loadResumen = useCallback(async () => {
    const res = await courseService.getResumenAsistencia(materiaId);
    setResumen(res);
  }, [materiaId]);

  const loadDia = useCallback(async () => {
    const dia = getDayOfWeek(fecha);
    if (!dia || !claseCursoId) { setMateriasDelDia([]); return; }
    setLoadingDia(true);
    try {
      const horario = await courseService.getHorario(claseCursoId);
      const mats = getMateriasForDay(horario, dia);
      setMateriasDelDia(mats);
      if (mats.length === 0) { setAsistenciaDia({}); return; }
      const asistenciasArr = await Promise.all(mats.map(m => courseService.getAsistenciaMateria(m.id, fecha)));
      const map: Record<number, Record<number, EstadoAsistencia | null>> = {};
      estudiantes.forEach(e => { map[e.id] = {}; });
      mats.forEach((mat, idx) => {
        asistenciasArr[idx].forEach((a: Asistencia) => {
          if (!map[a.estudiante]) map[a.estudiante] = {};
          map[a.estudiante][mat.id] = a.estado;
        });
      });
      setAsistenciaDia(map);
    } catch {} finally {
      setLoadingDia(false);
    }
  }, [claseCursoId, fecha, estudiantes]);

  useEffect(() => { loadEstudiantes(); }, [loadEstudiantes]);
  useEffect(() => { if (estudiantes.length > 0) loadAsistenciaFecha(); }, [fecha, loadAsistenciaFecha, estudiantes.length]);
  useEffect(() => { if (vista === 'resumen') loadResumen(); }, [vista, loadResumen]);
  useEffect(() => { if (vista === 'dia' && estudiantes.length > 0) loadDia(); }, [vista, fecha, loadDia, estudiantes.length]);

  const handleSave = async () => {
    setSaving(true);
    const registros = Object.entries(estados).map(([id, estado]) => ({
      estudiante: Number(id), estado, motivo: motivos[Number(id)] || '',
    }));
    await courseService.registrarAsistenciaBulk(materiaId, fecha, registros);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (vista === 'dia') loadDia();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await courseService.exportarAsistencia(materiaId, {
        ...(exportInicio ? { fecha_inicio: exportInicio } : {}),
        ...(exportFin ? { fecha_fin: exportFin } : {}),
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  const dia = getDayOfWeek(fecha);
  const isWeekend = dia === null;

  return (
    <Box>
      {/* Vista selector */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant={vista === 'tomar' ? 'contained' : 'outlined'} onClick={() => setVista('tomar')}>Tomar lista</Button>
        <Button variant={vista === 'resumen' ? 'contained' : 'outlined'} onClick={() => setVista('resumen')}>Resumen de asistencia</Button>
        <Button variant={vista === 'dia' ? 'contained' : 'outlined'} onClick={() => setVista('dia')}>Vista del día</Button>
      </Box>

      {/* ── Tomar lista ── */}
      {vista === 'tomar' && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField label="Fecha" type="date" value={fecha} onChange={e => setFecha(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} size="small" />
            <Box sx={{ display: 'flex', gap: 1 }}>
              {(['P', 'F', 'L'] as EstadoAsistencia[]).map(e => (
                <Chip key={e} label={`${e} = ${ESTADO_LABELS[e]}`} size="small" sx={{ bgcolor: ESTADO_COLORS[e], color: 'white' }} />
              ))}
            </Box>
          </Box>

          {estudiantes.length === 0 ? (
            <Alert severity="info">No hay estudiantes matriculados en este curso.</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><b>#</b></TableCell>
                    <TableCell><b>Estudiante</b></TableCell>
                    <TableCell align="center">
                      <b>Clase anterior</b>
                      {anterior.fecha && <Typography variant="caption" sx={{ display: 'block' }} color="text.secondary">{anterior.fecha}</Typography>}
                    </TableCell>
                    <TableCell align="center"><b>Hoy</b></TableCell>
                    <TableCell><b>Motivo (F/L)</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {estudiantes.map((e, i) => {
                    const estAnterior = anterior.registros[String(e.id)];
                    return (
                      <TableRow key={e.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell sx={{ color: 'text.secondary' }}>{i + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{e.user.first_name} {e.user.last_name}</TableCell>
                        <TableCell align="center">
                          {estAnterior
                            ? <Chip label={estAnterior} size="small" sx={{ bgcolor: ESTADO_COLORS[estAnterior], color: 'white', minWidth: 36, fontWeight: 700 }} />
                            : <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>
                        <TableCell align="center">
                          <ToggleButtonGroup
                            exclusive size="small"
                            value={estados[e.id] || 'P'}
                            onChange={(_, val) => { if (val) setEstados(prev => ({ ...prev, [e.id]: val })); }}
                          >
                            {(['P', 'F', 'L'] as EstadoAsistencia[]).map(est => (
                              <ToggleButton key={est} value={est} sx={{
                                px: 2, fontWeight: 700,
                                '&.Mui-selected': { bgcolor: ESTADO_COLORS[est], color: 'white', '&:hover': { bgcolor: ESTADO_COLORS[est] } },
                              }}>
                                {est}
                              </ToggleButton>
                            ))}
                          </ToggleButtonGroup>
                        </TableCell>
                        <TableCell>
                          {(estados[e.id] === 'F' || estados[e.id] === 'L') && (
                            <TextField
                              size="small" placeholder="Motivo..."
                              value={motivos[e.id] || ''}
                              onChange={ev => setMotivos(prev => ({ ...prev, [e.id]: ev.target.value }))}
                              sx={{ width: 200 }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 3, alignItems: 'center' }}>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving || estudiantes.length === 0}>
              {saving ? 'Guardando...' : 'Guardar asistencia'}
            </Button>
            {saved && <Chip label="¡Guardado!" color="success" size="small" />}
          </Box>
        </>
      )}

      {/* ── Resumen ── */}
      {vista === 'resumen' && (
        <>
          {/* Descarga Excel */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>Descargar Excel:</Typography>
            <TextField
              label="Desde" type="date" size="small" value={exportInicio}
              onChange={e => setExportInicio(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 160 }}
            />
            <TextField
              label="Hasta" type="date" size="small" value={exportFin}
              onChange={e => setExportFin(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 160 }}
            />
            <Button
              variant="contained" startIcon={<DownloadIcon />}
              onClick={handleExport} disabled={exporting}
              color="success"
            >
              {exporting ? 'Generando...' : 'Descargar'}
            </Button>
          </Paper>

          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><b>Estudiante</b></TableCell>
                  <TableCell align="center"><b>Presentes</b></TableCell>
                  <TableCell align="center"><b>Faltas (F)</b></TableCell>
                  <TableCell align="center"><b>Licencias (L)</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resumen.length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>Sin registros de asistencia</TableCell></TableRow>
                )}
                {resumen.map(r => (
                  <TableRow key={r.estudiante_id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{r.nombre}</TableCell>
                    <TableCell align="center"><Chip label={r.presentes} color="success" size="small" /></TableCell>
                    <TableCell align="center"><Chip label={r.faltas} color={r.faltas > 0 ? 'error' : 'default'} size="small" /></TableCell>
                    <TableCell align="center"><Chip label={r.licencias} color={r.licencias > 0 ? 'info' : 'default'} size="small" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* ── Vista del día ── */}
      {vista === 'dia' && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              label="Fecha" type="date" value={fecha}
              onChange={e => setFecha(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }} size="small"
            />
          </Box>

          {isWeekend && (
            <Alert severity="info">El día seleccionado es fin de semana, no hay clases programadas.</Alert>
          )}

          {!isWeekend && loadingDia && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
          )}

          {!isWeekend && !loadingDia && materiasDelDia.length === 0 && (
            <Alert severity="info">
              No hay materias programadas para este día. Configura el horario del curso en la sección <b>Horario</b>.
            </Alert>
          )}

          {!isWeekend && !loadingDia && materiasDelDia.length > 0 && (
            <Box sx={{ overflowX: 'auto' }}>
              <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        colSpan={materiasDelDia.length + 1}
                        align="center"
                        sx={{ bgcolor: '#f5f5f5', fontWeight: 700, fontSize: '0.95rem', py: 1.5, borderBottom: '2px solid #e0e0e0' }}
                      >
                        {dia ? DIA_DISPLAY[dia] : ''} — {fecha}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{
                        fontWeight: 700, minWidth: 200, fontSize: '0.82rem',
                        position: 'sticky', left: 0, bgcolor: 'white', zIndex: 1,
                        borderRight: '2px solid #e0e0e0',
                      }}>
                        Estudiante
                      </TableCell>
                      {materiasDelDia.map((m, idx) => (
                        <TableCell
                          key={m.id} align="center"
                          sx={{
                            fontWeight: 700, minWidth: 130, fontSize: '0.82rem',
                            color: COL_COLORS[idx % COL_COLORS.length],
                            borderRight: '1px solid #e0e0e0',
                            ...(m.id === materiaId ? { bgcolor: '#e3f2fd' } : {}),
                          }}
                        >
                          {m.nombre}
                          {m.id === materiaId && (
                            <Typography variant="caption" sx={{ display: 'block', color: 'primary.main' }}>
                              ← tu materia
                            </Typography>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {estudiantes.map((e, rowIdx) => (
                      <TableRow
                        key={e.id}
                        sx={{ bgcolor: rowIdx % 2 === 0 ? 'white' : '#fafafa', '&:last-child td': { border: 0 } }}
                      >
                        <TableCell sx={{
                          fontWeight: 500, position: 'sticky', left: 0,
                          bgcolor: rowIdx % 2 === 0 ? 'white' : '#fafafa', zIndex: 1,
                          borderRight: '2px solid #e0e0e0',
                        }}>
                          {e.user.first_name} {e.user.last_name}
                        </TableCell>
                        {materiasDelDia.map(m => {
                          const estado = asistenciaDia[e.id]?.[m.id] ?? null;
                          return (
                            <TableCell
                              key={m.id} align="center"
                              sx={{ borderRight: '1px solid #f0f0f0', ...(m.id === materiaId ? { bgcolor: rowIdx % 2 === 0 ? '#e8f4fd' : '#ddeef9' } : {}) }}
                            >
                              {estado
                                ? <Chip label={estado} size="small" sx={{ bgcolor: ESTADO_COLORS[estado], color: 'white', fontWeight: 700, minWidth: 36 }} />
                                : <Typography variant="caption" color="text.disabled">—</Typography>}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

// ── Tab 2: Actividades ────────────────────────────────────────────────────────

function TabActividades({ cursoId }: { cursoId: number }) {
  const { trimestreActual } = useConfig();
  const emptyActFormDynamic = { nombre: '', descripcion: '', tipo: 'tarea', trimestre: trimestreActual, fecha: '' };
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyActFormDynamic);
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const acts = await courseService.getActividades(cursoId);
    setActividades(acts);
    setLoading(false);
  }, [cursoId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setError('');
    if (!form.nombre.trim()) { setError('El nombre es requerido.'); return; }
    try {
      if (editing) await courseService.updateActividad(editing, form);
      else await courseService.createActividad(cursoId, form);
      setOpen(false);
      load();
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Error al guardar.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar esta actividad?')) return;
    await courseService.deleteActividad(id);
    load();
  };

  const openEdit = (a: Actividad) => {
    setForm({ nombre: a.nombre, descripcion: a.descripcion, tipo: a.tipo, trimestre: a.trimestre, fecha: a.fecha || '' });
    setEditing(a.id);
    setError('');
    setOpen(true);
  };

  const TIPO_COLORS: Record<string, string> = {
    tarea: '#1565c0', examen: '#c62828', proyecto: '#2e7d32',
    participacion: '#e65100', otro: '#6a1b9a',
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  // Agrupar por trimestre
  const byTrimestre: Record<string, Actividad[]> = { T1: [], T2: [], T3: [] };
  actividades.forEach(a => { (byTrimestre[a.trimestre] = byTrimestre[a.trimestre] || []).push(a); });

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm(emptyActFormDynamic); setEditing(null); setError(''); setOpen(true); }}>
          Nueva Actividad
        </Button>
      </Box>

      {actividades.length === 0 ? (
        <Alert severity="info">No hay actividades creadas para esta materia. Crea la primera actividad para comenzar.</Alert>
      ) : (
        TRIMESTRES.map(t => {
          const acts = byTrimestre[t] || [];
          if (acts.length === 0) return null;
          return (
            <Box key={t} sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Chip label={TRIMESTRE_LABEL[t]} color="primary" size="small" sx={{ fontWeight: 700 }} />
                <Typography variant="caption" color="text.secondary">({acts.length} actividades)</Typography>
              </Box>
              <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {acts.map(a => (
                      <TableRow key={a.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{a.nombre}</Typography>
                          {a.descripcion && <Typography variant="caption" color="text.secondary">{a.descripcion}</Typography>}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={a.tipo}
                            size="small"
                            sx={{ bgcolor: TIPO_COLORS[a.tipo] || '#555', color: 'white', fontWeight: 600, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{a.fecha || '—'}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => openEdit(a)}><EditIcon fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton size="small" color="error" onClick={() => handleDelete(a.id)}><DeleteIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          );
        })
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar Actividad' : 'Nueva Actividad'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} fullWidth required />
          <TextField label="Descripción" multiline rows={2} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} fullWidth />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Tipo" select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} fullWidth>
              {TIPOS.map(t => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>)}
            </TextField>
            <TextField label="Trimestre" select value={form.trimestre} onChange={e => setForm({ ...form, trimestre: e.target.value })} fullWidth required>
              {TRIMESTRES.map(t => <MenuItem key={t} value={t}>{TRIMESTRE_LABEL[t]}</MenuItem>)}
            </TextField>
          </Box>
          <TextField label="Fecha" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>{editing ? 'Actualizar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Tab 3: Centro de Notas ─────────────────────────────────────────────────────

function TabCentroNotas({ cursoId }: { cursoId: number }) {
  const { trimestreActual } = useConfig();
  const [trimestre, setTrimestre] = useState<string>(trimestreActual);
  const [data, setData] = useState<CentroNotas | null>(null);
  const [editingCell, setEditingCell] = useState<{ estId: number; actId: number } | null>(null);
  const [cellValue, setCellValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await courseService.getCentroNotas(cursoId, trimestre);
    setData(d);
    setLoading(false);
  }, [cursoId, trimestre]);

  useEffect(() => { load(); }, [load]);

  const handleCellClick = (estId: number, actId: number, currentNota: number | null) => {
    setEditingCell({ estId, actId });
    setCellValue(currentNota !== null && currentNota !== undefined ? String(currentNota) : '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;
    const nota = cellValue === '' ? null : parseFloat(cellValue);
    await courseService.guardarNota(editingCell.estId, editingCell.actId, nota);
    setEditingCell(null);
    await load();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await courseService.exportarNotas(cursoId, { trimestre });
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (!data) return null;

  const { actividades, filas } = data;

  return (
    <Box>
      {/* Selector de trimestre + descarga */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {TRIMESTRES.map(t => (
            <Button
              key={t}
              variant={trimestre === t ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setTrimestre(t)}
              sx={{ fontWeight: 700 }}
            >
              {t}
            </Button>
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">Escala: 0 – 100</Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={exporting}
            color="success"
          >
            {exporting ? 'Generando...' : 'Excel'}
          </Button>
        </Box>
      </Box>

      {actividades.length === 0 ? (
        <Alert severity="info">
          No hay actividades en {TRIMESTRE_LABEL[trimestre]}. Créalas en la pestaña "Actividades".
        </Alert>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" component={Paper} sx={{ borderRadius: 2 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 700, minWidth: 200, position: 'sticky', left: 0, bgcolor: 'primary.main', zIndex: 1 }}>
                  Estudiante
                </TableCell>
                {actividades.map(a => (
                  <TableCell key={a.id} align="center" sx={{ color: 'white', fontWeight: 700, minWidth: 130 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>{a.nombre}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'capitalize' }}>{a.tipo}</Typography>
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ color: 'white', fontWeight: 700, minWidth: 100, bgcolor: '#e65100' }}>
                  Promedio
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filas.map(fila => {
                const notas = actividades.map(a => fila.notas[String(a.id)]).filter(n => n !== null && n !== undefined) as number[];
                const promedio = notas.length > 0 ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length * 10) / 10 : null;
                return (
                  <TableRow key={fila.estudiante_id} hover>
                    <TableCell sx={{ fontWeight: 500, position: 'sticky', left: 0, bgcolor: 'white', zIndex: 1, borderRight: '1px solid #e0e0e0' }}>
                      {fila.nombre}
                    </TableCell>
                    {actividades.map(a => {
                      const nota = fila.notas[String(a.id)];
                      const isEditing = editingCell?.estId === fila.estudiante_id && editingCell?.actId === a.id;
                      return (
                        <TableCell
                          key={a.id} align="center"
                          sx={{ bgcolor: notaColor(nota ?? null), cursor: 'pointer', '&:hover': { bgcolor: '#e3f2fd' } }}
                          onClick={() => !isEditing && handleCellClick(fila.estudiante_id, a.id, nota ?? null)}
                        >
                          {isEditing ? (
                            <TextField
                              autoFocus size="small" type="number" value={cellValue}
                              onChange={e => setCellValue(e.target.value)}
                              onBlur={handleCellSave}
                              onKeyDown={e => { if (e.key === 'Enter') handleCellSave(); if (e.key === 'Escape') setEditingCell(null); }}
                              slotProps={{ htmlInput: { min: 0, max: 100, step: 0.5 } }}
                              sx={{ width: 80 }}
                            />
                          ) : (
                            <Typography variant="body2" sx={{ fontWeight: nota !== null && nota !== undefined ? 600 : 400, color: nota === null || nota === undefined ? 'text.disabled' : 'inherit' }}>
                              {nota !== null && nota !== undefined ? nota : '—'}
                            </Typography>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell align="center" sx={{ bgcolor: promedio !== null ? notaColor(promedio) : 'inherit', fontWeight: 700 }}>
                      {promedio !== null ? promedio : <Typography variant="caption" color="text.disabled">—</Typography>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}

      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: '#e8f5e9' }} />
          <Typography variant="caption" color="text.secondary">≥ 65 (aprobado)</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: '#fff8e1' }} />
          <Typography variant="caption" color="text.secondary">≥ 51 (mínimo)</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: '#ffebee' }} />
          <Typography variant="caption" color="text.secondary">{'< 51 (reprobado)'}</Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function TeacherCoursePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [curso, setCurso] = useState<Materia | null>(null);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const materiaId = Number(id);

  useEffect(() => {
    courseService.getMisMaterias().then(cursos => {
      const c = cursos.find(c => c.id === materiaId);
      setCurso(c || null);
      setLoading(false);
    });
  }, [materiaId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (!curso) return <Alert severity="error">Curso no encontrado o no tienes acceso.</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/docente')}><ArrowBackIcon /></IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{curso.nombre}</Typography>
          <Typography variant="body2" color="text.secondary">{curso.curso?.nombre} • {curso.codigo}</Typography>
        </Box>
      </Box>

      <Paper sx={{ borderRadius: 3, boxShadow: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Asistencia" />
          <Tab label="Actividades" />
          <Tab label="Centro de Notas" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {tab === 0 && <TabAsistencia materiaId={materiaId} claseCursoId={curso.curso.id} />}
          {tab === 1 && <TabActividades cursoId={materiaId} />}
          {tab === 2 && <TabCentroNotas cursoId={materiaId} />}
        </Box>
      </Paper>
    </Box>
  );
}
