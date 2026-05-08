import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, IconButton, Avatar,
  Divider, Tooltip, Menu, MenuItem, useTheme, useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import BookIcon from '@mui/icons-material/Book';
import GradeIcon from '@mui/icons-material/Grade';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PaymentIcon from '@mui/icons-material/Payment';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import DateRangeIcon from '@mui/icons-material/DateRange';
import Select from '@mui/material/Select';
import Chip from '@mui/material/Chip';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';

const DRAWER_WIDTH = 240;

type Role = 'estudiante' | 'docente' | 'padre' | 'administrativo' | 'directivo';

const NAV_ITEMS: { label: string; icon: React.ReactElement; path: string; roles?: Role[] }[] = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/', roles: ['administrativo', 'directivo'] },
  { label: 'Mis Cursos', icon: <BookIcon />, path: '/docente', roles: ['docente'] },
  { label: 'Mi Portal', icon: <BookIcon />, path: '/estudiante', roles: ['estudiante'] },
  { label: 'Estudiantes', icon: <PeopleIcon />, path: '/estudiantes', roles: ['administrativo', 'directivo'] },
  { label: 'Inscripciones', icon: <AssignmentIndIcon />, path: '/inscripciones', roles: ['administrativo'] },
  { label: 'Docentes', icon: <SchoolIcon />, path: '/docentes', roles: ['administrativo', 'directivo'] },
  { label: 'Materias', icon: <BookIcon />, path: '/cursos', roles: ['administrativo', 'directivo'] },
  { label: 'Horario', icon: <CalendarMonthIcon />, path: '/horario', roles: ['administrativo', 'directivo'] },
  { label: 'Calificaciones', icon: <GradeIcon />, path: '/calificaciones', roles: ['administrativo', 'directivo'] },
  { label: 'Asistencia', icon: <EventAvailableIcon />, path: '/asistencia', roles: ['administrativo', 'directivo'] },
  { label: 'Pagos', icon: <PaymentIcon />, path: '/pagos', roles: ['administrativo', 'directivo'] },
  { label: 'Año Académico', icon: <DateRangeIcon />, path: '/anio-academico', roles: ['directivo'] },
  { label: 'Mi Perfil', icon: <PersonIcon />, path: '/perfil' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { anios, anioActivo, trimestreActual, periodoVisor, setPeriodoVisor } = useConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isAdmin = user?.role === 'directivo' || user?.role === 'administrativo';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, background: 'linear-gradient(135deg, #1976d2, #1565c0)', color: 'white' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>SGE</Typography>
        <Typography variant="caption">Sistema Gestión Escolar</Typography>
        {isAdmin && anioActivo && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 0.5 }}>Año Escolar</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Select
                native size="small"
                value={periodoVisor || anioActivo?.nombre || ''}
                onChange={e => setPeriodoVisor(e.target.value === anioActivo?.nombre ? null : e.target.value)}
                sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 13,
                  '& .MuiNativeSelect-select': { py: 0.5, color: 'white' },
                  '& .MuiNativeSelect-icon': { color: 'white' },
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                }}
              >
                {(anios || []).map(a => <option key={a.id} value={a.nombre} style={{ color: '#333' }}>{a.nombre}</option>)}
              </Select>
              <Chip label={trimestreActual} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 700, fontSize: 11 }} />
            </Box>
          </Box>
        )}
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user?.role as Role)).map(({ label, icon, path }) => {
          const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
          return (
            <ListItem key={path} disablePadding>
              <ListItemButton
                onClick={() => { navigate(path); if (isMobile) setMobileOpen(false); }}
                selected={active}
                sx={{
                  mx: 1, borderRadius: 2, mb: 0.5,
                  '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '& .MuiListItemIcon-root': { color: 'white' } },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
                <ListItemText
                  primary={label}
                  slotProps={{ primary: { style: { fontSize: 14 } } }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{user?.first_name} {user?.last_name}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{user?.role}</Typography>
          </Box>
          <Tooltip title="Cerrar sesión">
            <IconButton size="small" onClick={handleLogout}><LogoutIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1, display: { md: 'none' } }}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>SGE</Typography>
          <Box sx={{ flex: 1 }} />
          <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}>
              {user?.first_name?.[0]}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => { navigate('/perfil'); setAnchorEl(null); }}>
              <PersonIcon fontSize="small" sx={{ mr: 1 }} /> Mi Perfil
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Cerrar sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none', boxShadow: 2 },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: { xs: 8, md: 0 }, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
