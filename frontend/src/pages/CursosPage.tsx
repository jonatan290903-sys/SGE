import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, CircularProgress, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, TableContainer, Card, Tooltip, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { courseService } from '../services/courseService';
import { studentService } from '../services/studentService';
import { Materia, Curso, Docente } from '../types';

const emptyForm = { nombre: '', codigo: '', curso_id: '', docente_id: '', descripcion: '', numero_horas: '', creditos: 0 };

export default function CursosPage() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [mat, cur, doc] = await Promise.all([courseService.getMaterias(), studentService.getCursos(), courseService.getDocentes()]);
      setMaterias(mat); setCursos(cur); setDocentes(doc);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setError(''); setOpen(true); };
  const openEdit = (m: Materia) => {
    setForm({ nombre: m.nombre, codigo: m.codigo, curso_id: m.curso?.id || '', docente_id: m.docente?.id || '', descripcion: m.descripcion, numero_horas: m.numero_horas, creditos: m.creditos });
    setEditing(m.id); setError(''); setOpen(true);
  };

  const handleSave = async () => {
    setError('');
    try {
      if (editing) await courseService.updateMateria(editing, form);
      else await courseService.createMateria(form);
      setOpen(false); load();
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Error al guardar.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Desactivar esta materia?')) return;
    await courseService.deleteMateria(id);
    load();
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <CircularProgress />
    </Box>
  );

  const materiasPorCurso = cursos.reduce<Record<number, Materia[]>>((acc, curso) => {
    acc[curso.id] = [];
    return acc;
  }, {});

  materias.forEach((m) => {
    if (m.curso?.id) {
      materiasPorCurso[m.curso.id] = materiasPorCurso[m.curso.id] || [];
      materiasPorCurso[m.curso.id].push(m);
    }
  });

  const cursosConMaterias = cursos.filter(c => (materiasPorCurso[c.id] || []).length > 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Materias</Typography>
          <Typography variant="body2" color="text.secondary">Gestiona materias y revisa los cursos que tienen materias vinculadas.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ borderRadius: 2 }}>Nueva Materia</Button>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 4 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                {['Nombre', 'Código', 'Curso', 'Docente', 'Horas', 'Estado', 'Acciones'].map(h => (
                  <TableCell key={h} align={h === 'Acciones' ? 'right' : 'left'}><b>{h}</b></TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {materias.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No hay materias registradas</TableCell></TableRow>
              )}
              {materias.map(m => (
                <TableRow key={m.id} hover>
                  <TableCell>{m.nombre}</TableCell>
                  <TableCell><Chip label={m.codigo} size="small" variant="outlined" /></TableCell>
                  <TableCell>{m.curso?.nombre || '—'}</TableCell>
                  <TableCell>{m.docente ? `${m.docente.user.first_name} ${m.docente.user.last_name}` : '—'}</TableCell>
                  <TableCell>{m.numero_horas}h</TableCell>
                  <TableCell><Chip label={m.estado ? 'Activo' : 'Inactivo'} color={m.estado ? 'success' : 'default'} size="small" /></TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(m)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Desactivar"><IconButton size="small" color="error" onClick={() => handleDelete(m.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Cursos con materias vinculadas</Typography>
      <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 4 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><b>Curso</b></TableCell>
                <TableCell><b>Período</b></TableCell>
                <TableCell><b>Materias vinculadas</b></TableCell>
                <TableCell align="right"><b>Total</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cursosConMaterias.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>No hay cursos con materias vinculadas</TableCell></TableRow>
              )}
              {cursosConMaterias.map(c => (
                <TableRow key={c.id} hover>
                  <TableCell>{c.nombre}</TableCell>
                  <TableCell>{c.periodo || '—'}</TableCell>
                  <TableCell>
                    {materiasPorCurso[c.id].map((m) => (
                      <Chip key={m.id} label={m.nombre} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </TableCell>
                  <TableCell align="right"><b>{materiasPorCurso[c.id].length}</b></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar Materia' : 'Nueva Materia'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} fullWidth />
          <TextField label="Código" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} fullWidth />
          <TextField label="Curso" select value={form.curso_id} onChange={e => setForm({ ...form, curso_id: e.target.value })} fullWidth>
            {cursos.map(c => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
          </TextField>
          <TextField label="Docente" select value={form.docente_id} onChange={e => setForm({ ...form, docente_id: e.target.value })} fullWidth>
            <MenuItem value="">Sin asignar</MenuItem>
            {docentes.map(d => <MenuItem key={d.id} value={d.id}>{d.user.first_name} {d.user.last_name}</MenuItem>)}
          </TextField>
          <TextField label="N° de horas" type="number" value={form.numero_horas} onChange={e => setForm({ ...form, numero_horas: e.target.value })} fullWidth />
          <TextField label="Créditos" type="number" value={form.creditos} onChange={e => setForm({ ...form, creditos: e.target.value })} fullWidth />
          <TextField label="Descripción" multiline rows={2} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>{editing ? 'Actualizar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
