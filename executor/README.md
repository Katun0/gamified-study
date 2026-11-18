# Executor Python

Cada execução usa um container Linux descartável. A tela da lição envia código ao Symfony, que consulta o caso de teste do problema e chama o executor interno.

## Usar com a trilha

Configure `EXECUTOR_API_TOKEN` em `backend/.env.local`. O executor local lê esse arquivo ao iniciar. Uma variável de ambiente preenchida tem prioridade, o que permite executar o serviço em outra máquina. A partir da pasta executor, use `py -3.13 -m app.api.server` no Windows. Reinicie os serviços depois de alterar o segredo. Mantenha somente exemplos sem credenciais nos arquivos versionados.

Como administrador, abra Criar problema, selecione a lição e salve a entrada e a saída esperada no problema. Como aluno, abra a mesma lição, digite o programa e clique em Verificar resposta.

No modo Função, o caso de teste pode exigir um retorno exato ou aceitar qualquer retorno do tipo string. O executor preserva o tipo do valor retornado; a comparação com o caso de teste, incluindo a validação de tipo, é feita pelo Symfony.

## Preparação

Requer Python 3.11+, Docker Linux com seccomp e limites de CPU, memória, swap e processos. No Windows, use Docker Desktop com backend Linux/WSL2. Não há fallback para executar código no host.

Na pasta executor:
```powershell
docker build --pull -t gamified-study-python:local -f deploy/Dockerfile deploy
python -m app.main --check
'{"code":"print(input())","stdin":"Hello World\n"}' | python -m app.main
```

Resposta: status completed, stdout Hello World seguido de quebra de linha, stderr vazio e exitCode 0. completed não significa resposta correta; a comparação pertence ao Symfony.

A imagem não é baixada durante execuções. Fixe um digest aprovado da imagem em produção; python:3.13-slim define a linha do interpretador, não um build imutável.

## Arquivos

- app/main.py: CLI JSON para diagnóstico.
- app/config.py: limites validados.
- app/sandbox/docker_runner.py: criação, monitoramento e remoção.
- app/sandbox/bootstrap.py: prepara stdin e programa exclusivamente no container.
- app/sandbox/runner.py: interface e erro de infraestrutura.
- app/schemas/execution.py: contratos.
- app/services/execution.py: coordenação.
- app/api/server.py: servidor HTTP interno com autenticação Bearer.
- deploy/Dockerfile: imagem sem arquivos ou credenciais do projeto.

## Controles implementados

- Tempo total monitorado: 5 segundos após criação; 1 CPU; 128 MiB de memória e memória+swap iguais (sem swap).
- 16 processos, 64 descritores e core dumps desabilitados.
- 64 KiB de código, entrada e saída combinada stdout+stderr.
- Saída limitada durante a leitura, antes de decodificar UTF-8; bytes inválidos são substituídos.
- UID 65534, capabilities removidas, no-new-privileges e seccomp padrão.
- Sem rede externa, portas publicadas, volumes ou diretórios do projeto.
- Filesystem somente leitura; /tmp descartável de 16 MiB, noexec/nosuid/nodev; IPC desabilitado.
- Logs Docker desabilitados; remoção em sucesso, timeout, cancelamento ou falha.

Subprocess controla somente Docker, usando listas de argumentos sem shell. O código do aluno nunca é executado no host. Código e entrada são enviados por stdin.
OOMKilled e MemoryError não tratado produzem memory_limit. O wrapper aplica também RLIMIT_AS ao espaço de endereçamento do Python, com o mesmo valor configurado para memória. Os limites do container continuam ativos. O código de saída 120 é reservado pelo wrapper para MemoryError e 121 para retorno acima do limite de saída.

## Testes de função

O aluno escreve a função completa, por exemplo:

```python
def solution():
    nome = "João"
    return nome
```

Cadastre modo **Função**, argumentos `[]` e retorno esperado JSON `"João"`.
Com parâmetros, use por exemplo `def solution(nome): return nome` e argumentos `["João"]`.
Para aceitar qualquer nome, selecione a validação por tipo string já disponível no cadastro; uma comparação exata continua exigindo o texto esperado.

O executor chama solution(*args) dentro da sandbox. O retorno é enviado em um canal separado dos prints, sem marcadores de texto. Em execuções de função bem-sucedidas, prints e mensagens escritas pelo aluno em stderr são reunidos no campo stdout de depuração; em falhas, os diagnósticos permanecem em stderr. O Symfony compara o campo result com o teste do banco. Um retorno null é válido, mas a ausência do campo result é erro. Retornos não JSON e números não finitos são rejeitados.

Publique novamente a imagem do serviço executor e atualize o backend. Não há migration para esta correção. O pipeline executa os testes de integração Docker antes de publicar a imagem.

## Testes
```powershell
python -m unittest discover -s tests -v
$env:RUN_SANDBOX_INTEGRATION = "1"
python -m unittest discover -s tests -p test_sandbox_integration.py -v
Remove-Item Env:RUN_SANDBOX_INTEGRATION
```

Os testes de integração exigem Docker e imagem construída. Sem Docker são ignorados explicitamente; os testes unitários não comprovam o isolamento real.

## Limites operacionais

Containers compartilham o kernel. Para código público não confiável, use máquina/VM dedicada sem dados da aplicação e avalie isolamento adicional. O construtor aceita runtime="runsc" quando esse runtime estiver instalado.
Referências: https://docs.docker.com/engine/security/ e https://docs.docker.com/reference/cli/docker/container/run/.

O daemon Docker é privilegiado; não exponha seu socket ao aluno, ao navegador ou pela rede pública. A imagem utilizada deve ser controlada pelo operador.
Queda abrupta do serviço ou falha do daemon pode deixar containers. A operação futura deve reconciliar a label gamified-study.sandbox=true, distinguindo execuções ativas de abandonadas.
O servidor local atende uma requisição por vez. A implantação em produção exige dimensionamento e validação da sandbox no ambiente alvo.

