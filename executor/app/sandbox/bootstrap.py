"""Wrapper executado somente dentro da sandbox Docker."""

BOOTSTRAP = r'''
import json, os, sys, inspect, runpy, math

# Exit 120 identifica MemoryError não tratado; OOM do kernel é lido no Docker.
def memory_exhausted():
    os._exit(120)

payload = json.load(sys.stdin)
import resource
memory_bytes = payload['memory_limit'] * 1024 * 1024
resource.setrlimit(resource.RLIMIT_AS, (memory_bytes, memory_bytes))
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
    try:
        runpy.run_path(code_path, run_name='__main__')
    except MemoryError:
        memory_exhausted()
elif mode == 'function':
    # stdout externo transporta apenas o retorno. Prints (inclusive os.write)
    # e diagnósticos vão para stderr, sem delimitadores no texto do aluno.
    result_fd = os.dup(1)
    os.set_inheritable(result_fd, False)
    os.dup2(2, 1)
    fd = os.open('/dev/null', os.O_RDONLY)
    os.dup2(fd, 0)
    os.close(fd)

    def valid_json(value):
        if value is None or type(value) in (str, bool, int):
            return True
        if type(value) is float:
            return math.isfinite(value)
        if type(value) is list:
            return all(valid_json(item) for item in value)
        if type(value) is dict:
            return all(type(key) is str and valid_json(item) for key, item in value.items())
        return False

    try:
        namespace = runpy.run_path(code_path, run_name='solution_module')
        func = namespace.get('solution')
        if not callable(func):
            raise ValueError("Defina uma função chamada solution.")
        if inspect.iscoroutinefunction(func):
            raise ValueError("Funções async não são suportadas.")
        args = payload.get('func_args')
        if args is None:
            args = []
        if not isinstance(args, list):
            raise ValueError("Argumentos devem ser um array JSON.")
        try:
            inspect.signature(func).bind(*args)
        except TypeError as error:
            raise ValueError("Argumentos incompatíveis com solution: " + str(error)) from error
        result = func(*args)
        if not valid_json(result):
            raise ValueError("Retorno inválido: use apenas valores JSON com números finitos.")
        encoded = json.dumps({'result': result}, allow_nan=False).encode('utf-8')
        if len(encoded) > payload['output_limit']:
            os._exit(121)
        with os.fdopen(result_fd, 'wb') as channel:
            channel.write(encoded)
    except MemoryError:
        memory_exhausted()
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)
else:
    sys.stderr.write("Modo de execução inválido.\n")
    sys.exit(1)
'''
