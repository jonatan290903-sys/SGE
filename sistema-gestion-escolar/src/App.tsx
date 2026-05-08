import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

// Wrapper to handle ChunkLoadErrors
const lazyRetry = (importFn: () => Promise<any>) => {
  return lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      // If a chunk load fails, it's likely a new deployment happened.
      // We force a page reload to get the latest bundle.
      window.location.reload();
      return { default: () => null };
    }
  });
};

// Lazy load pages
const LoginPage = lazyRetry(() => import('./pages/LoginPage'));
const ForceChangePasswordPage = lazyRetry(() => import('./pages/ForceChangePasswordPage'));
const DashboardPage = lazyRetry(() => import('./pages/DashboardPage'));
const EstudiantesPage = lazyRetry(() => import('./pages/EstudiantesPage'));
const DocentesPage = lazyRetry(() => import('./pages/DocentesPage'));
const CursosPage = lazyRetry(() => import('./pages/CursosPage'));
const CalificacionesPage = lazyRetry(() => import('./pages/CalificacionesPage'));
const AsistenciaPage = lazyRetry(() => import('./pages/AsistenciaPage'));
const PagosPage = lazyRetry(() => import('./pages/PagosPage'));
const InscripcionesPage = lazyRetry(() => import('./pages/InscripcionesPage'));
const HorarioPage = lazyRetry(() => import('./pages/HorarioPage'));
const TeacherDashboard = lazyRetry(() => import('./pages/teacher/TeacherDashboard'));
const TeacherCoursePage = lazyRetry(() => import('./pages/teacher/TeacherCoursePage'));
const StudentPortalPage = lazyRetry(() => import('./pages/student/StudentPortalPage'));
const ProfilePage = lazyRetry(() => import('./pages/ProfilePage'));
const AnioAcademicoPage = lazyRetry(() => import('./pages/AnioAcademicoPage'));

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

/**
 * Wrapper that forces users with must_change_password to the password change page.
 * Any authenticated route goes through this check first.
 */
function RequirePasswordChanged({ children }: { children: React.ReactNode }) {
  const { mustChangePassword } = useAuth();
  if (mustChangePassword) {
    return <Navigate to="/cambiar-contrasena" replace />;
  }
  return <>{children}</>;
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

                {/* Force change password route - accessible only when authenticated */}
                <Route path="/cambiar-contrasena" element={
                  <PrivateRoute><ForceChangePasswordPage /></PrivateRoute>
                } />

                {/* Shared layout for all authenticated users */}
                <Route path="/" element={
                  <PrivateRoute>
                    <RequirePasswordChanged>
                      <Layout />
                    </RequirePasswordChanged>
                  </PrivateRoute>
                }>
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
