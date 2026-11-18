# Níveis por XP

O nível é calculado pelo backend a partir do XP acumulado. Não requer migration nem gravação separada de nível. Contas existentes recebem seu nível automaticamente.

Curva inicial: 200 XP para o primeiro avanço; cada avanço seguinte exige mais 100 XP. A referência é uma lição introdutória com dois problemas fáceis (50 cada) e um médio (100). Lições mais difíceis ou com XP personalizado também contribuem com seu valor real. A curva não depende da quantidade de lições cadastradas: editar o catálogo não muda os limites.

| Nível | XP total mínimo | XP para avançar |
|---|---:|---:|
| 1 | 0 | 200 |
| 2 | 200 | 300 |
| 3 | 500 | 400 |
| 4 | 900 | 500 |
| 5 | 1400 | 600 |
| 6 | 2000 | 700 |
| 7 | 2700 | 800 |
| 8 | 3500 | 900 |
| 9 | 4400 | 1000 |
| 10 | 5400 | 1100 |

A progressão continua sem teto fixo. Um ganho grande pode avançar vários níveis. O XP total nunca é consumido; a barra mostra apenas o progresso dentro do nível atual.

Configuração central: `backend/src/Progress/UserLevel.php`, constantes FIRST_LEVEL_XP e STEP_XP. Alterar a curva recalcula os níveis de todas as contas. Os bloqueios de lições continuam dependendo da conclusão das anteriores, não do nível.

Os endpoints de perfil, correção e conclusão retornam `progression`. Publique backend e frontend; o executor não precisa ser atualizado.
