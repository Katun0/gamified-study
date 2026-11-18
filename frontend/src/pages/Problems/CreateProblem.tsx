import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowForwardRounded, TerminalRounded } from "@mui/icons-material";
import { apiRequest } from "../../lib/api";
import AdminLayout from "../../components/layout/AdminLayout";
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
      .then((items) => {
        if (active) setCourses(items);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Erro ao carregar cursos.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  const selectedCourse = courses.some((item) => item.id === courseId)
    ? courseId
    : "";
  return (
    <AdminLayout
      current="problems"
      eyebrow="ETAPA 03 · PRÁTICA"
      title="Laboratório de desafios"
      description="Transforme teoria em prática. Crie enunciados, organize os testes e prepare missões de programação."
      icon={<TerminalRounded />}
    >
      <Stack spacing={3} sx={{ maxWidth: 860 }}>
        {loading ? (
          <CircularProgress aria-label="Carregando cursos" />
        ) : error ? (
          <Alert
            severity="error"
            action={
              <Button
                onClick={() => {
                  setError("");
                  setLoading(true);
                  setRetry((v) => v + 1);
                }}
              >
                Tentar novamente
              </Button>
            }
          >
            {error}
          </Alert>
        ) : courses.length === 0 ? (
          <Alert severity="info">
            Cadastre um <Link to="/courses/new">curso</Link> e uma lição antes
            de adicionar desafios.
          </Alert>
        ) : (
          <>
            <Box className="sq-admin-panel">
              <Typography sx={{ fontWeight: 850, fontSize: 19, mb: 2 }}>
                Onde este desafio será aplicado?
              </Typography>
              <TextField
                select
                label="Curso"
                value={selectedCourse}
                onChange={(e) => setCourseId(Number(e.target.value))}
                fullWidth
              >
                {courses.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            {selectedCourse && (
              <CourseProblemForm
                key={selectedCourse}
                courseId={selectedCourse}
                initialLessonId={Number(params.get("lesson"))}
              />
            )}
          </>
        )}
      </Stack>
    </AdminLayout>
  );
}
function CourseProblemForm({
  courseId,
  initialLessonId,
}: {
  courseId: number;
  initialLessonId: number;
}) {
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
      .then((items) => {
        if (active) setLessons(items);
      })
      .catch((cause) => {
        if (active)
          setLoadError(
            cause instanceof Error ? cause.message : "Erro ao carregar lições.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [courseId, retry]);
  const selectedLesson = lessons.some((l) => l.id === lessonId) ? lessonId : "";
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedLesson || saving) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await apiRequest("/api/problems", {
        method: "POST",
        body: JSON.stringify({
          lessonId: selectedLesson,
          title: title.trim(),
          statement: statement.trim(),
        }),
      });
      setSuccess(
        "Desafio cadastrado! Você pode incluir outro nesta mesma lição.",
      );
      setTitle("");
      setStatement("");
      setRevision((v) => v + 1);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Erro ao cadastrar desafio.",
      );
    } finally {
      setSaving(false);
    }
  };
  if (loading) return <CircularProgress aria-label="Carregando lições" />;
  if (loadError)
    return (
      <Alert
        severity="error"
        action={
          <Button
            onClick={() => {
              setLoadError("");
              setLoading(true);
              setRetry((v) => v + 1);
            }}
          >
            Tentar novamente
          </Button>
        }
      >
        {loadError}
      </Alert>
    );
  if (!lessons.length)
    return (
      <Alert
        severity="info"
        action={
          <Button component={Link} to="/lessons/new" state={{ courseId }}>
            Criar lição
          </Button>
        }
      >
        Este curso ainda não tem lições.
      </Alert>
    );
  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      <Stack
        component="form"
        onSubmit={submit}
        spacing={3}
        className="sq-admin-panel"
      >
        <Typography sx={{ fontWeight: 850, fontSize: 19 }}>
          Escreva a missão
        </Typography>
        <TextField
          select
          required
          label="Lição"
          value={selectedLesson}
          disabled={saving}
          onChange={(e) => {
            setLessonId(Number(e.target.value));
            setSuccess("");
            setError("");
          }}
        >
          {lessons.map((l) => (
            <MenuItem value={l.id} key={l.id}>
              {l.title}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Título do desafio"
          placeholder="Ex.: Meu primeiro Hello World"
          required
          value={title}
          disabled={saving}
          onChange={(e) => setTitle(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 255 } }}
        />
        <TextField
          label="Enunciado"
          placeholder={'Faça um programa que imprima "Hello World" na tela.'}
          required
          multiline
          minRows={7}
          value={statement}
          disabled={saving}
          onChange={(e) => setStatement(e.target.value)}
          helperText="Descreva claramente o objetivo e a saída esperada."
        />
        <Button
          className="sq-admin-submit"
          type="submit"
          variant="contained"
          disabled={
            saving || !selectedLesson || !title.trim() || !statement.trim()
          }
        >
          {saving ? "Salvando desafio..." : "Criar desafio"}
        </Button>
      </Stack>
      {selectedLesson && (
        <>
          <Typography variant="h6" sx={{ fontWeight: 850 }}>
            Desafios existentes{" "}
            <ArrowForwardRounded
              sx={{ verticalAlign: "middle", color: "#A3E635" }}
            />
          </Typography>
          <LessonProblems
            key={`${selectedLesson}-${revision}`}
            lessonId={selectedLesson}
            editTests
          />
        </>
      )}
    </Stack>
  );
}
