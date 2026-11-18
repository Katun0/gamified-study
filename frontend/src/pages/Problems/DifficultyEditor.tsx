import { useState } from "react";
import { Alert, Button, MenuItem, Stack, TextField } from "@mui/material";
import { apiRequest } from "../../lib/api";

import { difficultyLabels, type Difficulty } from "./difficulty";

export default function DifficultyEditor({ id, difficulty, onSaved }: {
  id: number;
  difficulty: Difficulty;
  onSaved: (problem: { difficulty: Difficulty; xpReward: number }) => void;
}) {
  const [value, setValue] = useState(difficulty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest<{ difficulty: Difficulty; xpReward: number }>(`/api/problems/${id}/difficulty`, {
        method: "PATCH", body: JSON.stringify({ difficulty: value }),
      });
      onSaved(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar a dificuldade.");
    } finally {
      setBusy(false);
    }
  }

  return <Stack spacing={2} sx={{ mt: 2 }}>
    <TextField select label="Dificuldade" value={value} disabled={busy}
      helperText="A dificuldade define o XP das próximas conclusões."
      onChange={(event) => setValue(event.target.value as Difficulty)}>
      {Object.entries(difficultyLabels).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
    </TextField>
    <Button onClick={save} disabled={busy || value === difficulty}>
      {busy ? "Salvando…" : "Salvar dificuldade"}
    </Button>
    {error && <Alert severity="error">{error}</Alert>}
  </Stack>;
}
