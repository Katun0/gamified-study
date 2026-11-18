"""Programa confiável executado APENAS dentro do container descartável.

Recebe o envelope JSON, prepara stdin e substitui o próprio processo pelo Python
do aluno. Este arquivo não deve ser executado no host.
"""

BOOTSTRAP = r'''
import json, os, sys, inspect

def _handle_result(res):
    try:
        json.dump({"result": res}, sys.stdout)
    except (TypeError, ValueError):
        sys.stderr.write("\nErro: O retorno da função não é serializável em JSON.\n")
        sys.exit(1)

payload = json.load(sys.stdin)
code_path = '/tmp/solution.py'
with open(code_path, 'w', encoding='utf-8') as code:
    code.write(payload['code'])

mode = payload.get('mode', 'stdin_stdout')

if mode == 'stdin_stdout':
    with open('/tmp/input', 'wb') as source:
        source.write(payload.get('stdin', '').encode('utf-8'))
    fd = os.open('/tmp/input', os.O_RDONLY)
    os.dup2(fd, 0)
    os.close(fd)
    os.execv(sys.executable, [sys.executable, '-I', '-B', '-u', code_path])
elif mode == 'function':
    try:
        import importlib.util
        spec = importlib.util.spec_from_file_location("solution_module", code_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        if not hasattr(module, 'solution'):
            sys.stderr.write("Erro: Função 'solution' não encontrada.\n")
            sys.exit(1)
            
        func = getattr(module, 'solution')
        if not callable(func):
            sys.stderr.write("Erro: 'solution' não é uma função.\n")
            sys.exit(1)
            
        if inspect.iscoroutinefunction(func):
            sys.stderr.write("Erro: Funções async não são suportadas.\n")
            sys.exit(1)

        args = payload.get('func_args', [])
        if not isinstance(args, list):
            sys.stderr.write("Erro: Argumentos da função devem ser uma lista.\n")
            sys.exit(1)

        try:
            result = func(*args)
            print("\n---RESULT_START---")
            _handle_result(result)
        except TypeError as e:
            sys.stderr.write(f"Erro de assinatura: {str(e)}\n")
            sys.exit(1)
        except Exception as e:
            import traceback
            traceback.print_exc()
            sys.exit(1)
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)
else:
    sys.stderr.write(f"Erro: Modo '{mode}' desconhecido.\n")
    sys.exit(1)
'''
