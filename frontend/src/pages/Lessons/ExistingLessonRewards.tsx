import { useEffect, useState, type FormEvent } from "react";
import { Alert, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { apiRequest } from "../../lib/api";
import type { Difficulty } from "../Problems/difficulty";
import LessonRewardFields from "./LessonRewardFields";

type Lesson = { id: number; title: string; difficulty: Difficulty; customXpReward: number | null };
export default function ExistingLessonRewards({ courseId, revision }: { courseId: number; revision: number }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [id, setId] = useState<number | "">("");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [xp, setXp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    let active = true;
    apiRequest<Lesson[]>(`/api/courses/${courseId}/lessons`)
      .then((items) => { if (active) setLessons(items); })
      .catch((cause) => { if (active) setError(cause.message); });
    return () => { active = false; };
  }, [courseId, revision]);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!id || busy) return;
    setBusy(true); setError(""); setSuccess(false);
    try {
      const result = await apiRequest<Lesson>(`/api/lessons/${id}/reward`, {
        method: "PATCH", body: JSON.stringify({ difficulty, xpReward: xp === "" ? null : Number(xp) }),
      });
      setLessons((items) => items.map((item) => item.id === id ? result : item));
      setSuccess(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Erro ao salvar."); }
    finally { setBusy(false); }
  }
  return <Stack component="form" onSubmit={save} spacing={2} className="sq-admin-panel">
    <Typography variant="h6">Ajustar lições cadastradas</Typography>
    <TextField select label="Lição" value={id} disabled={busy || !lessons.length} onChange={(event) => {
      const lesson = lessons.find((item) => item.id === Number(event.target.value));
      if (lesson) { setId(lesson.id); setDifficulty(lesson.difficulty); setXp(lesson.customXpReward?.toString() ?? ""); setSuccess(false); }
    }}>
      {lessons.map((lesson) => <MenuItem key={lesson.id} value={lesson.id}>{lesson.title}</MenuItem>)}
    </TextField>
    {id !== "" && <>
      <LessonRewardFields difficulty={difficulty} xp={xp} onDifficulty={setDifficulty} onXp={setXp} disabled={busy} />
      <Alert severity="info">A alteração vale para novas conclusões. O XP já recebido pelos usuários será preservado.</Alert>
      <Button type="submit" disabled={busy}>{busy ? "Salvando…" : "Salvar dificuldade e XP"}</Button>
    </>}
    {error && <Alert severity="error">{error}</Alert>}
    {success && <Alert severity="success">Lição atualizada.</Alert>}
  </Stack>;
}
