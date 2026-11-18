import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowForwardRounded, MenuBookRounded } from "@mui/icons-material";
import { apiRequest } from "../../lib/api";
import AdminLayout from "../../components/layout/AdminLayout";
import LessonRewardFields from "./LessonRewardFields";
import ExistingLessonRewards from "./ExistingLessonRewards";
import type { Difficulty } from "../Problems/difficulty";

type Course = { id: number; name: string; description: string };
export default function CreateLesson() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialCourseId = (location.state as { courseId?: number } | null)
    ?.courseId;
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState<number | "">(initialCourseId ?? "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [xp, setXp] = useState("");
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdLesson, setCreatedLesson] = useState<{
    id: number;
    courseId: number;
  } | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    apiRequest<Course[]>("/api/courses")
      .then((items) => {
        if (!active) return;
        setCourses(items);
        if (initialCourseId && items.some((c) => c.id === initialCourseId))
          setCourseId(initialCourseId);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar os cursos.",
          );
      })
      .finally(() => {
        if (active) setLoadingCourses(false);
      });
    return () => {
      active = false;
    };
  }, [initialCourseId]);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!courseId || loading) return;
    setError("");
    setSuccess("");
    setCreatedLesson(null);
    setLoading(true);
    try {
      const lesson = await apiRequest<{ id: number; courseId: number }>(
        "/api/lessons",
        {
          method: "POST",
          body: JSON.stringify({
            courseId,
            difficulty,
            xpReward: xp === "" ? null : Number(xp),
            title: title.trim(),
            content: content.trim(),
          }),
        },
      );
      setSuccess("Lição cadastrada com sucesso!");
      setCreatedLesson(lesson);
      setRevision((value) => value + 1);
      setTitle("");
      setContent("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Erro ao cadastrar lição.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <AdminLayout
      current="lessons"
      eyebrow="ETAPA 02 · CONHECIMENTO"
      title="Criar uma lição"
      description="Divida o aprendizado em etapas curtas e envolventes. Cada lição é uma nova conquista."
      icon={<MenuBookRounded />}
    >
      <Stack spacing={3} sx={{ maxWidth: 760 }}>
        {success && (
          <Alert
            severity="success"
            action={
              createdLesson && (
                <Button
                  color="inherit"
                  onClick={() =>
                    navigate(
                      `/problems/new?course=${createdLesson.courseId}&lesson=${createdLesson.id}`,
                    )
                  }
                >
                  Adicionar desafios
                </Button>
              )
            }
          >
            {success}
          </Alert>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        <Stack
          component="form"
          onSubmit={handleSubmit}
          spacing={3}
          className="sq-admin-panel"
        >
          <Typography sx={{ fontWeight: 850, fontSize: 19 }}>
            Conteúdo da missão
          </Typography>
          <LessonRewardFields difficulty={difficulty} xp={xp} onDifficulty={setDifficulty} onXp={setXp} disabled={loading} />
          <FormControl fullWidth required>
            <InputLabel id="lesson-course-label">Curso</InputLabel>
            <Select
              labelId="lesson-course-label"
              label="Curso"
              value={courseId}
              onChange={(e) => setCourseId(Number(e.target.value))}
              disabled={loadingCourses || courses.length === 0}
            >
              {courses.map((c) => (
                <MenuItem value={c.id} key={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {loadingCourses && (
            <CircularProgress size={22} aria-label="Carregando cursos" />
          )}
          {!loadingCourses && courses.length === 0 && (
            <Alert
              severity="info"
              action={
                <Button component={Link} to="/courses/new" color="inherit">
                  Criar curso
                </Button>
              }
            >
              Comece cadastrando um curso.
            </Alert>
          )}
          <TextField
            label="Título da lição"
            placeholder="Ex.: Variáveis e tipos de dados"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            slotProps={{ htmlInput: { maxLength: 255 } }}
          />
          <TextField
            label="Material da lição"
            placeholder="Explique os conceitos e apresente exemplos..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            multiline
            minRows={10}
            fullWidth
            helperText="O estudante verá este conteúdo antes de resolver os desafios."
          />
          <Button
            className="sq-admin-submit"
            type="submit"
            variant="contained"
            disabled={
              loading ||
              loadingCourses ||
              !courseId ||
              !title.trim() ||
              !content.trim()
            }
          >
            {loading ? "Salvando lição..." : "Publicar lição"}
          </Button>
        </Stack>
        {courseId !== "" && <ExistingLessonRewards key={courseId} courseId={courseId} revision={revision} />}
        <Button
          className="sq-admin-link"
          component={Link}
          to="/courses/new"
          endIcon={<ArrowForwardRounded />}
          sx={{ alignSelf: "flex-start" }}
        >
          Cadastrar outro curso
        </Button>
      </Stack>
    </AdminLayout>
  );
}
