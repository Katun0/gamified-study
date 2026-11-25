import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { EmojiEventsRounded, FlagRounded, LocalFireDepartmentRounded, CheckRounded, LockRounded } from "@mui/icons-material";
import "./MotivationPanel.css";
import { apiRequest } from "../lib/api";

type Achievement = { code: string; title: string; description: string; kind: "module" | "milestone"; unlockedAt: string };
type Motivation = {
  daily: { date: string; timezone: string; goal: number; completed: number; achieved: boolean };
  achievements: Achievement[];
  streak?: { current: number; best: number; activeToday: boolean; week: { date: string; active: boolean; today: boolean }[] };
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

  const percent = data ? Math.min(100, data.daily.completed / Math.max(1, data.daily.goal) * 100) : 0;
  const pending = data ? [
    { code: "first_problem", title: "Primeiros passos", description: "Resolva seu primeiro desafio.", value: data.stats.solved, target: 1 },
    { code: "ten_problems", title: "Dez desafios vencidos", description: "Resolva dez desafios diferentes.", value: data.stats.solved, target: 10 },
    { code: "first_lesson", title: "Primeira missão", description: "Conclua sua primeira lição.", value: data.stats.lessons, target: 1 },
    { code: "seven_days", title: "Uma semana de prática", description: "Pratique em sete dias, consecutivos ou não.", value: data.stats.studyDays, target: 7 },
  ].filter((item) => !data.achievements.some((earned) => earned.code === item.code)) : [];

  return <Box component="section" aria-label="Metas e conquistas" className="sq-motivation">
    <div className="sq-motivation-heading">
      <div><span className="sq-motivation-eyebrow">CADA PASSO CONTA</span><h2>Seu ritmo de aprendizado</h2></div>
      {data && <TextField select size="small" label="Meta diária" value={data.daily.goal} disabled={saving} onChange={(event) => changeGoal(Number(event.target.value))} sx={{ minWidth: 180 }}>
        {[1, 2, 3].map((goal) => <MenuItem key={goal} value={goal}>{goal} {goal === 1 ? "desafio" : "desafios"} por dia</MenuItem>)}
      </TextField>}
    </div>
    {error && <Alert severity="warning" sx={{ mb: 2 }} action={<Button onClick={() => setRefresh((value) => value + 1)}>Tentar novamente</Button>}>{error}</Alert>}
    {!data && !error && <Typography role="status">Carregando suas conquistas…</Typography>}
    {data && <>
      <div className="sq-motivation-grid">
        <section className="sq-metric-card sq-streak-card" aria-label="Sequência de estudo">
          <h3><LocalFireDepartmentRounded /> Sequência de estudo</h3>
          {data.streak ? <>
            <strong className="sq-metric-value">{data.streak.current}</strong><span className="sq-metric-unit">{data.streak.current === 1 ? "dia seguido" : "dias seguidos"}</span>
            <p className="sq-metric-copy">{data.streak.activeToday ? "Sequência em dia. Você já deu seu passo hoje!" : data.streak.current > 0 ? "Conclua uma atividade hoje para manter sua sequência." : "Uma nova atividade hoje começa sua sequência."}<br />Seu recorde: <strong>{data.streak.best} {data.streak.best === 1 ? "dia" : "dias"}</strong>.</p>
            <div className="sq-week" aria-label="Atividade nos últimos sete dias">
              {data.streak.week.map((day) => <div key={day.date} className={`sq-week-day${day.active ? " is-active" : ""}${day.today ? " is-today" : ""}`} aria-label={`${day.date}: ${day.active ? "atividade concluída" : "sem atividade"}${day.today ? ", hoje" : ""}`}>
                <span>{day.today ? "Hoje" : new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" }).format(new Date(day.date + "T12:00:00Z"))}</span>
                <span className="sq-week-dot">{day.active ? <CheckRounded /> : <span aria-hidden="true">·</span>}</span>
              </div>)}
            </div>
            <p className="sq-metric-copy">Conta ao concluir um novo desafio ou uma lição. Entrar no site ou repetir desafios não conta.</p>
          </> : <p className="sq-metric-copy">A sequência ficará disponível após a atualização da API.</p>}
        </section>
        <section className="sq-metric-card" aria-label="Meta diária">
          <h3><FlagRounded sx={{ color: "#a3e635" }} /> Sua meta de hoje</h3>
          <div className="sq-goal-body">
            <div className="sq-goal-ring" role="progressbar" aria-label="Progresso da meta diária" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={`${data.daily.completed} de ${data.daily.goal} desafios`}>
              <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" fill="none" stroke="#28384f" strokeWidth="8" /><circle cx="50" cy="50" r="42" fill="none" stroke="#a3e635" strokeWidth="8" pathLength="100" strokeDasharray={`${percent} 100`} strokeLinecap={percent > 0 ? "round" : "butt"} /></svg>
              <strong>{data.daily.completed}/{data.daily.goal}</strong>
            </div>
            <div aria-live="polite"><p className="sq-goal-caption">{data.daily.achieved ? "Meta alcançada!" : "Um desafio de cada vez"}</p><p className="sq-metric-copy">{data.daily.achieved ? "Bom trabalho! Seu progresso de hoje está registrado." : `Falta${data.daily.goal - data.daily.completed === 1 ? "" : "m"} ${data.daily.goal - data.daily.completed} para completar sua meta.`}</p></div>
          </div>
          <p className="sq-metric-copy">Somente desafios novos aprovados. Reinicia à meia-noite de São Paulo.</p>
          <div className="sq-motivation-stats"><span><strong>{data.stats.solved}</strong> desafios</span><span><strong>{data.stats.lessons}</strong> lições</span><span><strong>{data.stats.studyDays}</strong> dias de prática</span></div>
        </section>
      </div>
      <section className="sq-achievements" aria-label="Coleção de conquistas">
        <div className="sq-achievements-header"><h3>Suas conquistas</h3><span>{data.achievements.length} desbloqueadas</span></div>
        <div className="sq-badge-grid">
          {data.achievements.map((item) => <article className="sq-badge" key={item.code}><span className="sq-badge-icon"><EmojiEventsRounded /></span><div><h4>{item.title}</h4><p>{item.description}</p><span className="sq-badge-status">✓ Conquistada</span></div></article>)}
          {pending.map((item) => <article className="sq-badge is-locked" key={item.code}><span className="sq-badge-icon"><LockRounded /></span><div style={{ flex: 1 }}><h4>{item.title}</h4><p>{item.description}</p><span className="sq-badge-status">Em progresso · {Math.min(item.value, item.target)}/{item.target}</span><LinearProgress variant="determinate" value={Math.min(100, item.value / item.target * 100)} aria-label={`Progresso: ${item.title}`} sx={{ mt: 1, height: 4, borderRadius: 2 }} /></div></article>)}
        </div>
      </section>
    </>}
    <Dialog open={celebration.length > 0} onClose={() => setCelebration([])} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: "center" }}><EmojiEventsRounded sx={{ display: "block", mx: "auto", mb: 1, fontSize: 56, color: "#fbbf24" }} />Mais uma conquista!</DialogTitle>
      <DialogContent><Stack spacing={1}>{celebration.map((message, index) => <Typography key={`${message}-${index}`} align="center">{message}</Typography>)}</Stack></DialogContent>
      <DialogActions><Button fullWidth variant="contained" onClick={() => setCelebration([])}>Continuar aprendendo</Button></DialogActions>
    </Dialog>
  </Box>;
}
