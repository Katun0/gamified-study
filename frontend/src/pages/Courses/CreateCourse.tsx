import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { ArrowForwardRounded, SchoolRounded } from "@mui/icons-material";
import { apiRequest } from "../../lib/api";
import AdminLayout from "../../components/layout/AdminLayout";

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
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });
      setCreatedCourse(course);
      setName("");
      setDescription("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Erro ao cadastrar curso.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <AdminLayout
      current="courses"
      eyebrow="ETAPA 01 · ESTRUTURA"
      title="Nova trilha de conhecimento"
      description="Dê um nome à aventura e apresente os conceitos que seus estudantes vão dominar."
      icon={<SchoolRounded />}
    >
      <Stack spacing={3} sx={{ maxWidth: 760 }}>
        {createdCourse && (
          <Alert
            severity="success"
            action={
              <Button
                color="inherit"
                onClick={() =>
                  navigate("/lessons/new", {
                    state: { courseId: createdCourse.id },
                  })
                }
              >
                Adicionar lição
              </Button>
            }
          >
            Curso “{createdCourse.name}” cadastrado com sucesso!
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
            Informações do curso
          </Typography>
          <TextField
            label="Nome do curso"
            placeholder="Ex.: Fundamentos de Python"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            slotProps={{ htmlInput: { maxLength: 255 } }}
            helperText="Escolha um nome curto e fácil de reconhecer."
          />
          <TextField
            label="Descrição da jornada"
            placeholder="O que a pessoa vai aprender nesta aventura?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={5}
            fullWidth
          />
          <Button
            className="sq-admin-submit"
            type="submit"
            variant="contained"
            disabled={loading || !name.trim()}
          >
            {loading ? "Salvando curso..." : "Criar curso"}
          </Button>
        </Stack>
        <Button
          className="sq-admin-link"
          component={Link}
          to="/lessons/new"
          endIcon={<ArrowForwardRounded />}
          sx={{ alignSelf: "flex-start" }}
        >
          Ir para criação de lições
        </Button>
      </Stack>
    </AdminLayout>
  );
}
