import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  EmojiEventsRounded,
  FlagRounded,
  LocalFireDepartmentRounded,
  CheckRounded,
  LockRounded,
} from "@mui/icons-material";
import "./MotivationPanel.css";
import { apiRequest } from "../lib/api";
import { useAuth } from "../auth/useAuth";

type Achievement = {
  code: string;
  title: string;
  description: string;
  kind: "module" | "milestone";
  unlockedAt: string;
};
type Motivation = {
  daily: {
    date: string;
    timezone: string;
    goal: number;
    completed: number;
    achieved: boolean;
  };
  achievements: Achievement[];
  streak?: {
    current: number;
    best: number;
    activeToday: boolean;
    week: { date: string; active: boolean; today: boolean }[];
  };
  stats: { solved: number; lessons: number; studyDays: number };
};

export default function MotivationPanel({ revision }: { revision: number }) {
  const { user } = useAuth();
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
    const timer = window.setInterval(
      () => setRefresh((value) => value + 1),
      60000,
    );
    const wake = () => {
      if (document.visibilityState === "visible")
        setRefresh((value) => value + 1);
    };
    document.addEventListener("visibilitychange", wake);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", wake);
    };
  }, []);

  useEffect(() => {
    const request = ++requestId.current;
    apiRequest<Motivation>("/api/me/gamification")
      .then((next) => {
        if (!mounted.current || request !== requestId.current) return;
        const before = previous.current;
        if (before) {
          const known = new Set(before.achievements.map((item) => item.code));
          const messages = next.achievements
            .filter((item) => !known.has(item.code))
            .map((item) => item.title);
          if (
            before.daily.date === next.daily.date &&
            !before.daily.achieved &&
            next.daily.achieved &&
            before.daily.goal === next.daily.goal
          )
            messages.push("Meta diária concluída!");
          if (messages.length)
            setCelebration((items) => [...items, ...messages]);
        }
        previous.current = next;
        setData(next);
        setError("");
      })
      .catch((cause) => {
        if (mounted.current && request === requestId.current)
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar suas conquistas.",
          );
      });
  }, [revision, refresh]);

  async function changeGoal(goal: number) {
    if (saving) return;
    setSaving(true);
    setError("");
    const request = ++requestId.current;
    try {
      const next = await apiRequest<Motivation>("/api/me/daily-goal", {
        method: "PUT",
        body: JSON.stringify({ goal }),
      });
      if (mounted.current && request === requestId.current) {
        previous.current = next;
        setData(next);
      }
    } catch (cause) {
      if (mounted.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível salvar sua meta.",
        );
    } finally {
      if (mounted.current) {
        setSaving(false);
        setRefresh((value) => value + 1);
      }
    }
  }

  const percent = data
    ? Math.min(100, (data.daily.completed / Math.max(1, data.daily.goal)) * 100)
    : 0;
  const pending = data
    ? [
        {
          code: "first_problem",
          title: "Primeiros passos",
          description: "Resolva seu primeiro desafio.",
          value: data.stats.solved,
          target: 1,
        },
        {
          code: "ten_problems",
          title: "Dez desafios vencidos",
          description: "Resolva dez desafios diferentes.",
          value: data.stats.solved,
          target: 10,
        },
        {
          code: "first_lesson",
          title: "Primeira missão",
          description: "Conclua sua primeira lição.",
          value: data.stats.lessons,
          target: 1,
        },
        {
          code: "seven_days",
          title: "Uma semana de prática",
          description: "Pratique em sete dias, consecutivos ou não.",
          value: data.stats.studyDays,
          target: 7,
        },
      ].filter(
        (item) =>
          !data.achievements.some((earned) => earned.code === item.code),
      )
    : [];

  // XP vem do contexto de autenticação, atualizado pelo backend após cada desafio.
  // O marco visual de 100 XP não representa um nível oficial do sistema.
  const xpValue = (user as unknown as { totalXp?: unknown } | null)?.totalXp;
  const totalXp = typeof xpValue === "number" && Number.isFinite(xpValue)
    ? Math.max(0, xpValue)
    : null;
  const nextMilestone = totalXp === null ? 100 : (Math.floor(totalXp / 100) + 1) * 100;
  const milestonePercent = totalXp === null ? 0 : (totalXp % 100);
  const xpCaption = totalXp === null
    ? "XP indisponível nesta sessão"
    : `${nextMilestone - totalXp} XP até o próximo marco de 100`;

  return (
    <Box component="section" aria-label="Painel de aventura" className="sq-motivation">
      <header className="sq-hud-header">
        <div>
          <span className="sq-motivation-eyebrow">SEU PAINEL DE AVENTURA</span>
          <h2>Continue evoluindo</h2>
        </div>
        <EmojiEventsRounded aria-hidden="true" />
      </header>
      {error && (
        <Alert severity="warning" sx={{ mb: 1 }} action={<Button onClick={() => setRefresh((v) => v + 1)}>Tentar novamente</Button>}>
          {error}
        </Alert>
      )}
      {!data && !error && <Typography role="status">Carregando seu progresso…</Typography>}
      {data && (
        <>
          <section className="sq-hud-xp" aria-label="Experiência acumulada">
            <div
              className="sq-hud-xp-ring"
              role="progressbar"
              aria-label="Progresso até o próximo marco visual de cem pontos de experiência"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={milestonePercent}
            >
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#2c3550" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#b7f258" strokeWidth="8"
                  strokeDasharray={`${milestonePercent} 100`} strokeLinecap="round" pathLength="100" transform="rotate(-90 50 50)" />
              </svg>
              <div className="sq-hud-xp-center"><strong>{totalXp === null ? "—" : totalXp}</strong><span>XP TOTAL</span></div>
            </div>
            <div className="sq-hud-xp-copy">
              <span className="sq-hud-label">EXPERIÊNCIA</span>
              <strong>Seu esforço vira XP!</strong>
              <small>{xpCaption}</small>
              <small className="sq-hud-muted">Marcos visuais, sem alteração das regras do backend.</small>
            </div>
          </section>

          <div className="sq-hud-duo">
            <section className="sq-hud-mini" aria-label="Sequência de estudo">
              <LocalFireDepartmentRounded className="sq-hud-fire" />
              <strong>{data.streak?.current ?? 0}</strong>
              <span>{(data.streak?.current ?? 0) === 1 ? "dia seguido" : "dias seguidos"}</span>
              <small>Recorde: {data.streak?.best ?? 0} dias</small>
            </section>
            <section className="sq-hud-mini" aria-label="Meta diária">
              <FlagRounded className="sq-hud-flag" />
              <strong>{data.daily.completed}/{data.daily.goal}</strong>
              <span>meta de hoje</span>
              <div className="sq-hud-progress" role="progressbar" aria-label="Progresso da meta diária"
                aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
                <span style={{ width: `${percent}%` }} />
              </div>
            </section>
          </div>

          <div className="sq-hud-controls">
            <TextField select label="Desafios por dia" size="small" value={data.daily.goal}
              onChange={(event) => changeGoal(Number(event.target.value))}
              disabled={saving} fullWidth
              sx={{ "& .MuiInputBase-root": { color: "#f2f6ff" }, "& .MuiInputLabel-root": { color: "#b8c5db" } }}>
              {[1, 2, 3].map((goal) => <MenuItem key={goal} value={goal}>{goal} {goal === 1 ? "desafio" : "desafios"}</MenuItem>)}
            </TextField>
            {data.streak && (
              <div className="sq-week" aria-label="Atividades dos últimos sete dias">
                {data.streak.week.map((day) => (
                  <div key={day.date} className={`sq-week-day${day.active ? " is-active" : ""}${day.today ? " is-today" : ""}`}
                    title={`${day.date}: ${day.active ? "atividade concluída" : "sem atividade"}`}>
                    <span>{day.today ? "Hoje" : new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" }).format(new Date(`${day.date}T12:00:00Z`))}</span>
                    <span className="sq-week-dot">{day.active ? <CheckRounded /> : <span aria-hidden="true">·</span>}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <details className="sq-hud-achievements">
            <summary><span><EmojiEventsRounded /> Conquistas</span><strong>{data.achievements.length} desbloqueadas</strong></summary>
            <div className="sq-hud-achievements-content">
              {data.achievements.map((item) => (
                <div key={item.code} className="sq-hud-badge"><EmojiEventsRounded /><div><strong>{item.title}</strong><small>{item.description}</small></div></div>
              ))}
              {pending.map((item) => (
                <div key={item.code} className="sq-hud-badge is-locked"><LockRounded /><div><strong>{item.title}</strong><small>{item.value}/{item.target} · {item.description}</small>
                  <div className="sq-hud-progress"><span style={{width:`${Math.min(100,(item.value/Math.max(1,item.target))*100)}%`}} /></div></div></div>
              ))}
            </div>
          </details>
          <p className="sq-hud-footnote">Sequência e metas são calculadas pelo sistema. Refazer desafios não soma novas conclusões.</p>
        </>
      )}
      <Dialog open={celebration.length > 0} onClose={() => setCelebration([])} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: "center", fontWeight: 900 }}>
          <EmojiEventsRounded sx={{ display: "block", mx: "auto", mb: 1, fontSize: 54, color: "#fbbf24" }} />
          Conquista desbloqueada!
        </DialogTitle>
        <DialogContent><Stack spacing={1}>{celebration.map((message,index) => <Typography key={`${message}-${index}`} align="center">{message}</Typography>)}</Stack></DialogContent>
        <DialogActions><Button variant="contained" fullWidth onClick={() => setCelebration([])}>Continuar aventura</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
