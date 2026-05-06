import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

// Lazy load pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const EstudiantesPage = lazy(() => import('./pages/EstudiantesPage'));
const DocentesPage = lazy(() => import('./pages/DocentesPage'));
const CursosPage = lazy(() => import('./pages/CursosPage'));
const CalificacionesPage = lazy(() => import('./pages/CalificacionesPage'));
const AsistenciaPage = lazy(() => import('./pages/AsistenciaPage'));
const PagosPage = lazy(() => import('./pages/PagosPage'));
const InscripcionesPage = lazy(() => import('./pages/InscripcionesPage'));
const HorarioPage = lazy(() => import('./pages/HorarioPage'));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const TeacherCoursePage = lazy(() => import('./pages/teacher/TeacherCoursePage'));
const StudentPortalPage = lazy(() => import('./pages/student/StudentPortalPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AnioAcademicoPage = lazy(() => import('./pages/AnioAcademicoPage'));

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
    background: { default: '#f5f5f5' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiCard: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
});

function Loading() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'docente') return <Navigate to="/docente" replace />;
  if (user.role === 'estudiante') return <Navigate to="/estudiante" replace />;
  return <DashboardPage />;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ConfigProvider>
          <BrowserRouter>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />

                {/* Shared layout for all authenticated users */}
                <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                  <Route index element={<RoleRedirect />} />

                  {/* Admin / Directivo routes */}
                  <Route path="estudiantes" element={<EstudiantesPage />} />
                  <Route path="docentes" element={<DocentesPage />} />
                  <Route path="cursos" element={<CursosPage />} />
                  <Route path="calificaciones" element={<CalificacionesPage />} />
                  <Route path="asistencia" element={<AsistenciaPage />} />
                  <Route path="pagos" element={<PagosPage />} />
                  <Route path="inscripciones" element={<InscripcionesPage />} />
                  <Route path="horario" element={<HorarioPage />} />
                  <Route path="anio-academico" element={<AnioAcademicoPage />} />

                  {/* Teacher routes */}
                  <Route path="docente" element={<TeacherDashboard />} />
                  <Route path="docente/cursos/:id" element={<TeacherCoursePage />} />

                  {/* Student routes */}
                  <Route path="estudiante" element={<StudentPortalPage />} />

                  {/* Profile route */}
                  <Route path="perfil" element={<ProfilePage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ConfigProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
