"""Programa confiável executado APENAS dentro do container descartável.

Recebe o envelope JSON, prepara stdin e substitui o próprio processo pelo Python
do aluno. Este arquivo não deve ser executado no host.
"""

BOOTSTRAP = r'''
import json, os, sys
payload = json.load(sys.stdin)
with open('/tmp/solution.py', 'w', encoding='utf-8') as code:
    code.write(payload['code'])
with open('/tmp/input', 'wb') as source:
    source.write(payload['stdin'].encode('utf-8'))
fd = os.open('/tmp/input', os.O_RDONLY)
os.dup2(fd, 0)
os.close(fd)
os.execv(sys.executable, [sys.executable, '-I', '-B', '-u', '/tmp/solution.py'])
'''
