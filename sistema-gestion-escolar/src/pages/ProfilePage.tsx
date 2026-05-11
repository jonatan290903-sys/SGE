import React, { useState } from 'react';
import {
  Box, Typography, Card, TextField, Button, Avatar, Divider,
  Alert, Stack, CircularProgress, Grid, Paper, Tooltip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { InputAdornment, IconButton as MuiIconButton } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  
  // Profile Info State
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Password State
  const [passForm, setPassForm] = useState({
    old_password: '',
    new_password: '',
    new_password2: '',
  });
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const updatedUser = await authService.updateProfile(profileForm);
      updateUser(updatedUser);
      setProfileMsg({ type: 'success', text: 'Perfil actualizado correctamente.' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: 'Error al actualizar el perfil.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.new_password !== passForm.new_password2) {
      setPassMsg({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
      return;
    }
    setPassLoading(true);
    setPassMsg(null);
    try {
      await authService.changePassword({
        old_password: passForm.old_password,
        new_password: passForm.new_password,
        new_password2: passForm.new_password2,
      });
      setPassMsg({ type: 'success', text: 'Contraseña cambiada con éxito.' });
      setPassForm({ old_password: '', new_password: '', new_password2: '' });
    } catch (err: any) {
      const errorMsg = err.response?.data?.old_password || 'Error al cambiar la contraseña.';
      setPassMsg({ type: 'error', text: errorMsg });
    } finally {
      setPassLoading(false);
    }
  };

  if (!user) return <CircularProgress />;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: 'primary.main' }}>
        Mi Perfil
      </Typography>

      <Grid container spacing={4}>
        {/* Profile Card */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ p: 4, borderRadius: 4, boxShadow: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <PersonIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Información Personal</Typography>
            </Box>
            
            {profileMsg && (
              <Alert severity={profileMsg.type} sx={{ mb: 3, borderRadius: 2 }}>
                {profileMsg.text}
              </Alert>
            )}

            <form onSubmit={handleProfileSubmit}>
              <Stack spacing={3}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      label="Nombre"
                      fullWidth
                      value={profileForm.first_name}
                      onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      label="Apellido"
                      fullWidth
                      value={profileForm.last_name}
                      onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })}
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="Correo Electrónico"
                  fullWidth
                  value={user.email}
                  disabled
                  helperText="El correo electrónico no se puede cambiar."
                />

                <TextField
                  label="Teléfono"
                  fullWidth
                  value={profileForm.phone}
                  onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                />

                <TextField
                  label="Dirección"
                  fullWidth
                  multiline
                  rows={2}
                  value={profileForm.address}
                  onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                />

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={profileLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={profileLoading}
                  sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                >
                  {profileLoading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </Stack>
            </form>
          </Card>
        </Grid>

        {/* Sidebar / Password Card */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={4}>
            {/* User Overview */}
            <Paper sx={{ p: 3, borderRadius: 4, textAlign: 'center', bgcolor: 'primary.dark', color: 'white' }}>
              <Avatar
                sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'secondary.main', fontSize: 32 }}
              >
                {user.first_name?.[0]}{user.last_name?.[0]}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{user.first_name} {user.last_name}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, textTransform: 'capitalize' }}>
                {user.role}
              </Typography>
            </Paper>

            {/* Change Password Card */}
            <Card sx={{ p: 4, borderRadius: 4, boxShadow: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <LockIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Seguridad</Typography>
              </Box>

              {passMsg && (
                <Alert severity={passMsg.type} sx={{ mb: 3, borderRadius: 2 }}>
                  {passMsg.text}
                </Alert>
              )}

              <form onSubmit={handlePasswordSubmit}>
                <Stack spacing={3}>
                  <TextField
                    label="Contraseña Actual"
                    type={showOldPass ? 'text' : 'password'}
                    fullWidth
                    required
                    value={passForm.old_password}
                    onChange={e => setPassForm({ ...passForm, old_password: e.target.value })}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title={showOldPass ? "Ocultar contraseña" : "Mostrar contraseña"}>
                              <MuiIconButton
                                onClick={() => setShowOldPass(!showOldPass)}
                                edge="end"
                                aria-label={showOldPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                              >
                                {showOldPass ? <VisibilityOff /> : <Visibility />}
                              </MuiIconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }
                    }}
                  />
                  <Divider sx={{ my: 1 }}>Nueva Contraseña</Divider>
                  <TextField
                    label="Nueva Contraseña"
                    type={showNewPass ? 'text' : 'password'}
                    fullWidth
                    required
                    value={passForm.new_password}
                    onChange={e => setPassForm({ ...passForm, new_password: e.target.value })}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title={showNewPass ? "Ocultar contraseña" : "Mostrar contraseña"}>
                              <MuiIconButton
                                onClick={() => setShowNewPass(!showNewPass)}
                                edge="end"
                                aria-label={showNewPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                              >
                                {showNewPass ? <VisibilityOff /> : <Visibility />}
                              </MuiIconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }
                    }}
                  />
                  <TextField
                    label="Confirmar Nueva Contraseña"
                    type={showNewPass ? 'text' : 'password'}
                    fullWidth
                    required
                    value={passForm.new_password2}
                    onChange={e => setPassForm({ ...passForm, new_password2: e.target.value })}
                  />
                  <Button
                    type="submit"
                    variant="outlined"
                    color="primary"
                    disabled={passLoading}
                    sx={{ py: 1, borderRadius: 2, fontWeight: 700 }}
                  >
                    {passLoading ? 'Procesando...' : 'Cambiar Contraseña'}
                  </Button>
                </Stack>
              </form>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
