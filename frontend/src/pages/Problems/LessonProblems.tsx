import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { CodeRounded } from "@mui/icons-material";
import { apiRequest } from "../../lib/api";
import DifficultyEditor from "./DifficultyEditor";
import { difficultyLabels, type Difficulty } from "./difficulty";
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
  locked: boolean;
  completed: boolean;
  difficulty: Difficulty;
  xpReward: number;
};
export default function LessonProblems({
  lessonId,
  editTests = false,
  onProgress,
}: {
  lessonId: number;
  editTests?: boolean;
  onProgress?: () => void;
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
    <Stack spacing={2.5} sx={{ mt: 3 }}>
      <Typography
        component="h2"
        variant="h6"
        sx={{ fontWeight: 850, display: "flex", alignItems: "center", gap: 1 }}
      >
        <CodeRounded sx={{ color: "#A3E635" }} />
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
                setRetry((v) => v + 1);
              }}
            >
              Tentar novamente
            </Button>
          }
        >
          {error}
        </Alert>
      ) : problems.length === 0 ? (
        <Alert severity="info">
          Esta lição ainda não tem problemas cadastrados.
        </Alert>
      ) : (
        problems.map((p, index) => (
          <Box component="article" key={p.id} className="sq-problem-card">
            <Typography className="sq-problem-card-title">
              DESAFIO {String(index + 1).padStart(2, "0")}
            </Typography>
            <Typography
              component="h3"
              sx={{
                fontSize: 19,
                fontWeight: 850,
                mt: 1,
                overflowWrap: "anywhere",
              }}
            >
              {p.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {difficultyLabels[p.difficulty]}
            </Typography>
            {p.completed && (
              <Alert severity="success" sx={{ mt: 1 }}>Problema concluído.</Alert>
            )}
            {p.locked ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                Resolva os problemas anteriores para desbloquear este desafio.
              </Alert>
            ) : (
              <>
                <Typography
                  sx={{
                    mt: 1.5,
                    mb: 2,
                    color: "#B8C7DB",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    lineHeight: 1.8,
                  }}
                >
                  {p.statement}
                </Typography>
                {editTests ? (
                  <>
                  <DifficultyEditor id={p.id} difficulty={p.difficulty} onSaved={(updated) => {
                    setProblems((items) => items.map((item) => item.id === p.id ? { ...item, ...updated } : item));
                  }} />
                  <TestCaseEditor id={p.id} test={p.testCase} />
                  </>
                ) : (
                  <ProblemExercise
                    id={p.id}
                    test={p.testCase}
                    onSuccess={() => {
                      setRetry((value) => value + 1);
                      onProgress?.();
                    }}
                  />
                )}
              </>
            )}
          </Box>
        ))
      )}
    </Stack>
  );
}
