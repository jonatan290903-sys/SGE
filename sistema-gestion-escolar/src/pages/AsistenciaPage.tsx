import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CircularProgress, MenuItem, TextField,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Chip, Alert, Tabs, Tab, Paper, Button,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { courseService } from '../services/courseService';
import { studentService } from '../services/studentService';
import {
  Materia, ResumenAsistencia, Asistencia, Estudiante, Curso,
  HorarioCurso, EstadoAsistencia,
} from '../types';

const today = new Date().toISOString().split('T')[0];

const DIAS_MAP: Record<number, string> = {
  1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes',
};

const DIA_DISPLAY: Record<string, string> = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes',
};

const COL_COLORS = ['#1565c0', '#e65100', '#1b5e20', '#880e4f', '#4a148c', '#006064', '#bf360c'];

const ESTADO_COLORS: Record<EstadoAsistencia, string> = {
  P: '#4caf50', F: '#f44336', L: '#2196f3',
};

function getDayOfWeek(dateStr: string): string | null {
  const [y, m, d] = dateStr.split('-').map(Number);
  return DIAS_MAP[new Date(y, m - 1, d).getDay()] ?? null;
}

function getMateriasForDay(
  horario: HorarioCurso,
  dia: string,
): { id: number; nombre: string }[] {
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

// ── Tab 1: Vista del día ──────────────────────────────────────────────────────

function TabDiaria({ cursos }: { cursos: Curso[] }) {
  const [cursoId, setCursoId] = useState('');
  const [fecha, setFecha] = useState(today);
  const [loading, setLoading] = useState(false);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [materiasDelDia, setMateriasDelDia] = useState<{ id: number; nombre: string }[]>([]);
  // asistencia[estudianteId][materiaId] = estado
  const [asistencia, setAsistencia] = useState<Record<number, Record<number, EstadoAsistencia | null>>>({});

  useEffect(() => {
    if (!cursoId || !fecha) return;
    const dia = getDayOfWeek(fecha);
    if (!dia) {
      setMateriasDelDia([]);
      setEstudiantes([]);
      setAsistencia({});
      return;
    }
    setLoading(true);
    Promise.all([
      courseService.getHorario(Number(cursoId)),
      studentService.getEstudiantes({ curso: Number(cursoId), estado: 'activo' }),
    ]).then(async ([horario, res]) => {
      const mats = getMateriasForDay(horario, dia);
      setMateriasDelDia(mats);
      const ests = res.results;
      setEstudiantes(ests);

      if (mats.length === 0) {
        setAsistencia({});
        setLoading(false);
        return;
      }

      // Optimized: Fetch all attendance records for the course in a single batch call
      const allAsistencias = await courseService.getAsistenciaCursoDia(Number(cursoId), fecha);

      const map: Record<number, Record<number, EstadoAsistencia | null>> = {};
      ests.forEach(e => { map[e.id] = {}; });

      allAsistencias.forEach((a: Asistencia) => {
        if (map[a.estudiante]) {
          map[a.estudiante][a.materia] = a.estado;
        }
      });
      setAsistencia(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [cursoId, fecha]);

  const dia = getDayOfWeek(fecha);
  const isWeekend = fecha !== '' && dia === null;

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <TextField
          select label="Curso" value={cursoId}
          onChange={e => setCursoId(e.target.value)} sx={{ minWidth: 240 }}
        >
          <MenuItem value=""><em>— Selecciona un curso —</em></MenuItem>
          {cursos.map(c => (
            <MenuItem key={c.id} value={String(c.id)}>{c.nombre}{c.periodo ? ` — ${c.periodo}` : ''}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Fecha" type="date" value={fecha}
          onChange={e => setFecha(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: 160 }}
        />
      </Box>

      {isWeekend && (
        <Alert severity="info">El día seleccionado es fin de semana, no hay clases programadas.</Alert>
      )}

      {!cursoId && !isWeekend && (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3, boxShadow: 1 }}>
          <Typography color="text.secondary">
            Selecciona un curso y una fecha para ver la asistencia del día.
          </Typography>
        </Card>
      )}

      {cursoId && !isWeekend && loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
      )}

      {cursoId && !isWeekend && !loading && materiasDelDia.length === 0 && (
        <Alert severity="info">
          No hay materias programadas para este día en el horario del curso.
          Configura el horario desde la sección <b>Horario</b>.
        </Alert>
      )}

      {cursoId && !isWeekend && !loading && materiasDelDia.length > 0 && (
        <Box sx={{ overflowX: 'auto' }}>
          <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <Table size="small" sx={{ borderCollapse: 'collapse' }}>
              <TableHead>
                {/* Merged day header */}
                <TableRow>
                  <TableCell
                    colSpan={materiasDelDia.length + 1}
                    align="center"
                    sx={{ bgcolor: '#f5f5f5', fontWeight: 700, fontSize: '0.95rem', py: 1.5, borderBottom: '2px solid #e0e0e0' }}
                  >
                    {dia ? DIA_DISPLAY[dia] : ''} — {fecha}
                  </TableCell>
                </TableRow>
                {/* Column headers */}
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
                      key={m.id}
                      align="center"
                      sx={{
                        fontWeight: 700, minWidth: 130, fontSize: '0.82rem',
                        color: COL_COLORS[idx % COL_COLORS.length],
                        borderRight: '1px solid #e0e0e0',
                      }}
                    >
                      {m.nombre}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {estudiantes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={materiasDelDia.length + 1} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No hay estudiantes activos en este curso.
                    </TableCell>
                  </TableRow>
                )}
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
                    {materiasDelDia.map((m, idx) => {
                      const estado = asistencia[e.id]?.[m.id] ?? null;
                      return (
                        <TableCell key={m.id} align="center" sx={{ borderRight: '1px solid #f0f0f0' }}>
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
    </Box>
  );
}

// ── Tab 2: Resumen por materia ─────────────────────────────────────────────────

function TabResumen() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [materiaId, setMateriaId] = useState('');
  const [resumen, setResumen] = useState<ResumenAsistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [exportInicio, setExportInicio] = useState('');
  const [exportFin, setExportFin] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    courseService.getMaterias().then(setMaterias).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!materiaId) { setResumen([]); return; }
    setLoadingResumen(true);
    courseService.getResumenAsistencia(Number(materiaId))
      .then(setResumen).catch(() => setResumen([]))
      .finally(() => setLoadingResumen(false));
  }, [materiaId]);

  const handleExport = async () => {
    if (!materiaId) return;
    setExporting(true);
    try {
      await courseService.exportarAsistencia(Number(materiaId), {
        ...(exportInicio ? { fecha_inicio: exportInicio } : {}),
        ...(exportFin ? { fecha_fin: exportFin } : {}),
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <TextField
        select label="Seleccionar materia" value={materiaId}
        onChange={e => setMateriaId(e.target.value)} sx={{ minWidth: 300, mb: 3 }}
      >
        <MenuItem value=""><em>— Selecciona una materia —</em></MenuItem>
        {materias.map(m => <MenuItem key={m.id} value={String(m.id)}>{m.nombre} ({m.codigo})</MenuItem>)}
      </TextField>

      {materiaId && (
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
            onClick={handleExport} disabled={exporting} color="success"
          >
            {exporting ? 'Generando...' : 'Descargar'}
          </Button>
        </Paper>
      )}

      {materiaId && (
        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
          {loadingResumen ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={28} /></Box>
          ) : resumen.length === 0 ? (
            <Box sx={{ p: 4 }}>
              <Alert severity="info">No hay registros de asistencia para esta materia.</Alert>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><b>Estudiante</b></TableCell>
                    <TableCell align="center"><b>Presentes</b></TableCell>
                    <TableCell align="center"><b>Faltas</b></TableCell>
                    <TableCell align="center"><b>Licencias</b></TableCell>
                    <TableCell align="center"><b>Total</b></TableCell>
                    <TableCell align="center"><b>% Asistencia</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resumen.map(r => {
                    const total = r.presentes + r.faltas + r.licencias;
                    const pct = total > 0 ? Math.round((r.presentes / total) * 100) : 0;
                    return (
                      <TableRow key={r.estudiante_id} hover>
                        <TableCell>{r.nombre}</TableCell>
                        <TableCell align="center">
                          <Chip label={r.presentes} color="success" size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={r.faltas} color={r.faltas > 0 ? 'error' : 'default'} size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={r.licencias} color={r.licencias > 0 ? 'info' : 'default'} size="small" />
                        </TableCell>
                        <TableCell align="center">{total}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${pct}%`}
                            color={pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'error'}
                            size="small"
                          />
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
          <Typography color="text.secondary">Selecciona una materia para ver el resumen de asistencia.</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            El registro de asistencia diaria lo realiza el docente desde su portal de materias.
          </Typography>
        </Card>
      )}
    </Box>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

export default function AsistenciaPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loadingCursos, setLoadingCursos] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    studentService.getCursos().then(setCursos).catch(() => {}).finally(() => setLoadingCursos(false));
  }, []);

  if (loadingCursos) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Asistencia</Typography>
      <Paper sx={{ borderRadius: 3, boxShadow: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Vista del Día" />
          <Tab label="Resumen por Materia" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {tab === 0 && <TabDiaria cursos={cursos} />}
          {tab === 1 && <TabResumen />}
        </Box>
      </Paper>
    </Box>
  );
}
