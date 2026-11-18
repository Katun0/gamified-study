import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  CheckCircleRounded,
  CodeRounded,
  PlayArrowRounded,
  ScienceRounded,
} from "@mui/icons-material";
import { apiRequest } from "../../lib/api";
export type TestCase = { input: string; expected: string };
const labels = {
  accepted: "Resposta correta",
  wrong_answer: "Saída diferente da esperada",
  runtime_error: "Erro ao executar o código",
  time_limit: "Tempo excedido",
  memory_limit: "Limite de memória excedido",
  output_limit: "Limite de saída excedido",
};
type Result = TestCase & {
  status: keyof typeof labels;
  actual: string;
  errorOutput: string;
};
export function ProblemExercise({
  id,
  test,
}: {
  id: number;
  test: TestCase | null;
}) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function check() {
    setBusy(true);
    setResult(null);
    setError("");
    try {
      setResult(
        await apiRequest<Result>(`/api/problems/${id}/check`, {
          method: "POST",
          body: JSON.stringify({ code }),
        }),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível verificar a resposta.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Typography
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontWeight: 800,
          fontSize: 13,
          color: "#B6C6DC",
        }}
      >
        <CodeRounded fontSize="small" /> EDITOR PYTHON
      </Typography>
      <TextField
        className="sq-code-input"
        label="Seu código Python"
        multiline
        minRows={6}
        value={code}
        disabled={busy}
        slotProps={{
          htmlInput: { spellCheck: false, style: { fontFamily: "monospace" } },
        }}
        onChange={(e) => {
          setCode(e.target.value);
          setResult(null);
          setError("");
        }}
      />
      {!test && (
        <Alert severity="info">
          A verificação ficará disponível quando o caso de teste for cadastrado.
        </Alert>
      )}
      <Button
        className="sq-admin-submit"
        variant="contained"
        startIcon={<PlayArrowRounded />}
        disabled={!test || busy || !code.trim()}
        onClick={check}
      >
        {busy ? "Verificando código..." : "Executar e verificar"}
      </Button>
      <Box aria-live="polite">
        {error && <Alert severity="error">{error}</Alert>}
        {result && (
          <Alert
            severity={result.status === "accepted" ? "success" : "warning"}
            icon={
              result.status === "accepted" ? <CheckCircleRounded /> : undefined
            }
          >
            <strong>{labels[result.status]}</strong>
            <Box
              component="dl"
              sx={{
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                mt: 1,
                "& dt": { fontWeight: 850, mt: 1 },
                "& dd": { ml: 0, fontFamily: "monospace" },
              }}
            >
              <dt>Entrada do teste</dt>
              <dd>{result.input || "(vazia)"}</dd>
              <dt>Saída esperada</dt>
              <dd>{result.expected || "(vazia)"}</dd>
              <dt>Saída do seu código</dt>
              <dd>{result.actual || "(vazia)"}</dd>
              {result.errorOutput && (
                <>
                  <dt>Mensagem do Python</dt>
                  <dd>{result.errorOutput}</dd>
                </>
              )}
            </Box>
          </Alert>
        )}
      </Box>
    </Stack>
  );
}
export function TestCaseEditor({
  id,
  test,
}: {
  id: number;
  test: TestCase | null;
}) {
  const [input, setInput] = useState(test?.input ?? "");
  const [expected, setExpected] = useState(test?.expected ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setBusy(true);
    setSaved(false);
    setError("");
    try {
      await apiRequest(`/api/problems/${id}/test-case`, {
        method: "PUT",
        body: JSON.stringify({ input, expected }),
      });
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao salvar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Typography
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontWeight: 800,
          fontSize: 13,
          color: "#CBB5FF",
        }}
      >
        <ScienceRounded fontSize="small" /> CONFIGURAÇÃO DO TESTE
      </Typography>
      <TextField
        multiline
        label="Entrada do teste (opcional)"
        disabled={busy}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setSaved(false);
        }}
      />
      <TextField
        multiline
        minRows={2}
        label="Saída esperada"
        disabled={busy}
        value={expected}
        onChange={(e) => {
          setExpected(e.target.value);
          setSaved(false);
        }}
      />
      <Button
        variant="outlined"
        color="secondary"
        onClick={save}
        disabled={busy}
      >
        {busy ? "Salvando..." : "Salvar caso de teste"}
      </Button>
      {saved && <Alert severity="success">Caso de teste salvo.</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
}
