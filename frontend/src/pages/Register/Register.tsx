import { useState, type FormEvent } from 'react';
import { Alert, Box, Button, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { ArrowBackRounded, AutoAwesomeRounded, CodeRounded, EmailOutlined, LockOutlined, PersonOutlineRounded, VisibilityOffOutlined, VisibilityOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../../lib/api';
import { colors } from '../../theme/colors';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/register`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ name: name.trim(), email: email.trim(), password }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Não foi possível criar sua conta.');
      navigate('/login', { state: { message: 'Conta criada com sucesso. Faça login para continuar.' } });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Erro ao conectar com o servidor.'); }
    finally { setLoading(false); }
  };
  return <Box sx={{ minHeight: '100vh', bgcolor: colors.background, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
    <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'space-between', p: 7, background: 'radial-gradient(circle at 80% 20%, #4C2C86, transparent 55%), #1A1531', borderRight: '1px solid #49376E' }}>
      <Stack direction="row" alignItems="center" spacing={1.5}><Box sx={{ bgcolor: colors.primary, borderRadius: 3, p: 1, display: 'grid', placeItems: 'center' }}><CodeRounded /></Box><Typography sx={{ fontSize: 25, fontWeight: 900 }}>Study<Box component="span" sx={{ color: colors.secondary }}>Quest</Box></Typography></Stack>
      <Box><AutoAwesomeRounded sx={{ color: colors.secondary, fontSize: 60, mb: 2 }} /><Typography sx={{ fontSize: 'clamp(2.8rem, 4vw, 4.7rem)', lineHeight: 1.08, letterSpacing: '-.06em', fontWeight: 900 }}>Todo grande dev começou com um primeiro passo.</Typography><Typography sx={{ mt: 3, color: '#C8BEDC', fontSize: 18, lineHeight: 1.7 }}>Crie sua conta, escolha sua trilha e transforme prática em progresso.</Typography></Box>
      <Typography sx={{ color: '#9C90B9', fontSize: 13 }}>StudyQuest · Aprenda. Pratique. Evolua.</Typography>
    </Box>
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', p: { xs: 2.5, sm: 5, md: 7 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center"><Button startIcon={<ArrowBackRounded />} onClick={() => navigate('/')} sx={{ color: colors.textSecondary }}>Início</Button><Button variant="outlined" onClick={() => navigate('/login')} sx={{ borderColor: colors.border, color: colors.secondary }}>Já tenho conta</Button></Stack>
      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 440, m: 'auto', py: 6 }}>
        <Box sx={{ display: { md: 'none' }, mb: 5 }}><Typography sx={{ fontSize: 29, fontWeight: 900 }}>Study<Box component="span" sx={{ color: colors.secondary }}>Quest</Box></Typography></Box>
        <Typography component="h1" sx={{ fontSize: { xs: 34, sm: 43 }, fontWeight: 900, letterSpacing: '-.055em' }}>Sua jornada começa aqui.</Typography><Typography sx={{ color: colors.textSecondary, mt: 1, mb: 4 }}>Crie sua conta gratuitamente e comece a explorar.</Typography>
        <Stack spacing={2.2}>
          {error && <Alert severity="error" role="alert">{error}</Alert>}
          <TextField label="Seu nome" name="name" autoComplete="name" required fullWidth value={name} onChange={e => setName(e.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonOutlineRounded sx={{ color: colors.textSecondary }} /></InputAdornment> } }} />
          <TextField label="E-mail" type="email" name="email" autoComplete="email" required fullWidth value={email} onChange={e => setEmail(e.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailOutlined sx={{ color: colors.textSecondary }} /></InputAdornment> } }} />
          <TextField label="Senha" type={showPassword ? 'text' : 'password'} name="password" autoComplete="new-password" required fullWidth value={password} onChange={e => setPassword(e.target.value)} slotProps={{ htmlInput: { minLength: 8 }, input: { startAdornment: <InputAdornment position="start"><LockOutlined sx={{ color: colors.textSecondary }} /></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOffOutlined /> : <VisibilityOutlined />}</IconButton></InputAdornment> } }} />
          <TextField label="Confirmar senha" type={showPassword ? 'text' : 'password'} name="confirmPassword" autoComplete="new-password" required fullWidth value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} slotProps={{ htmlInput: { minLength: 8 }, input: { startAdornment: <InputAdornment position="start"><LockOutlined sx={{ color: colors.textSecondary }} /></InputAdornment> } }} />
          <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ minHeight: 56 }}>{loading ? 'Criando conta...' : 'Criar minha conta'}</Button>
          <Typography sx={{ textAlign: 'center', color: colors.textSecondary, fontSize: 14 }}>Já tem conta? <Box component="a" href="/login" sx={{ color: colors.secondary, fontWeight: 800, textDecoration: 'none' }}>Entrar</Box></Typography>
        </Stack>
      </Box>
    </Box>
  </Box>;
}
