import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, InputAdornment, IconButton, CircularProgress, Stack,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockResetIcon from '@mui/icons-material/LockReset';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

export default function ForceChangePasswordPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    old_password: '',
    new_password: '',
    new_password2: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.new_password.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (form.new_password !== form.new_password2) {
      setError('Las nuevas contraseñas no coinciden.');
      return;
    }
    if (form.old_password === form.new_password) {
      setError('La nueva contraseña debe ser diferente a la actual.');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword({
        old_password: form.old_password,
        new_password: form.new_password,
        new_password2: form.new_password2,
      });

      // Update the user object to reflect the password has been changed
      if (user) {
        const updatedUser = { ...user, must_change_password: false };
        updateUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.old_password || err.response?.data?.new_password || 'Error al cambiar la contraseña.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e65100 0%, #f57c00 50%, #ff9800 100%)',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 480, width: '100%', borderRadius: 3, boxShadow: 10 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 64, height: 64, borderRadius: '50%',
                bgcolor: 'warning.main', display: 'flex', alignItems: 'center',
                justifyContent: 'center', mb: 2,
              }}
            >
              <LockResetIcon sx={{ color: 'white', fontSize: 36 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }} color="warning.dark">
              Cambio de Contraseña Requerido
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              Por seguridad, debes cambiar tu contraseña temporal antes de continuar.
              Tu contraseña actual es tu número de documento.
            </Typography>
          </Box>

          <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 3, borderRadius: 2 }}>
            Esta acción es obligatoria. No podrás acceder al sistema hasta que cambies tu contraseña.
          </Alert>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Contraseña Actual (tu documento)"
                type={showOldPass ? 'text' : 'password'}
                value={form.old_password}
                onChange={(e) => setForm({ ...form, old_password: e.target.value })}
                required
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowOldPass(!showOldPass)}
                          edge="end"
                          aria-label={showOldPass ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                        >
                          {showOldPass ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label="Nueva Contraseña"
                type={showNewPass ? 'text' : 'password'}
                value={form.new_password}
                onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                required
                fullWidth
                helperText="Mínimo 8 caracteres"
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowNewPass(!showNewPass)}
                          edge="end"
                          aria-label={showNewPass ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                        >
                          {showNewPass ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label="Confirmar Nueva Contraseña"
                type={showNewPass ? 'text' : 'password'}
                value={form.new_password2}
                onChange={(e) => setForm({ ...form, new_password2: e.target.value })}
                required
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowNewPass(!showNewPass)}
                          edge="end"
                          aria-label={showNewPass ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                        >
                          {showNewPass ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                color="warning"
                sx={{ mt: 1, py: 1.5, borderRadius: 2, fontWeight: 700 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Cambiar Contraseña y Continuar'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
