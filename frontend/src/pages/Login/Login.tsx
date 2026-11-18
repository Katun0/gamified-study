import { useState, type FormEvent } from 'react';
import { Alert, Box, Button, CircularProgress, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { ArrowBackRounded, CodeRounded, EmailOutlined, LockOutlined, VisibilityOffOutlined, VisibilityOutlined, AutoAwesomeRounded } from '@mui/icons-material';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { colors } from '../../theme/colors';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, loading: checkingSession } = useAuth();
  const successMessage = (location.state as { message?: string } | null)?.message;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setLoading(true);
    try { await login(email, password); navigate('/trails', { replace: true }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Erro ao conectar com o servidor.'); }
    finally { setLoading(false); }
  };
  if (checkingSession) return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  if (user) return <Navigate to="/trails" replace />;
  return <Box sx={{ minHeight: '100vh', bgcolor: colors.background, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
    <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'space-between', p: 7, background: 'radial-gradient(circle at 80% 20%, #4C2C86, transparent 55%), #1A1531', borderRight: '1px solid #49376E' }}>
      <Stack direction="row" alignItems="center" spacing={1.5}><Box sx={{ bgcolor: colors.primary, borderRadius: 3, p: 1, display: 'grid', placeItems: 'center' }}><CodeRounded /></Box><Typography sx={{ fontSize: 25, fontWeight: 900 }}>Study<Box component="span" sx={{ color: colors.secondary }}>Quest</Box></Typography></Stack>
      <Box><AutoAwesomeRounded sx={{ color: colors.secondary, fontSize: 60, mb: 2 }} /><Typography sx={{ fontSize: 'clamp(2.8rem, 4vw, 4.7rem)', lineHeight: 1.08, letterSpacing: '-.06em', fontWeight: 900 }}>A aventura continua de onde você parou.</Typography><Typography sx={{ mt: 3, color: '#C8BEDC', fontSize: 18, lineHeight: 1.7 }}>Entre na sua conta e dê o próximo passo na sua jornada de programação.</Typography></Box>
      <Typography sx={{ color: '#9C90B9', fontSize: 13 }}>StudyQuest · Aprenda. Pratique. Evolua.</Typography>
    </Box>
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', p: { xs: 2.5, sm: 5, md: 7 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center"><Button startIcon={<ArrowBackRounded />} onClick={() => navigate('/')} sx={{ color: colors.textSecondary }}>Início</Button><Button variant="outlined" onClick={() => navigate('/register')} sx={{ borderColor: colors.border, color: colors.secondary }}>Criar conta</Button></Stack>
      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 440, m: 'auto', py: 6 }}>
        <Box sx={{ display: { md: 'none' }, mb: 5 }}><Typography sx={{ fontSize: 29, fontWeight: 900 }}>Study<Box component="span" sx={{ color: colors.secondary }}>Quest</Box></Typography></Box>
        <Typography component="h1" sx={{ fontSize: { xs: 34, sm: 43 }, fontWeight: 900, letterSpacing: '-.055em' }}>Bem-vindo de volta!</Typography><Typography sx={{ color: colors.textSecondary, mt: 1, mb: 4 }}>Suas próximas conquistas estão esperando por você.</Typography>
        <Stack spacing={2.5}>
          {successMessage && <Alert severity="success">{successMessage}</Alert>}{error && <Alert severity="error" role="alert">{error}</Alert>}
          <TextField label="E-mail" type="email" name="email" autoComplete="email" required fullWidth value={email} onChange={e => setEmail(e.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailOutlined sx={{ color: colors.textSecondary }} /></InputAdornment> } }} />
          <TextField label="Senha" type={showPassword ? 'text' : 'password'} name="password" autoComplete="current-password" required fullWidth value={password} onChange={e => setPassword(e.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockOutlined sx={{ color: colors.textSecondary }} /></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOffOutlined /> : <VisibilityOutlined />}</IconButton></InputAdornment> } }} />
          <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ minHeight: 56 }}>{loading ? 'Entrando...' : 'Entrar na minha conta'}</Button>
          <Typography sx={{ textAlign: 'center', color: colors.textSecondary, fontSize: 14 }}>Ainda não tem uma conta? <Box component="a" href="/register" sx={{ color: colors.secondary, fontWeight: 800, textDecoration: 'none' }}>Comece sua aventura</Box></Typography>
        </Stack>
      </Box>
    </Box>
  </Box>;
}
