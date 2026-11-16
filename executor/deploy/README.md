# Imagem da sandbox

Da pasta executor:
```text
docker build --pull -t gamified-study-python:local -f deploy/Dockerfile deploy
```

Não copiar código do projeto, credenciais ou .env para a imagem. Os controles são aplicados pelo runner; iniciar apenas a imagem não aplica todos os limites.
Usar Docker Linux com seccomp e suporte a limites. Em produção, usar host/VM dedicado e imagem aprovada por digest.
Não expor o daemon publicamente. Autenticação HTTP, fila e reconciliação de containers abandonados ainda não estão implementadas.
