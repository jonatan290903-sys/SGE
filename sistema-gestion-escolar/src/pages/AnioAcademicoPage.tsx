import React, { useState } from 'react';
import {
  Box, Typography, Button, Card, CardContent, CardActions,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Switch, FormControlLabel, Chip, Alert, CircularProgress,
  Divider, IconButton, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import api from '../services/api';
import { useConfig, AnioAcademico } from '../contexts/ConfigContext';

const TRIMESTRE_INFO = [
  { nombre: 'T1', label: 'Trimestre 1', color: '#1565c0' },
  { nombre: 'T2', label: 'Trimestre 2', color: '#e65100' },
  { nombre: 'T3', label: 'Trimestre 3', color: '#2e7d32' },
];

interface TrimestreForm {
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
}

interface AnioForm {
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  trimestres: TrimestreForm[];
}

const emptyForm: AnioForm = {
  nombre: '',
  fecha_inicio: '',
  fecha_fin: '',
  activo: false,
  trimestres: [
    { nombre: 'T1', fecha_inicio: '', fecha_fin: '' },
    { nombre: 'T2', fecha_inicio: '', fecha_fin: '' },
    { nombre: 'T3', fecha_inicio: '', fecha_fin: '' },
  ],
};

export default function AnioAcademicoPage() {
  const { anios, anioActivo, trimestreActual, refresh, loading } = useConfig();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AnioForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleOpen = (anio?: AnioAcademico) => {
    if (anio) {
      const trimestresForm = TRIMESTRE_INFO.map(t => {
        const existing = anio.trimestres.find(tr => tr.nombre === t.nombre);
        return { nombre: t.nombre, fecha_inicio: existing?.fecha_inicio || '', fecha_fin: existing?.fecha_fin || '' };
      });
      setForm({ nombre: anio.nombre, fecha_inicio: anio.fecha_inicio, fecha_fin: anio.fecha_fin, activo: anio.activo, trimestres: trimestresForm });
      setEditingId(anio.id);
    } else {
      setForm(emptyForm);
      setEditingId(null);
    }
    setError('');
    setOpen(true);
  };

  const handleSave = async () => {
    setError('');
    if (!form.nombre.trim() || !form.fecha_inicio || !form.fecha_fin) {
      setError('El nombre y las fechas del año escolar son requeridos.');
      return;
    }
    for (const t of form.trimestres) {
      if (t.fecha_inicio && t.fecha_fin && t.fecha_inicio > t.fecha_fin) {
        setError(`Las fechas del ${t.nombre} son inválidas.`);
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        trimestres: form.trimestres.filter(t => t.fecha_inicio && t.fecha_fin),
      };
      if (editingId) {
        await api.put(`/api/v1/auth/anios/${editingId}/`, payload);
      } else {
        await api.post('/api/v1/auth/anios/', payload);
      }
      setOpen(false);
      refresh();
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este año académico? Se perderá la configuración de trimestres.')) return;
    setDeleting(id);
    try {
      await api.delete(`/api/v1/auth/anios/${id}/`);
      refresh();
    } finally {
      setDeleting(null);
    }
  };

  const handleActivar = async (anio: AnioAcademico) => {
    try {
      await api.put(`/api/v1/auth/anios/${anio.id}/`, { ...anio, activo: true, trimestres: anio.trimestres });
      refresh();
    } catch {}
  };

  const updateTrimestre = (idx: number, field: 'fecha_inicio' | 'fecha_fin', value: string) => {
    setForm(prev => {
      const trimestres = [...prev.trimestres];
      trimestres[idx] = { ...trimestres[idx], [field]: value };
      return { ...prev, trimestres };
    });
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Años Académicos</Typography>
          <Typography variant="body2" color="text.secondary">
            Configura los periodos escolares y las fechas de cada trimestre
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Nuevo Año
        </Button>
      </Box>

      {/* Info actual */}
      {anioActivo && (
        <Alert
          severity="info"
          icon={<CalendarMonthIcon />}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          <strong>Año activo: {anioActivo.nombre}</strong> — Trimestre en curso:{' '}
          <Chip label={trimestreActual} size="small" color="primary" sx={{ fontWeight: 700, ml: 0.5 }} />
        </Alert>
      )}

      {anios.length === 0 && (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          No hay años académicos configurados. Crea el primero para comenzar a usar el sistema de periodos.
        </Alert>
      )}

      {/* Tarjetas de años */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {anios.map(anio => (
          <Box key={anio.id} sx={{ flex: '1 1 300px', minWidth: 280, maxWidth: { xs: '100%', md: '45%', lg: '31%' } }}>
            <Card
              sx={{
                borderRadius: 3,
                height: '100%',
                border: anio.activo ? '2px solid #1976d2' : '1px solid #e0e0e0',
                boxShadow: anio.activo ? '0 4px 20px rgba(25,118,210,0.2)' : 1,
                transition: 'box-shadow 0.2s',
                display: 'flex', flexDirection: 'column',
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarMonthIcon sx={{ color: anio.activo ? 'primary.main' : 'text.secondary' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{anio.nombre}</Typography>
                  </Box>
                  {anio.activo
                    ? <Chip label="Activo" color="primary" size="small" icon={<CheckCircleIcon />} sx={{ fontWeight: 700 }} />
                    : <Chip label="Archivado" size="small" icon={<RadioButtonUncheckedIcon />} variant="outlined" />
                  }
                </Box>

                <Typography variant="caption" color="text.secondary">
                  {anio.fecha_inicio} → {anio.fecha_fin}
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                {anio.trimestres.length === 0 ? (
                  <Typography variant="caption" color="text.disabled">Sin trimestres configurados</Typography>
                ) : (
                  anio.trimestres.map(t => {
                    const info = TRIMESTRE_INFO.find(i => i.nombre === t.nombre);
                    return (
                      <Box key={t.nombre} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Chip label={t.nombre} size="small" sx={{ bgcolor: info?.color, color: 'white', fontWeight: 700, minWidth: 36 }} />
                        <Typography variant="caption" color="text.secondary">
                          {t.fecha_inicio} → {t.fecha_fin}
                        </Typography>
                      </Box>
                    );
                  })
                )}
              </CardContent>

              <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                {!anio.activo && (
                  <Tooltip title="Activar este año académico">
                    <Button size="small" color="primary" onClick={() => handleActivar(anio)}>
                      Activar
                    </Button>
                  </Tooltip>
                )}
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => handleOpen(anio)}><EditIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton
                    size="small" color="error"
                    onClick={() => handleDelete(anio.id)}
                    disabled={deleting === anio.id || anio.activo}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Dialog de creación/edición */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar Año Académico' : 'Nuevo Año Académico'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Nombre del año" value={form.nombre} fullWidth required
              placeholder="Ej: 2025"
              onChange={e => setForm({ ...form, nombre: e.target.value })}
            />
            <FormControlLabel
              control={<Switch checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} color="primary" />}
              label="Activo"
              sx={{ minWidth: 90 }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Inicio del año" type="date" value={form.fecha_inicio} fullWidth required
              onChange={e => setForm({ ...form, fecha_inicio: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Fin del año" type="date" value={form.fecha_fin} fullWidth required
              onChange={e => setForm({ ...form, fecha_fin: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <Divider><Typography variant="caption" color="text.secondary">Fechas de Trimestres</Typography></Divider>

          {form.trimestres.map((t, idx) => {
            const info = TRIMESTRE_INFO.find(i => i.nombre === t.nombre)!;
            return (
              <Box key={t.nombre} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Chip
                  label={info.label}
                  size="small"
                  sx={{ bgcolor: info.color, color: 'white', fontWeight: 700, minWidth: 96, flexShrink: 0 }}
                />
                <TextField
                  label="Inicio" type="date" size="small" value={t.fecha_inicio}
                  onChange={e => updateTrimestre(idx, 'fecha_inicio', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: 1 }}
                />
                <TextField
                  label="Fin" type="date" size="small" value={t.fecha_fin}
                  onChange={e => updateTrimestre(idx, 'fecha_fin', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: 1 }}
                />
              </Box>
            );
          })}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
