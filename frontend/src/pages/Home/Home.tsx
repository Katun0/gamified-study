import { Box, Button, Container, Stack, Typography, Chip } from '@mui/material';
import { ArrowForwardRounded, AutoAwesomeRounded, BoltRounded, CodeRounded, EmojiEventsRounded, LocalFireDepartmentRounded, MenuBookRounded, PlayArrowRounded, RocketLaunchRounded, TerminalRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { colors } from '../../theme/colors';

const languages = [
  { name: 'Python', glyph: 'Py', color: '#3776AB', detail: 'Lógica e automação' },
  { name: 'JavaScript', glyph: 'JS', color: '#F7DF1E', detail: 'Web e interatividade' },
  { name: 'PHP', glyph: 'PHP', color: '#777BB4', detail: 'Aplicações e APIs' },
  { name: 'Portugol', glyph: '</>', color: '#A78BFA', detail: 'Primeiros algoritmos' },
];

const benefits = [
  { icon: <RocketLaunchRounded />, title: 'Missões que evoluem', body: 'Aprenda um conceito por vez e avance por trilhas organizadas.' },
  { icon: <TerminalRounded />, title: 'Prática de verdade', body: 'Escreva código, execute desafios e receba feedback.' },
  { icon: <EmojiEventsRounded />, title: 'Cada conquista conta', body: 'Transforme seus estudos em uma jornada que dá vontade de continuar.' },
];

export default function Home() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const go = () => navigate(user ? '/trails' : '/register');
  return (
    <Box sx={{ bgcolor: colors.background, minHeight: '100vh', color: colors.text, overflowX: 'clip' }}>
      <Box component="header" sx={{ borderBottom: `1px solid ${colors.border}`, bgcolor: '#0D1425' }}>
        <Container maxWidth="lg" sx={{ minHeight: 78, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Stack direction="row" spacing={1.2} alignItems="center" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>
            <Box sx={{ width: 41, height: 41, borderRadius: '13px', bgcolor: colors.primary, display: 'grid', placeItems: 'center', boxShadow: '0 4px 0 #5322B4' }}><CodeRounded /></Box>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: 20, sm: 24 }, letterSpacing: '-.06em' }}>Study<Box component="span" sx={{ color: colors.secondary }}>Quest</Box></Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            {user?.roles.includes('ROLE_ADMIN') && <Button sx={{ display: { xs: 'none', md: 'inline-flex' } }} onClick={() => navigate('/courses/new')}>Painel de criação</Button>}
            {user ? <><Button variant="contained" onClick={() => navigate('/trails')}>Minha trilha</Button><Button onClick={logout} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>Sair</Button></> : !loading && <><Button onClick={() => navigate('/login')} sx={{ color: colors.text }}>Entrar</Button><Button variant="contained" onClick={() => navigate('/register')}>Começar grátis</Button></>}
          </Stack>
        </Container>
      </Box>
      <Box component="main">
        <Box component="section" sx={{ position: 'relative', isolation: 'isolate', background: 'radial-gradient(ellipse at 80% 20%, #33205D 0%, transparent 44%), radial-gradient(ellipse at 15% 75%, #143C45 0%, transparent 40%), #0B1020' }}>
          <Container maxWidth="lg" sx={{ py: { xs: 9, md: 13 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr .9fr' }, alignItems: 'center', gap: { xs: 7, md: 4 } }}>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Chip icon={<AutoAwesomeRounded />} label="SUA PRÓXIMA AVENTURA COMEÇA AQUI" sx={{ mb: 3, bgcolor: '#2B2350', color: '#D5C6FF', border: '1px solid #58458E', fontWeight: 800, fontSize: 11, letterSpacing: '.04em', '& .MuiChip-icon': { color: colors.secondary } }} />
              <Typography component="h1" sx={{ fontWeight: 900, fontSize: { xs: 'clamp(2.7rem, 9vw, 4rem)', md: 'clamp(3.6rem, 5vw, 5.3rem)' }, letterSpacing: '-.065em', lineHeight: 1.07, maxWidth: 700 }}>Seu código.<br />Sua jornada.<br /><Box component="span" sx={{ color: colors.secondary }}>Sua conquista.</Box></Typography>
              <Typography sx={{ mt: 3, color: colors.textSecondary, fontSize: { xs: 16, md: 18 }, lineHeight: 1.8, maxWidth: 540 }}>Aprenda programação com lições práticas, desafios e uma trilha que transforma cada pequeno progresso em uma grande vitória.</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4, alignItems: { xs: 'stretch', sm: 'center' } }}>
                <Button size="large" variant="contained" onClick={go} endIcon={<ArrowForwardRounded />} sx={{ minHeight: 58, px: 4 }}>{user ? 'Continuar aventura' : 'Começar minha jornada'}</Button>
                <Button size="large" variant="outlined" onClick={() => document.getElementById('linguagens')?.scrollIntoView({ behavior: 'smooth' })} startIcon={<PlayArrowRounded />} sx={{ minHeight: 58, color: colors.text, borderColor: colors.border }}>Explorar linguagens</Button>
              </Stack>
              <Stack direction="row" spacing={{ xs: 2, sm: 4 }} sx={{ mt: 6 }}><Box><Typography sx={{ fontSize: 24, fontWeight: 900 }}>01</Typography><Typography sx={{ color: colors.textSecondary, fontSize: 12 }}>Escolha uma trilha</Typography></Box><Box><Typography sx={{ fontSize: 24, fontWeight: 900 }}>02</Typography><Typography sx={{ color: colors.textSecondary, fontSize: 12 }}>Resolva desafios</Typography></Box><Box><Typography sx={{ fontSize: 24, fontWeight: 900 }}>03</Typography><Typography sx={{ color: colors.textSecondary, fontSize: 12 }}>Evolua sempre</Typography></Box></Stack>
            </Box>
            <Box sx={{ position: 'relative', width: '100%', maxWidth: 470, mx: 'auto', transform: { md: 'rotate(2deg)' } }}>
              <Box sx={{ position: 'absolute', inset: -18, border: '1px dashed #66558B', borderRadius: 8, opacity: .55 }} />
              <Box sx={{ position: 'relative', borderRadius: '28px', overflow: 'hidden', border: '1px solid #485176', boxShadow: '0 32px 90px #0008', bgcolor: '#151C31' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}` }}><Stack direction="row" spacing={.8}><Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#FB7185' }} /><Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#FBBF24' }} /><Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#A3E635' }} /></Stack><Typography sx={{ color: colors.textSecondary, fontSize: 12, fontWeight: 700 }}>minha-primeira-missao.py</Typography><BoltRounded sx={{ color: colors.secondary }} /></Stack>
                <Box sx={{ p: { xs: 2.5, sm: 4 } }}><Typography sx={{ color: '#A3E635', fontWeight: 800, fontSize: 12, letterSpacing: 2, mb: 2 }}>MISSÃO 01 · INICIANTE</Typography><Typography sx={{ fontSize: 24, fontWeight: 900, mb: 1 }}>Olá, aventureiro! 👋</Typography><Typography sx={{ color: colors.textSecondary, fontSize: 14, mb: 3 }}>Toda grande jornada começa com uma linha de código.</Typography><Box component="pre" sx={{ m: 0, p: 2.5, borderRadius: 3, bgcolor: '#0A1120', border: '1px solid #29354D', color: '#D8E7F8', fontFamily: 'ui-monospace, Consolas, monospace', fontSize: { xs: 12, sm: 14 }, lineHeight: 2, overflowX: 'auto' }}><Box component="span" sx={{ color: '#8B5CF6' }}>mensagem</Box> = <Box component="span" sx={{ color: '#A3E635' }}>'Olá, StudyQuest!'</Box>{'\n'}<Box component="span" sx={{ color: '#60A5FA' }}>print</Box>(mensagem)</Box><Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 3, p: 2, bgcolor: '#27333D', borderRadius: 3 }}><Stack direction="row" spacing={1} alignItems="center"><EmojiEventsRounded sx={{ color: '#FBBF24' }} /><Typography sx={{ fontWeight: 800, fontSize: 13 }}>Missão concluída!</Typography></Stack><Typography sx={{ color: colors.secondary, fontWeight: 900 }}>+50 XP</Typography></Stack></Box>
              </Box>
              <Box sx={{ position: 'absolute', right: -12, top: -22, bgcolor: '#2D2253', border: '1px solid #7154B4', borderRadius: 3, px: 2, py: 1.2, transform: 'rotate(8deg)', boxShadow: '0 12px 30px #0005' }}><LocalFireDepartmentRounded sx={{ color: '#FBBF24', verticalAlign: 'middle' }} /> <Typography component="span" sx={{ fontWeight: 900 }}>Continue evoluindo!</Typography></Box>
            </Box>
          </Container>
        </Box>
        <Box component="section" id="linguagens" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#101729', scrollMarginTop: 24 }}>
          <Container maxWidth="lg"><Typography sx={{ color: colors.secondary, fontSize: 12, letterSpacing: 2, fontWeight: 900 }}>ESCOLHA SEU CAMINHO</Typography><Typography component="h2" sx={{ fontSize: { xs: 32, md: 44 }, fontWeight: 900, letterSpacing: '-.045em', mt: 1 }}>Toda linguagem abre um novo mundo.</Typography><Typography sx={{ color: colors.textSecondary, mt: 1, mb: 5, maxWidth: 610 }}>Explore as tecnologias disponíveis e descubra o que você pode construir.</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', md: 'repeat(4, minmax(0,1fr))' }, gap: 2 }}>
            {languages.map((language) => <Box key={language.name} onClick={go} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }} sx={{ cursor: 'pointer', p: { xs: 2, sm: 3 }, minHeight: 210, border: `1px solid ${colors.border}`, borderRadius: 4, bgcolor: colors.surface, transition: 'transform .2s, border-color .2s', '&:hover': { transform: 'translateY(-6px)', borderColor: colors.primary }, '&:focus-visible': { outline: `3px solid ${colors.secondary}` } }}><Box sx={{ width: 62, height: 62, borderRadius: 3, bgcolor: language.color, display: 'grid', placeItems: 'center', color: language.name === 'JavaScript' ? '#141414' : '#fff', fontWeight: 900, fontSize: language.name === 'PHP' ? 17 : 24, mb: 3 }}>{language.glyph}</Box><Typography sx={{ fontWeight: 900, fontSize: { xs: 17, sm: 20 } }}>{language.name}</Typography><Typography sx={{ color: colors.textSecondary, fontSize: 13, mt: 1 }}>{language.detail}</Typography></Box>)}
          </Box></Container>
        </Box>
        <Box component="section" sx={{ py: { xs: 8, md: 12 } }}><Container maxWidth="lg"><Typography sx={{ color: colors.secondary, fontWeight: 900, fontSize: 12, letterSpacing: 2 }}>APRENDER PODE SER UMA AVENTURA</Typography><Typography component="h2" sx={{ fontWeight: 900, fontSize: { xs: 32, md: 44 }, mt: 1, mb: 5 }}>Não é só estudar. É evoluir.</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>{benefits.map((b) => <Box key={b.title} sx={{ p: 3.5, border: `1px solid ${colors.border}`, bgcolor: colors.surface, borderRadius: 4 }}><Box sx={{ color: colors.secondary, mb: 2, '& svg': { fontSize: 38 } }}>{b.icon}</Box><Typography sx={{ fontSize: 20, fontWeight: 900, mb: 1 }}>{b.title}</Typography><Typography sx={{ color: colors.textSecondary, lineHeight: 1.7 }}>{b.body}</Typography></Box>)}</Box></Container></Box>
        <Box sx={{ py: 8, bgcolor: '#21163F', borderTop: '1px solid #49347C', textAlign: 'center' }}><Container maxWidth="sm"><MenuBookRounded sx={{ color: colors.secondary, fontSize: 45 }} /><Typography component="h2" sx={{ fontSize: { xs: 30, sm: 42 }, fontWeight: 900, mt: 1 }}>Pronto para sua próxima missão?</Typography><Typography sx={{ color: '#D0C5E6', my: 3 }}>O próximo nível começa com o primeiro passo.</Typography><Button variant="contained" size="large" endIcon={<ArrowForwardRounded />} onClick={go}>{user ? 'Voltar à minha trilha' : 'Criar conta gratuita'}</Button></Container></Box>
      </Box>
      <Box component="footer" sx={{ py: 3, textAlign: 'center', borderTop: `1px solid ${colors.border}`, color: colors.textSecondary, fontSize: 12 }}>© {new Date().getFullYear()} StudyQuest · Uma aventura em cada linha de código.</Box>
    </Box>
  );
}
