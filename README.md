## Etapa 1: acesso e contas

O cadastro público cria alunos (`ROLE_USER`). Criar cursos e lições exige
`ROLE_ADMIN`, validado na API. A consulta de cursos, lições e `/api/me` exige login.
O frontend consulta `/api/me` para restaurar a sessão e verificar permissões.
Uma resposta 401 encerra a sessão local e encaminha ao login; 403 informa falta
de permissão sem desconectar o usuário. O botão Sair remove o token do navegador.
Como a autenticação é JWT stateless, logout não revoga uma cópia do token já
emitido: ela continua válida até sua expiração.

Na pasta `backend`, aplique as migrations e promova uma conta existente:

```powershell
php bin/console doctrine:migrations:migrate --no-interaction
php bin/console app:user:promote-admin email-da-conta@example.com
```

O comando de promoção é exclusivo do terminal; o cadastro público ignora papéis
enviados pelo cliente. Entre novamente ou recarregue a página após a promoção.
E-mails são normalizados para minúsculas e sem espaços nas pontas, inclusive no
login. A migration interrompe a execução caso existam duplicados após normalizar,
para permitir uma resolução manual sem apagar contas automaticamente.

Validação:

```powershell
# backend
php bin/phpunit
php bin/console lint:container
# frontend
npm run build
npm run lint
```

### Pendências anteriores do banco local

Na validação de 12/11/2026, a migration `Version20261112120000` foi aplicada.
O banco registra três migrations que não estão neste repositório:
`Version20260917213742`, `Version20260917221219` e `Version20261019210101`.
Recupere esses arquivos do histórico antes de reconstruir fielmente esse ambiente.

`doctrine:schema:validate` ainda aponta diferenças anteriores: tabela `lesson`,
coluna `user.avatarurl`, tipo de `user.password`, defaults de timestamps e de
`courses.description`, e nome do índice de `lessons.course_id`. Não execute
`doctrine:schema:update --force` para resolver isso indiscriminadamente, pois a
proposta inclui remover tabela e coluna. Essas diferenças foram preservadas.

## Como rodar
Backend

Acesse a pasta do backend:

cd backend

Instale as dependências do Symfony:

composer install

Inicie o servidor:

symfony server:start

Dependências

Symfony 8.1
Doctrine ORM
Symfony Security
LexikJWTAuthenticationBundle 3.2.0
lcobucci/jwt 5.6.0
Web Token Suite 4.x
PostgreSQL

Frontend

Acesse a pasta do frontend:

cd frontend

Instale as dependências:
npm install
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install react-router-dom
npm install axios
npm install zustand

Inicie o servidor de desenvolvimento:
npm run dev

Dependências
React
TypeScript
Material UI
Material UI Icons
React Router DOM
Axios
Zustand
