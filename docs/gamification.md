# Metas e conquistas

## Primeira entrega

- Meta diária configurável em 1, 2 ou 3 desafios; padrão 1.
- Apenas a primeira conclusão de cada desafio conta. Repetições e tentativas incorretas não contam.
- O dia segue America/Sao_Paulo. O histórico completed_at é interpretado como UTC, conforme armazenamento atual. A meta é calculada por data, sem cron de reset.
- A alteração da meta vale imediatamente para o dia atual. Não concede XP adicional.
- Medalhas: primeiro desafio, dez desafios diferentes, primeira lição, sete dias diferentes de prática (não é streak) e conclusão de cada módulo.
- Módulo corresponde a um curso com pelo menos uma lição. A medalha usa os registros de conclusão das lições e permanece válida se novas lições forem adicionadas depois.
- Leituras contam como lições e dias de prática, mas não como desafios na meta diária.
- Medalhas não concedem XP extra; o cálculo existente continua responsável pelos pontos.

## Persistência e APIs

`user.daily_goal` guarda a preferência. `user_achievements` guarda medalhas com chave única usuário/código. A identificação do usuário vem da autenticação; nenhum endpoint aceita contagens ou medalhas enviadas pelo cliente.

`StudyProgress` reconcilia medalhas dentro da transação de conclusão. `GET /api/me/gamification` também reconcilia o histórico de contas existentes; esse GET pode inserir medalhas, mas não registra conclusões nem altera XP. A reconciliação é idempotente. Medalhas históricas recebem a data em que foram reconhecidas, pois não há histórico completo de versões dos módulos.

`PUT /api/me/daily-goal` aceita somente `{"goal":1}`, `2` ou `3`. Ambos os endpoints exigem ROLE_USER e retornam Cache-Control: no-store.

O frontend atualiza após aprovação/conclusão, ao retornar à aba e a cada minuto. Medalhas existentes aparecem sem pop-up no carregamento inicial. Novas conquistas ou uma meta recém-atingida abrem uma celebração que pode ser dispensada. Atualizar a página não repete a celebração das medalhas já carregadas.

## Publicação

Aplicar `Version20261124010000` no banco de destino antes de publicar o backend, depois publicar frontend. O executor não muda. A migration foi aplicada somente nos bancos locais de desenvolvimento e testes durante a implementação.

Na pasta backend, com DATABASE_URL do ambiente correto:

```text
php bin/console doctrine:migrations:migrate --no-interaction
```

O rollback dessa migration remove preferências e conquistas, sem remover XP ou conclusões. Exige reverter também o código que depende desses campos.

## Painel visual e sequência

O painel da trilha mostra meta circular, calendário dos últimos sete dias, sequência atual, recorde e medalhas conquistadas ou pendentes com progresso. O layout se adapta ao celular.

O campo `streak` da API calcula dias consecutivos a partir das conclusões existentes, no fuso de São Paulo. Uma conclusão de desafio ou lição ativa o dia; repetições não contam. Se hoje ainda não houve atividade, a sequência terminada ontem continua válida até meia-noite. Um dia completo sem atividade zera a sequência atual, preservando o recorde. Não é necessária outra migration para esse cálculo.

## Fora desta entrega

Sequência de dias consecutivos, proteção de sequência, missões semanais, moedas, ranking e loja. Sete dias de prática é uma medalha cumulativa, não uma sequência consecutiva.
