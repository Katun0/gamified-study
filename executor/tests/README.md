# Validação

test_docker_runner.py valida estados, limites, falhas de infraestrutura e limpeza usando Docker simulado.
test_sandbox_integration.py roda exclusivamente em containers reais quando RUN_SANDBOX_INTEGRATION=1. Construir a imagem primeiro.
Sem Docker, os testes de integração são ignorados: isso não valida isolamento.
A futura API precisará de testes de autenticação, limites de requisição e concorrência.
