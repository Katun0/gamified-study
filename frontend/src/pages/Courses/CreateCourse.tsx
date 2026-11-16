import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { apiRequest } from "../../lib/api";
import { colors } from "../../theme/colors";

type Course = { id: number; name: string; description: string };

export default function CreateCourse() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createdCourse, setCreatedCourse] = useState<Course | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setCreatedCourse(null);
    setLoading(true);
    try {
      const course = await apiRequest<Course>("/api/courses", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      setCreatedCourse(course);
      setName("");
      setDescription("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao cadastrar curso.");
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
            <MenuBookOutlinedIcon sx={{ color: colors.primary, fontSize: 38, mb: 1 }} />
            <Typography component="h1" variant="h4" sx={{ fontWeight: 800 }}>Cadastrar curso</Typography>
            <Typography sx={{ color: colors.textSecondary, mt: 1 }}>Crie uma trilha de aprendizagem para organizar suas lições.</Typography>
          </Box>

          {createdCourse && (
            <Alert severity="success" action={
              <Button color="inherit" size="small" onClick={() => navigate("/lessons/new", { state: { courseId: createdCourse.id } })}>
                Adicionar lição
              </Button>
            }>
              Curso “{createdCourse.name}” cadastrado.
            </Alert>
          )}
          {error && <Alert severity="error">{error}</Alert>}

          <Stack component="form" spacing={2.5} onSubmit={handleSubmit} sx={{ p: { xs: 2.5, sm: 3.5 }, border: `1px solid ${colors.border}`, borderRadius: 3, bgcolor: colors.surface }}>
            <TextField
              label="Nome do curso"
              placeholder="Ex.: Fundamentos de Python"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              fullWidth
              slotProps={{ htmlInput: { maxLength: 255 } }}
            />
            <TextField
              label="Descrição"
              placeholder="O que a pessoa vai aprender neste curso?"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              multiline
              minRows={4}
              fullWidth
            />
            <Button type="submit" variant="contained" disabled={loading} sx={{ minHeight: 48, fontWeight: 800 }}>
              {loading ? "Salvando..." : "Cadastrar curso"}
            </Button>
          </Stack>

          <Button onClick={() => navigate("/lessons/new")} sx={{ color: colors.primary, alignSelf: "center" }}>
            Ir para cadastro de lição
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
