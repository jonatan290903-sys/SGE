import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, CircularProgress, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, TableContainer, Card, Tooltip, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { courseService } from '../services/courseService';
import api from '../services/api';
import { Docente } from '../types';

const emptyForm = { first_name: '', last_name: '', email: '', especialidad: '', titulo_profesional: '', documento: '', fecha_contratacion: '', estado: 'activo' };

export default function DocentesPage() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try { setDocentes(await courseService.getDocentes()); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setError(''); setOpen(true); };
  const openEdit = (d: Docente) => {
    setForm({ 
      first_name: d.user?.first_name || '',
      last_name: d.user?.last_name || '',
      email: d.user?.email || '',
      especialidad: d.especialidad, 
      titulo_profesional: d.titulo_profesional, 
      documento: d.documento, 
      fecha_contratacion: d.fecha_contratacion, 
      estado: d.estado 
    });
    setEditing(d.id); setError(''); setOpen(true);
  };

  const handleSave = async () => {
    setError('');
    try {
      if (editing) await api.put(`/api/v1/auth/docentes/${editing}/`, form);
      else await api.post('/api/v1/auth/docentes/', form);
      setOpen(false); load();
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Error al guardar.');
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Docentes</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ borderRadius: 2 }}>
          Nuevo Docente
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><b>Nombre</b></TableCell>
                <TableCell><b>Documento</b></TableCell>
                <TableCell><b>Especialidad</b></TableCell>
                <TableCell><b>Título</b></TableCell>
                <TableCell><b>Contratación</b></TableCell>
                <TableCell><b>Estado</b></TableCell>
                <TableCell align="right"><b>Acciones</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {docentes.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No hay docentes registrados</TableCell></TableRow>
              )}
              {docentes.map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell>{d.user.first_name} {d.user.last_name}</TableCell>
                  <TableCell>{d.documento}</TableCell>
                  <TableCell>{d.especialidad}</TableCell>
                  <TableCell>{d.titulo_profesional}</TableCell>
                  <TableCell>{d.fecha_contratacion}</TableCell>
                  <TableCell><Chip label={d.estado} color={d.estado === 'activo' ? 'success' : 'default'} size="small" /></TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(d)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar Docente' : 'Nuevo Docente'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Nombres" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} fullWidth />
          <TextField label="Apellidos" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} fullWidth />
          <TextField label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} fullWidth />
          <TextField label="Documento" value={form.documento} onChange={e => setForm({ ...form, documento: e.target.value })} fullWidth />
          <TextField label="Especialidad" value={form.especialidad} onChange={e => setForm({ ...form, especialidad: e.target.value })} fullWidth />
          <TextField label="Título Profesional" value={form.titulo_profesional} onChange={e => setForm({ ...form, titulo_profesional: e.target.value })} fullWidth />
          <TextField label="Fecha de contratación" type="date" value={form.fecha_contratacion} onChange={e => setForm({ ...form, fecha_contratacion: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Estado" select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} fullWidth>
            <MenuItem value="activo">Activo</MenuItem>
            <MenuItem value="inactivo">Inactivo</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>{editing ? 'Actualizar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
