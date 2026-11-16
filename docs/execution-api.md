# Correção de um problema

O administrador configura um caso público por problema com PUT /api/problems/{id}/test-case, enviando os campos de texto input e expected. Ambos aceitam texto vazio. A ausência de um caso cadastrado bloqueia a correção.

O aluno envia code em POST /api/problems/{id}/check. O Symfony recupera a entrada do banco e solicita POST /v1/executions ao executor local, usando autenticação Bearer. O corpo contém code e stdin. O executor devolve status, stdout, stderr e exitCode.

O backend compara stdout com a saída cadastrada quando a execução termina normalmente. A comparação preserva espaços, acentos e maiúsculas, converte CRLF para LF e ignora uma quebra final. A resposta ao navegador inclui status, input, expected, actual e errorOutput. Uma indisponibilidade retorna HTTP 503.

Consulte executor/README.md para iniciar o serviço.
