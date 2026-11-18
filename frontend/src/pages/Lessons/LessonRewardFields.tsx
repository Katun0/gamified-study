import { MenuItem, TextField } from "@mui/material";
import { difficultyLabels, type Difficulty } from "../Problems/difficulty";

export default function LessonRewardFields({ difficulty, xp, onDifficulty, onXp, disabled = false }: {
  difficulty: Difficulty; xp: string; onDifficulty: (value: Difficulty) => void;
  onXp: (value: string) => void; disabled?: boolean;
}) {
  return <>
    <TextField select label="Dificuldade da lição" value={difficulty} disabled={disabled}
      onChange={(event) => onDifficulty(event.target.value as Difficulty)}>
      {Object.entries(difficultyLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
    </TextField>
    <TextField label="XP da lição" type="number" value={xp} disabled={disabled}
      onChange={(event) => onXp(event.target.value)}
      slotProps={{ htmlInput: { min: 0, max: 1000000, step: 1 } }}
      helperText="Vazio: soma do XP dos problemas (100 XP para leitura). Um valor informado substitui essa soma. A dificuldade da lição é uma classificação." />
  </>;
}
