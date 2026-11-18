
import sys
import os
import json
from pathlib import Path

# Adiciona o diretório do executor ao sys.path para poder importar as classes
sys.path.append(str(Path(__file__).parent / "executor"))

from app.schemas.execution import ExecutionRequest
from app.sandbox.docker_runner import DockerSandboxRunner
from app.config import ExecutionLimits

def test_executor():
    runner = DockerSandboxRunner()
    limits = ExecutionLimits()

    print("--- Teste 1: Função Simples ---")
    req1 = ExecutionRequest(
        code='def solution(nome):\n    return f"Olá, {nome}"',
        mode="function",
        func_args=["João"]
    )
    res1 = runner.run(req1, limits)
    print(f"Status: {res1.status}")
    print(f"Result: {res1.result}")
    assert res1.status == "completed"
    assert res1.result == "Olá, João"

    print("\n--- Teste 2: Múltiplos Argumentos ---")
    req2 = ExecutionRequest(
        code='def solution(a, b):\n    return a + b',
        mode="function",
        func_args=[10, 20]
    )
    res2 = runner.run(req2, limits)
    print(f"Status: {res2.status}")
    print(f"Result: {res2.result}")
    assert res2.result == 30

    print("\n--- Teste 3: Prints não interferem ---")
    req3 = ExecutionRequest(
        code='def solution(x):\n    print("DEBUG:", x)\n    return x * 2',
        mode="function",
        func_args=[5]
    )
    res3 = runner.run(req3, limits)
    print(f"Status: {res3.status}")
    print(f"Stdout: {res3.stdout.strip()}")
    print(f"Result: {res3.result}")
    assert res3.result == 10
    assert "DEBUG: 5" in res3.stdout

    print("\n--- Teste 4: Tipos complexos ---")
    req4 = ExecutionRequest(
        code='def solution(items):\n    return {"count": len(items), "items": items}',
        mode="function",
        func_args=[[1, 2, "3"]]
    )
    res4 = runner.run(req4, limits)
    print(f"Result: {res4.result}")
    assert res4.result == {"count": 3, "items": [1, 2, "3"]}

    print("\n--- Teste 5: Erro de execução ---")
    req5 = ExecutionRequest(
        code='def solution(x):\n    return 1 / 0',
        mode="function",
        func_args=[1]
    )
    res5 = runner.run(req5, limits)
    print(f"Status: {res5.status}")
    print(f"Stderr: {res5.stderr}")
    assert res5.status == "runtime_error"
    assert "ZeroDivisionError" in res5.stderr

    print("\n--- Teste 6: Função ausente ---")
    req6 = ExecutionRequest(
        code='def wrong_name():\n    pass',
        mode="function",
        func_args=[]
    )
    res6 = runner.run(req6, limits)
    print(f"Status: {res6.status}")
    print(f"Stderr: {res6.stderr}")
    assert res6.status == "runtime_error"
    assert "Função 'solution' não encontrada" in res6.stderr

    print("\n--- Teste 7: Compatibilidade Stdin/Stdout ---")
    req7 = ExecutionRequest(
        code='import sys\nprint(sys.stdin.read())',
        mode="stdin_stdout",
        stdin="Teste Stdin"
    )
    res7 = runner.run(req7, limits)
    print(f"Status: {res7.status}")
    print(f"Stdout: {res7.stdout.strip()}")
    assert res7.stdout.strip() == "Teste Stdin"

    print("\nTodos os testes do executor passaram!")

if __name__ == "__main__":
    try:
        test_executor()
    except Exception as e:
        print(f"\nFALHA NO TESTE: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
