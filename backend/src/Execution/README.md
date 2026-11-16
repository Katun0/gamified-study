# Integração com o executor

`CodeExecutorInterface` define o contrato futuro. Nenhum serviço depende dele ainda.

Próximos arquivos a implementar:

- `HttpCodeExecutor.php`: cliente HTTP, autenticação interna e timeout.
- `ExecutionResult.php`: objeto de resultado tipado, se necessário.
- `OutputComparator.php`: comparação de saída, com normalização explícita.

Depois disso, criar um controller de verificação de problemas e persistir testes
e tentativas. O código do aluno nunca será executado pelo processo PHP.
URL e segredo do executor deverão vir de variáveis de ambiente; não do navegador.
