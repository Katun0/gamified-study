import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { apiRequest } from "../../lib/api";
import {
  ProblemExercise,
  TestCaseEditor,
  type TestCase,
} from "./ProblemExercise";

export type Problem = {
  id: number;
  lessonId: number;
  title: string;
  statement: string;
  testCase: TestCase | null;
};

export default function LessonProblems({
  lessonId,
  editTests = false,
}: {
  lessonId: number;
  editTests?: boolean;
}) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    apiRequest<Problem[]>(`/api/lessons/${lessonId}/problems`)
      .then((items) => {
        if (active) setProblems(items);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Erro ao carregar problemas.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [lessonId, retry]);

  return (
    <Stack spacing={2} sx={{ mt: 3 }}>
      <Typography component="h2" variant="h6">
        Problemas da lição
      </Typography>
      {loading ? (
        <CircularProgress size={24} aria-label="Carregando problemas" />
      ) : error ? (
        <Alert
          severity="error"
          action={
            <Button
              onClick={() => {
                setError("");
                setLoading(true);
                setRetry((value) => value + 1);
              }}
            >
              Tentar novamente
            </Button>
          }
        >
          {error}
        </Alert>
      ) : problems.length === 0 ? (
        <Typography color="text.secondary">
          Esta lição ainda não tem problemas cadastrados.
        </Typography>
      ) : (
        problems.map((problem, index) => (
          <Box
            component="article"
            key={problem.id}
            sx={{
              p: 2.5,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <Typography variant="overline" color="primary">
              Problema {index + 1}
            </Typography>
            <Typography
              component="h3"
              variant="subtitle1"
              sx={{ fontWeight: 800, overflowWrap: "anywhere" }}
            >
              {problem.title}
            </Typography>
            <Typography
              sx={{
                mt: 1,
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                lineHeight: 1.8,
              }}
            >
              {problem.statement}
            </Typography>
            {editTests ? (
              <TestCaseEditor id={problem.id} test={problem.testCase} />
            ) : (
              <ProblemExercise id={problem.id} test={problem.testCase} />
            )}
          </Box>
        ))
      )}
    </Stack>
  );
}
