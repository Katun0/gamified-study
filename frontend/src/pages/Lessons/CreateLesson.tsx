import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { apiRequest } from "../../lib/api";
import { colors } from "../../theme/colors";

type Course = { id: number; name: string; description: string };

export default function CreateLesson() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialCourseId = (location.state as { courseId?: number } | null)?.courseId;
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState<number | "">(initialCourseId ?? "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest<Course[]>("/api/courses")
      .then((items) => {
        if (!active) return;
        setCourses(items);
        if (initialCourseId && items.some((course) => course.id === initialCourseId)) {
          setCourseId(initialCourseId);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar os cursos.");
      })
      .finally(() => {
        if (active) setLoadingCourses(false);
      });
    return () => { active = false; };
  }, [initialCourseId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!courseId) return;
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await apiRequest("/api/lessons", {
        method: "POST",
        body: JSON.stringify({ courseId, title: title.trim(), content: content.trim() }),
      });
      setSuccess("Lição cadastrada com sucesso.");
      setTitle("");
      setContent("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao cadastrar lição.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: colors.background, color: colors.text, py: { xs: 3, sm: 6 } }}>
      <Container maxWidth="sm">
        <IconButton aria-label="Voltar para o início" onClick={() => navigate("/")} sx={{ color: colors.textSecondary, mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Stack spacing={3}>
          <Box>
            <EditNoteOutlinedIcon sx={{ color: colors.secondary, fontSize: 40, mb: 1 }} />
            <Typography component="h1" variant="h4" sx={{ fontWeight: 800 }}>Cadastrar lição</Typography>
            <Typography sx={{ color: colors.textSecondary, mt: 1 }}>Escolha um curso e adicione o conteúdo da lição.</Typography>
          </Box>

          {success && <Alert severity="success">{success}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}

          <Stack component="form" spacing={2.5} onSubmit={handleSubmit} sx={{ p: { xs: 2.5, sm: 3.5 }, border: `1px solid ${colors.border}`, borderRadius: 3, bgcolor: colors.surface }}>
            <FormControl fullWidth required>
              <InputLabel id="lesson-course-label">Curso</InputLabel>
              <Select
                labelId="lesson-course-label"
                label="Curso"
                value={courseId}
                onChange={(event) => setCourseId(Number(event.target.value))}
                disabled={loadingCourses || courses.length === 0}
              >
                {courses.map((course) => <MenuItem key={course.id} value={course.id}>{course.name}</MenuItem>)}
              </Select>
            </FormControl>
            {!loadingCourses && courses.length === 0 && (
              <Alert severity="info" action={<Button color="inherit" size="small" onClick={() => navigate("/courses/new")}>Cadastrar</Button>}>
                Cadastre um curso antes de criar uma lição.
              </Alert>
            )}
            <TextField
              label="Título da lição"
              placeholder="Ex.: Variáveis e tipos de dados"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              fullWidth
              slotProps={{ htmlInput: { maxLength: 255 } }}
            />
            <TextField
              label="Conteúdo"
              placeholder="Escreva o conteúdo da lição..."
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
              multiline
              minRows={7}
              fullWidth
            />
            <Button type="submit" variant="contained" disabled={loading || loadingCourses || !courseId} sx={{ minHeight: 48, fontWeight: 800 }}>
              {loading ? "Salvando..." : "Cadastrar lição"}
            </Button>
          </Stack>

          <Button onClick={() => navigate("/courses/new")} sx={{ color: colors.primary, alignSelf: "center" }}>
            Ir para cadastro de curso
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
