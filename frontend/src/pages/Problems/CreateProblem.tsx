import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Container, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { apiRequest } from "../../lib/api";
import LessonProblems from "./LessonProblems";

type Course = { id: number; name: string };
type Lesson = { id: number; title: string };

export default function CreateProblem() {
  const [params] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState(Number(params.get("course")) || 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    apiRequest<Course[]>("/api/courses")
      .then((items) => { if (active) setCourses(items); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Erro ao carregar cursos."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);
  const selectedCourse = courses.some((item) => item.id === courseId) ? courseId : "";
  return <Container maxWidth="sm" sx={{ py: 5 }}><Stack spacing={3}>
    <Button component={Link} to="/trails" sx={{ alignSelf: "flex-start" }}>← Voltar à trilha</Button>
    <Box><Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>Cadastrar problema</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Escolha a lição e descreva o desafio. Você pode adicionar vários problemas à mesma lição.</Typography></Box>
    {loading ? <CircularProgress aria-label="Carregando cursos" /> : error ? <Alert severity="error" action={<Button onClick={() => { setError(""); setLoading(true); setRetry((value) => value + 1); }}>Tentar novamente</Button>}>{error}</Alert> : courses.length === 0 ? <Alert severity="info">Cadastre um <Link to="/courses/new">curso</Link> e uma lição antes de adicionar problemas.</Alert> : <>
      <TextField select label="Curso" value={selectedCourse} onChange={(event) => setCourseId(Number(event.target.value))} fullWidth>{courses.map((course) => <MenuItem key={course.id} value={course.id}>{course.name}</MenuItem>)}</TextField>
      {selectedCourse && <CourseProblemForm key={selectedCourse} courseId={selectedCourse} initialLessonId={Number(params.get("lesson"))} />}
    </>}
  </Stack></Container>;
}

function CourseProblemForm({ courseId, initialLessonId }: { courseId: number; initialLessonId: number }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonId, setLessonId] = useState(initialLessonId || 0);
  const [title, setTitle] = useState("");
  const [statement, setStatement] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [revision, setRevision] = useState(0);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    apiRequest<Lesson[]>(`/api/courses/${courseId}/lessons`)
      .then((items) => { if (active) setLessons(items); })
      .catch((cause) => { if (active) setLoadError(cause instanceof Error ? cause.message : "Erro ao carregar lições."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId, retry]);
  const selectedLesson = lessons.some((item) => item.id === lessonId) ? lessonId : "";
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedLesson || saving) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      await apiRequest("/api/problems", { method: "POST", body: JSON.stringify({ lessonId: selectedLesson, title: title.trim(), statement: statement.trim() }) });
      setSuccess("Problema cadastrado. Você pode adicionar outro nesta mesma lição.");
      setTitle(""); setStatement(""); setRevision((value) => value + 1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Erro ao cadastrar problema."); }
    finally { setSaving(false); }
  };
  if (loading) return <CircularProgress aria-label="Carregando lições" />;
  if (loadError) return <Alert severity="error" action={<Button onClick={() => { setLoadError(""); setLoading(true); setRetry((value) => value + 1); }}>Tentar novamente</Button>}>{loadError}</Alert>;
  if (!lessons.length) return <Alert severity="info" action={<Button component={Link} to="/lessons/new" state={{ courseId }}>Criar lição</Button>}>Este curso ainda não tem lições.</Alert>;
  return <Stack spacing={3}>
    {error && <Alert severity="error">{error}</Alert>}{success && <Alert severity="success">{success}</Alert>}
    <Stack component="form" onSubmit={submit} spacing={2.5} sx={{ p: 3, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
      <TextField select required label="Lição" value={selectedLesson} disabled={saving} onChange={(event) => { setLessonId(Number(event.target.value)); setSuccess(""); setError(""); }}>{lessons.map((lesson) => <MenuItem key={lesson.id} value={lesson.id}>{lesson.title}</MenuItem>)}</TextField>
      <TextField label="Título do problema" placeholder="Ex.: Meu primeiro Hello World" required value={title} disabled={saving} onChange={(event) => setTitle(event.target.value)} slotProps={{ htmlInput: { maxLength: 255 } }} />
      <TextField label="Enunciado" placeholder={'Faça um programa que imprima "Hello World" na tela.'} required multiline minRows={6} value={statement} disabled={saving} onChange={(event) => setStatement(event.target.value)} />
      <Button type="submit" variant="contained" disabled={saving || !selectedLesson || !title.trim() || !statement.trim()}>{saving ? "Salvando..." : "Cadastrar problema"}</Button>
    </Stack>
    {selectedLesson && <LessonProblems key={`${selectedLesson}-${revision}`} lessonId={selectedLesson} editTests />}
  </Stack>;
}

