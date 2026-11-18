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
import { useAuth } from "../../auth/useAuth";
export type TestCase = {
  evaluationMode?: "stdin_stdout" | "function";
  input?: string;
  expected?: string;
  functionArguments?: any[];
  expectedReturn?: any;
  expectedReturnType?: "string" | null;
  functionTemplate?: string;
};
const labels = {
  accepted: "Resposta correta",
  wrong_answer: "Resultado diferente do esperado",
  runtime_error: "Erro ao executar o código",
  time_limit: "Tempo excedido",
  memory_limit: "Limite de memória excedido",
  output_limit: "Limite de saída excedido",
};
type Result = {
  status: keyof typeof labels;
  evaluationMode: "stdin_stdout" | "function";
  input: any;
  expected: any;
  expectedReturnType: "string" | null;
  actual: any;
  stdout: string;
  errorOutput: string;
  xpAwarded: number;
  totalXp: number;
};
export function ProblemExercise({
  id,
  test,
  onSuccess,
}: {
  id: number;
  test: TestCase | null;
  onSuccess?: () => void;
}) {
  const { user, updateTotalXp } = useAuth();
  const [code, setCode] = useState(test?.functionTemplate || "");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function check() {
    setBusy(true);
    setResult(null);
    setError("");
    try {
      const data = await apiRequest<Result>(`/api/problems/${id}/check`, {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setResult(data);
      if (user) updateTotalXp(user.id, data.totalXp);
      if (data.status === "accepted" && onSuccess) {
        onSuccess();
      }
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
            {result.xpAwarded > 0 && (
              <Typography sx={{ mt: 1, fontWeight: 800 }}>
                Lição concluída! +{result.xpAwarded} XP
              </Typography>
            )}
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
              <dt>{result.evaluationMode === 'function' ? 'Argumentos da função' : 'Entrada do teste'}</dt>
              <dd>{result.evaluationMode === 'function' ? JSON.stringify(result.input) : (result.input || "(vazia)")}</dd>
              <dt>{result.evaluationMode === 'function' ? (result.expectedReturnType === 'string' ? 'Tipo de retorno esperado' : 'Retorno esperado') : 'Saída esperada'}</dt>
              <dd>{result.evaluationMode === 'function' ? (result.expectedReturnType === 'string' ? 'Qualquer string' : JSON.stringify(result.expected)) : (result.expected || "(vazia)")}</dd>
              <dt>{result.evaluationMode === 'function' ? 'Retorno obtido' : 'Saída do seu código'}</dt>
              <dd>{result.evaluationMode === 'function' ? JSON.stringify(result.actual) : (result.actual || "(vazia)")}</dd>
              {result.evaluationMode === 'function' && result.stdout && (
                <>
                  <dt>Saída de depuração (prints)</dt>
                  <dd>{result.stdout}</dd>
                </>
              )}
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
  const [mode, setMode] = useState<"stdin_stdout" | "function">(test?.evaluationMode || "stdin_stdout");
  const [input, setInput] = useState(test?.input ?? "");
  const [expected, setExpected] = useState(test?.expected ?? "");
  const [funcArgs, setFuncArgs] = useState(JSON.stringify(test?.functionArguments || []));
  const [expectedReturn, setExpectedReturn] = useState(JSON.stringify(test?.expectedReturn ?? null));
  const [returnType, setReturnType] = useState<"value" | "string">(test?.expectedReturnType === "string" ? "string" : "value");
  const [template, setTemplate] = useState(test?.functionTemplate || "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setSaved(false);
    setError("");
    try {
      let body: any = { evaluationMode: mode };
      if (mode === "function") {
        try {
          body.functionArguments = JSON.parse(funcArgs);
          if (returnType === "string") {
            body.expectedReturnType = "string";
          } else {
            body.expectedReturn = JSON.parse(expectedReturn);
          }
          body.functionTemplate = template;
        } catch (e) {
          throw new Error("Argumentos ou retorno esperado inválidos (deve ser JSON).");
        }
      } else {
        body.input = input;
        body.expected = expected;
      }

      await apiRequest(`/api/problems/${id}/test-case`, {
        method: "PUT",
        body: JSON.stringify(body),
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

      <Stack direction="row" spacing={1}>
        <Button variant={mode === 'stdin_stdout' ? 'contained' : 'outlined'} onClick={() => setMode('stdin_stdout')} size="small">Stdin/Stdout</Button>
        <Button variant={mode === 'function' ? 'contained' : 'outlined'} onClick={() => setMode('function')} size="small">Função</Button>
      </Stack>

      {mode === 'stdin_stdout' ? (
        <>
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
        </>
      ) : (
        <>
          <TextField
            label="Argumentos (Array JSON)"
            placeholder="[1, 2, 3]"
            disabled={busy}
            value={funcArgs}
            onChange={(e) => {
              setFuncArgs(e.target.value);
              setSaved(false);
            }}
          />
          <Stack direction="row" spacing={1}>
            <Button
              variant={returnType === "value" ? "contained" : "outlined"}
              onClick={() => {
                setReturnType("value");
                setSaved(false);
              }}
              disabled={busy}
              size="small"
            >
              Retorno exato
            </Button>
            <Button
              variant={returnType === "string" ? "contained" : "outlined"}
              onClick={() => {
                setReturnType("string");
                setSaved(false);
              }}
              disabled={busy}
              size="small"
            >
              Qualquer string
            </Button>
          </Stack>
          {returnType === "value" ? (
            <TextField
              label="Retorno esperado (JSON)"
              placeholder='"Olá"'
              disabled={busy}
              value={expectedReturn}
              onChange={(e) => {
                setExpectedReturn(e.target.value);
                setSaved(false);
              }}
            />
          ) : (
            <Alert severity="info">A solução será aceita se retornar qualquer valor do tipo string.</Alert>
          )}
          <TextField
            multiline
            minRows={3}
            label="Template da função"
            placeholder="def solution(n):"
            disabled={busy}
            value={template}
            onChange={(e) => {
              setTemplate(e.target.value);
              setSaved(false);
            }}
          />
        </>
      )}

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
