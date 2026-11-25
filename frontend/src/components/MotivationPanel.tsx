import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { EmojiEventsRounded, FlagRounded } from "@mui/icons-material";
import { apiRequest } from "../lib/api";

type Achievement = { code: string; title: string; description: string; kind: "module" | "milestone"; unlockedAt: string };
type Motivation = {
  daily: { date: string; timezone: string; goal: number; completed: number; achieved: boolean };
  achievements: Achievement[];
  stats: { solved: number; lessons: number; studyDays: number };
};

export default function MotivationPanel({ revision }: { revision: number }) {
  const [data, setData] = useState<Motivation | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [celebration, setCelebration] = useState<string[]>([]);
  const previous = useRef<Motivation | null>(null);
  const requestId = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const timer = window.setInterval(() => setRefresh((value) => value + 1), 60000);
    const wake = () => { if (document.visibilityState === "visible") setRefresh((value) => value + 1); };
    document.addEventListener("visibilitychange", wake);
    return () => { mounted.current = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", wake); };
  }, []);

  useEffect(() => {
    const request = ++requestId.current;
    apiRequest<Motivation>("/api/me/gamification").then((next) => {
      if (!mounted.current || request !== requestId.current) return;
      const before = previous.current;
      if (before) {
        const known = new Set(before.achievements.map((item) => item.code));
        const messages = next.achievements.filter((item) => !known.has(item.code)).map((item) => item.title);
        if (before.daily.date === next.daily.date && !before.daily.achieved && next.daily.achieved && before.daily.goal === next.daily.goal) messages.push("Meta diária concluída!");
        if (messages.length) setCelebration((items) => [...items, ...messages]);
      }
      previous.current = next;
      setData(next); setError("");
    }).catch((cause) => { if (mounted.current && request === requestId.current) setError(cause instanceof Error ? cause.message : "Não foi possível carregar suas conquistas."); });
  }, [revision, refresh]);

  async function changeGoal(goal: number) {
    if (saving) return;
    setSaving(true); setError("");
    const request = ++requestId.current;
    try {
      const next = await apiRequest<Motivation>("/api/me/daily-goal", { method: "PUT", body: JSON.stringify({ goal }) });
      if (mounted.current && request === requestId.current) { previous.current = next; setData(next); }
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : "Não foi possível salvar sua meta.");
    } finally {
      if (mounted.current) { setSaving(false); setRefresh((value) => value + 1); }
    }
  }

  return <Box component="section" aria-label="Metas e conquistas" sx={{ mb: 3, p: { xs: 2, sm: 3 }, border: "1px solid #334155", borderRadius: 3, background: "#111c2e" }}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
      <Typography component="h2" variant="h6" sx={{ display: "flex", gap: 1, alignItems: "center" }}><FlagRounded sx={{ color: "#a3e635" }} /> Sua meta de hoje</Typography>
      {data && <TextField select size="small" label="Meta diária" value={data.daily.goal} disabled={saving} onChange={(event) => changeGoal(Number(event.target.value))} sx={{ minWidth: 160 }}>
        {[1, 2, 3].map((goal) => <MenuItem key={goal} value={goal}>{goal} {goal === 1 ? "desafio" : "desafios"} por dia</MenuItem>)}
      </TextField>}
    </Stack>
    {error && <Alert severity="warning" sx={{ mt: 2 }} action={<Button onClick={() => setRefresh((value) => value + 1)}>Tentar novamente</Button>}>{error}</Alert>}
    {!data && !error && <Typography role="status" sx={{ mt: 2 }}>Carregando suas conquistas…</Typography>}
    {data && <>
      <Typography aria-live="polite" sx={{ mt: 2 }}>{data.daily.completed} de {data.daily.goal} desafios novos concluídos {data.daily.achieved ? "· Meta alcançada!" : "· Cada passo conta"}</Typography>
      <LinearProgress variant="determinate" value={Math.min(100, data.daily.completed / data.daily.goal * 100)} aria-label="Progresso da meta diária" sx={{ my: 1, height: 8, borderRadius: 4, "& .MuiLinearProgress-bar": { backgroundColor: "#a3e635" } }} />
      <Typography variant="caption" color="text.secondary">Reinicia à meia-noite de São Paulo. Repetir um desafio já resolvido não conta novamente.</Typography>
      <Typography component="h3" sx={{ mt: 3, mb: 1, fontWeight: 800 }}>Suas conquistas · {data.achievements.length}</Typography>
      <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1 }}>
        {data.achievements.map((item) => <Chip key={item.code} icon={<EmojiEventsRounded />} label={item.title} title={item.description} sx={{ maxWidth: "100%", color: "#fde68a", backgroundColor: "#302a1b", "& .MuiChip-icon": { color: "#fbbf24" } }} />)}
      </Stack>
      {!data.achievements.length && <Typography color="text.secondary">Resolva seu primeiro desafio para conquistar sua primeira medalha.</Typography>}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{data.stats.solved} desafios · {data.stats.lessons} lições · {data.stats.studyDays} dias de prática</Typography>
    </>}
    <Dialog open={celebration.length > 0} onClose={() => setCelebration([])} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: "center" }}><EmojiEventsRounded sx={{ display: "block", mx: "auto", mb: 1, fontSize: 56, color: "#fbbf24" }} />Mais uma conquista!</DialogTitle>
      <DialogContent><Stack spacing={1}>{celebration.map((message, index) => <Typography key={`${message}-${index}`} align="center">{message}</Typography>)}</Stack></DialogContent>
      <DialogActions><Button fullWidth variant="contained" onClick={() => setCelebration([])}>Continuar aprendendo</Button></DialogActions>
    </Dialog>
  </Box>;
}
