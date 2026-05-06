import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, TableContainer, Card, Alert, Chip, Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import { paymentService } from '../services/paymentService';
import { studentService } from '../services/studentService';
import { Pago, Estudiante } from '../types';

const ESTADO_COLOR: Record<string, any> = {
  pendiente: 'warning', pagado: 'success', vencido: 'error', parcial: 'info', cancelado: 'default',
};

const CONCEPTOS = ['matricula', 'pension', 'matricula_pension', 'actividades', 'otros'];
const emptyForm = { estudiante_id: '', monto: '', concepto: 'pension', fecha_vencimiento: '', estado: 'pendiente', metodo_pago: '', notas: '' };

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [pag, est] = await Promise.all([paymentService.getPagos(), studentService.getEstudiantes()]);
      setPagos(pag); setEstudiantes(est);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setError('');
    try {
      await paymentService.createPago(form);
      setOpen(false); load();
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Error al guardar.');
    }
  };

  const marcarPagado = async (pago: Pago) => {
    await paymentService.updatePago(pago.id, { estado: 'pagado', fecha_pago: new Date().toISOString().split('T')[0] });
    load();
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <CircularProgress />
    </Box>
  );

  const pendientes = pagos.filter(p => p.estado === 'pendiente' || p.estado === 'vencido').length;
  const totalMonto = pagos.filter(p => p.estado === 'pagado').reduce((s, p) => s + parseFloat(p.monto), 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Pagos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm(emptyForm); setError(''); setOpen(true); }} sx={{ borderRadius: 2 }}>
          Registrar Pago
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total cobrado', value: `S/ ${totalMonto.toFixed(2)}`, color: '#388e3c' },
          { label: 'Pendientes / Vencidos', value: pendientes, color: '#d32f2f' },
          { label: 'Total registros', value: pagos.length, color: '#1976d2' },
        ].map(({ label, value, color }) => (
          <Grid size={{ xs: 12, sm: 4 }} key={label}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, borderLeft: `4px solid ${color}` }}>
              <Box sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color }}>{value}</Typography>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                {['Estudiante', 'Concepto', 'Monto', 'Vencimiento', 'Estado', 'Acciones'].map(h => <TableCell key={h}><b>{h}</b></TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {pagos.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No hay pagos registrados</TableCell></TableRow>
              )}
              {pagos.map(p => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.estudiante_info ? `${p.estudiante_info.user.first_name} ${p.estudiante_info.user.last_name}` : '—'}</TableCell>
                  <TableCell>{p.concepto}</TableCell>
                  <TableCell><b>S/ {parseFloat(p.monto).toFixed(2)}</b></TableCell>
                  <TableCell>{p.fecha_vencimiento}</TableCell>
                  <TableCell><Chip label={p.estado} color={ESTADO_COLOR[p.estado]} size="small" /></TableCell>
                  <TableCell>
                    {(p.estado === 'pendiente' || p.estado === 'vencido') && (
                      <Button size="small" variant="outlined" color="success" startIcon={<CheckIcon />} onClick={() => marcarPagado(p)}>
                        Marcar pagado
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Pago</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Estudiante" select value={form.estudiante_id} onChange={e => setForm({ ...form, estudiante_id: e.target.value })} fullWidth>
            {estudiantes.map(e => <MenuItem key={e.id} value={e.id}>{e.user.first_name} {e.user.last_name}</MenuItem>)}
          </TextField>
          <TextField label="Concepto" select value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} fullWidth>
            {CONCEPTOS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <TextField label="Monto (S/)" type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} fullWidth slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
          <TextField label="Fecha de vencimiento" type="date" value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Método de pago" value={form.metodo_pago} onChange={e => setForm({ ...form, metodo_pago: e.target.value })} fullWidth placeholder="Efectivo, Transferencia, Tarjeta..." />
          <TextField label="Notas" multiline rows={2} value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Registrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
