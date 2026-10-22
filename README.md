# Lister

Quadro Kanban pessoal para Windows, com controle de tempo por tarefa. App desktop feito com Tauri 2 + React; tudo fica salvo localmente, sem conta e sem rede.

## Funcionalidades

- Vários boards kanban e blocos de notas em markdown
- Colunas e tarefas com arrastar e soltar
- Tarefas com descrição, prioridade, tags coloridas e subtarefas
- Timer por tarefa com janela flutuante sempre visível
- Paleta de comandos para buscar e pular entre tarefas
- Temas, cor de destaque e fonte configuráveis

## Rodar e gerar o instalador

Pré-requisitos: Node.js 18+, Rust e os [pré-requisitos do Tauri](https://tauri.app/start/prerequisites/).

```bash
npm install
npm run tauri dev     # desenvolvimento
npm run tauri build   # gera src-tauri/target/release/bundle/nsis/lister_<versão>_x64-setup.exe
```

Os dados ficam em `%APPDATA%\com.lister.app\lister_data.bin` (JSON).

## Skill para o Claude

`claude-skill/lister/` é uma skill do Claude Code que lê e edita os boards (criar, editar, mover, concluir tarefas, colunas, notas). Precisa de Python 3 no PC.

Para instalar, rode dentro do Claude Code:

```
/plugin install lister --marketplace stocaline/lister
```

Em versões do Claude Code anteriores à 2.1.275, use dois comandos:

```
/plugin marketplace add stocaline/lister
/plugin install lister@lister
```

Depois é só pedir em português: "o que tem no quadro Casa?", "adiciona 'pagar luz' no Hoje com prioridade alta". O app recarrega os dados do disco quando a janela ganha foco, então as mudanças feitas pelo Claude aparecem ao clicar nele.
