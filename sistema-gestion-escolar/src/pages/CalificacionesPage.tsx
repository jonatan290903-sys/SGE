import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CircularProgress, MenuItem, TextField,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Alert, Button,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { courseService } from '../services/courseService';
import { Materia, CentroNotas } from '../types';

const TRIMESTRES = ['T1', 'T2', 'T3'] as const;
const TRIMESTRE_LABEL: Record<string, string> = { T1: 'Trimestre 1', T2: 'Trimestre 2', T3: 'Trimestre 3' };

function notaDisplay(nota: number | null | undefined) {
  if (nota === null || nota === undefined) return <Typography variant="body2" color="text.disabled">—</Typography>;
  const color = nota >= 65 ? '#2e7d32' : nota >= 51 ? '#e65100' : '#c62828';
  return <Typography variant="body2" sx={{ fontWeight: 700, color }}>{nota.toFixed(1)}</Typography>;
}

export default function CalificacionesPage() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [materiaId, setMateriaId] = useState<string>('');
  const [trimestre, setTrimestre] = useState<string>('T1');
  const [centroNotas, setCentroNotas] = useState<CentroNotas | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingNotas, setLoadingNotas] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    courseService.getMaterias().then(setMaterias).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!materiaId) { setCentroNotas(null); return; }
    setLoadingNotas(true);
    courseService.getCentroNotas(Number(materiaId), trimestre)
      .then(setCentroNotas)
      .catch(() => setCentroNotas(null))
      .finally(() => setLoadingNotas(false));
  }, [materiaId, trimestre]);

  const handleExport = async () => {
    if (!materiaId) return;
    setExporting(true);
    try {
      await courseService.exportarNotas(Number(materiaId), { trimestre });
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Calificaciones por Materia</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <TextField
            select label="Seleccionar materia" value={materiaId}
            onChange={e => setMateriaId(e.target.value)} sx={{ minWidth: 300 }}
          >
            <MenuItem value=""><em>— Selecciona una materia —</em></MenuItem>
            {materias.map(m => <MenuItem key={m.id} value={String(m.id)}>{m.nombre} ({m.codigo})</MenuItem>)}
          </TextField>
          {materiaId && (
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
          )}
          {materiaId && (
            <Button
              variant="outlined" color="success" size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExport} disabled={exporting}
            >
              {exporting ? 'Generando...' : 'Descargar Excel'}
            </Button>
          )}
        </Box>
      </Box>

      {materiaId && (
        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
          {loadingNotas ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={28} /></Box>
          ) : !centroNotas || centroNotas.actividades.length === 0 ? (
            <Box sx={{ p: 4 }}>
              <Alert severity="info">
                No hay actividades en {TRIMESTRE_LABEL[trimestre]} para esta materia.
              </Alert>
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 520 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, minWidth: 180, bgcolor: 'grey.50', position: 'sticky', left: 0, zIndex: 3 }}>
                      Estudiante
                    </TableCell>
                    {centroNotas.actividades.map(act => (
                      <TableCell key={act.id} align="center" sx={{ fontWeight: 700, minWidth: 120, bgcolor: 'grey.50' }}>
                        <Typography variant="caption" noWrap sx={{ display: 'block', maxWidth: 110, fontWeight: 700 }}>{act.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{act.tipo}</Typography>
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ fontWeight: 700, minWidth: 100, bgcolor: '#fff3e0' }}>
                      Promedio
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {centroNotas.filas.map(fila => {
                    const notas = centroNotas.actividades.map(a => fila.notas[String(a.id)]).filter(n => n !== null && n !== undefined) as number[];
                    const promedio = notas.length > 0 ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length * 10) / 10 : null;
                    return (
                      <TableRow key={fila.estudiante_id} hover>
                        <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'white', zIndex: 1, fontWeight: 500 }}>
                          {fila.nombre}
                        </TableCell>
                        {centroNotas.actividades.map(act => (
                          <TableCell key={act.id} align="center">
                            {notaDisplay(fila.notas[String(act.id)])}
                          </TableCell>
                        ))}
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          {notaDisplay(promedio)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      {!materiaId && (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3, boxShadow: 1 }}>
          <Typography color="text.secondary">Selecciona una materia para ver el centro de notas.</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Escala de notas: 0 – 100 · Aprobado: ≥ 51
          </Typography>
        </Card>
      )}
    </Box>
  );
}
