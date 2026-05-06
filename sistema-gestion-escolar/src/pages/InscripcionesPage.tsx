import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert, Chip,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  IconButton, Tooltip, Autocomplete,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useConfig } from '../contexts/ConfigContext';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { courseService } from '../services/courseService';
import { studentService } from '../services/studentService';
import { Inscripcion, Estudiante, Curso } from '../types';

const ESTADO_COLOR: Record<string, 'success' | 'error' | 'default'> = {
  activo: 'success',
  retirado: 'error',
  culminado: 'default',
};

export default function InscripcionesPage() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ estudiante_id: '', curso_id: '' });
  const [selectedEstudiante, setSelectedEstudiante] = useState<Estudiante | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { anioActivo, periodoVisor, anios } = useConfig();
  const selectedYear = periodoVisor || anioActivo?.nombre;
  const selectedAnio = anios.find(a => a.nombre === selectedYear) || null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedYearHasStarted = !selectedAnio || new Date(selectedAnio.fecha_inicio) <= today;

  const load = async () => {
    try {
      const [insc, est, cur] = await Promise.all([
        courseService.getInscripciones(),
        studentService.getEstudiantes(),
        studentService.getCursos(),
      ]);
      setInscripciones(insc);
      setEstudiantes(est);
      setCursos(cur);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selectedCurso = cursos.find(c => String(c.id) === form.curso_id);
  const inscripcionesActuales = selectedYear
    ? inscripciones.filter(ins => ins.curso.periodo === selectedYear && ins.estado === 'activo')
    : inscripciones.filter(ins => ins.estado === 'activo');
  const inscritosActuales = new Set(inscripcionesActuales.map(ins => ins.estudiante.id));
  const estudiantesDisponibles = estudiantes.filter(e => e.estado === 'activo' && !inscritosActuales.has(e.id));

  const openForm = () => { setForm({ estudiante_id: '', curso_id: '' }); setSelectedEstudiante(null); setError(''); setOpen(true); };

  const handleSave = async () => {
    if (!form.estudiante_id || !form.curso_id) { setError('Selecciona un estudiante y un curso.'); return; }
    if (!selectedYearHasStarted) { setError('El año escolar no ha empezado todavía.'); return; }
    setSaving(true); setError('');
    try {
      await courseService.createInscripcion({
        estudiante_id: Number(form.estudiante_id),
        curso_id: Number(form.curso_id),
      });
      setOpen(false);
      load();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data
        ? JSON.stringify(err.response.data)
        : 'Error al inscribir.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleRetirar = async (id: number) => {
    if (!window.confirm('¿Retirar esta inscripción? Las matrículas asociadas pasarán a estado retirado.')) return;
    await courseService.deleteInscripcion(id);
    load();
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Inscripciones</Typography>
          <Typography variant="body2" color="text.secondary">
            Inscribe estudiantes a un curso y se matriculan automáticamente en todas sus materias
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={openForm} sx={{ borderRadius: 2 }}>
          Nueva Inscripción
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                {['Estudiante', 'Expediente', 'Curso', 'Período', 'Fecha', 'Estado', 'Registrada por', 'Acciones'].map(h => (
                  <TableCell key={h} align={h === 'Acciones' ? 'right' : 'left'}><b>{h}</b></TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {inscripcionesActuales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No hay inscripciones registradas para el año {selectedYear ?? 'actual'}
                  </TableCell>
                </TableRow>
              )}
              {inscripcionesActuales.map(ins => (
                <TableRow key={ins.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {ins.estudiante.user.first_name} {ins.estudiante.user.last_name}
                  </TableCell>
                  <TableCell>
                    <Chip label={ins.estudiante.numero_expediente} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{ins.curso.nombre}</TableCell>
                  <TableCell>
                    {ins.curso.periodo
                      ? <Chip label={ins.curso.periodo} size="small" color="primary" variant="outlined" />
                      : <Typography variant="caption" color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell>{new Date(ins.fecha_inscripcion).toLocaleDateString('es-PE')}</TableCell>
                  <TableCell>
                    <Chip
                      label={ins.estado}
                      size="small"
                      color={ESTADO_COLOR[ins.estado] ?? 'default'}
                    />
                  </TableCell>
                  <TableCell>{ins.registrada_por ?? '—'}</TableCell>
                  <TableCell align="right">
                    {ins.estado === 'activo' && (
                      <Tooltip title="Retirar inscripción">
                        <IconButton size="small" color="error" onClick={() => handleRetirar(ins.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="primary" /> Nueva Inscripción
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Autocomplete
            options={estudiantesDisponibles}
            value={selectedEstudiante}
            onChange={(_, value) => {
              setSelectedEstudiante(value);
              setForm({ ...form, estudiante_id: value ? String(value.id) : '' });
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => `${option.user.first_name} ${option.user.last_name} — ${option.numero_expediente}`}
            filterOptions={(options, { inputValue }) => options.filter(o => {
              const label = `${o.user.first_name} ${o.user.last_name}`.toLowerCase();
              const labelReverse = `${o.user.last_name} ${o.user.first_name}`.toLowerCase();
              const term = inputValue.toLowerCase();
              return label.includes(term) || labelReverse.includes(term) || o.numero_expediente.includes(term);
            })}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Estudiante"
                placeholder="Busca por nombre o expediente"
                fullWidth
              />
            )}
            noOptionsText={selectedYearHasStarted ? 'No hay estudiantes disponibles' : 'No hay estudiantes disponibles'}
          />
          {!selectedYearHasStarted && selectedAnio && (
            <Alert severity="info">El año escolar {selectedAnio.nombre} inicia el {selectedAnio.fecha_inicio}. Puedes buscar estudiantes, pero la inscripción estará habilitada después de esa fecha.</Alert>
          )}

          {selectedCurso && !selectedCurso.periodo && (
            <Alert severity="warning">
              Este curso no tiene un período asignado. Configúralo desde la gestión de cursos.
            </Alert>
          )}
          {!selectedYearHasStarted && selectedAnio && (
            <Alert severity="warning">
              El año escolar {selectedAnio.nombre} aún no ha iniciado (comienza el {selectedAnio.fecha_inicio}). No puedes inscribir estudiantes hasta esa fecha.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !selectedYearHasStarted}>
            {saving ? 'Inscribiendo...' : 'Inscribir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
