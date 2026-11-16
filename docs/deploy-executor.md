# Publicação do executor

O workflow publica duas imagens Linux amd64 em ghcr.io/katun0, com o SHA completo do commit como tag. A imagem gamified-study-executor atende o Symfony. A imagem gamified-study-python roda o programa do aluno e deve existir no daemon com o nome local esperado pelo runner.

Em uma VM Linux dedicada, com Docker, seccomp e suporte aos limites de recursos, configure o token de produção no ambiente do operador e no Symfony. Execute os comandos abaixo com o SHA de um workflow concluído. Para pacotes privados, autentique o Docker no GHCR com acesso de leitura.

```bash
docker pull ghcr.io/katun0/gamified-study-python:"$SHA"
docker tag ghcr.io/katun0/gamified-study-python:"$SHA" gamified-study-python:local
docker pull ghcr.io/katun0/gamified-study-executor:"$SHA"
docker run -d --name study-executor --restart unless-stopped \
  --read-only --cap-drop ALL --security-opt no-new-privileges \
  --group-add "$(stat -c %g /var/run/docker.sock)" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e EXECUTOR_API_TOKEN -p 127.0.0.1:8001:8001 \
  ghcr.io/katun0/gamified-study-executor:"$SHA"
```

O serviço controlador tem acesso administrativo ao daemon dessa VM por meio do socket. Os containers de alunos são criados separadamente pelo runner. Para um Symfony local falar com essa VM, um túnel SSH pode encaminhar uma porta local livre até 127.0.0.1:8001 na VM. Configure EXECUTOR_URL no backend com o endereço local do túnel.

## Frontend e API

O navegador do aluno chama o endereço configurado em VITE_API_URL no momento do build. Para acesso externo, defina no projeto Vercel a URL HTTPS pública da API Symfony e faça um novo deploy. Enquanto a API estiver disponível somente no computador do desenvolvedor, outros alunos não poderão alcançá-la pelo site.

No ambiente da API, a origem CORS de produção para este frontend é `^https://studyquest-joao\.vercel\.app$`. EXECUTOR_API_TOKEN, DATABASE_URL e as chaves JWT ficam no servidor. Configure credenciais, banco e HTTPS antes de disponibilizar o Symfony publicamente.
