---
name: lister
description: Lê e edita os dados do Lister (app desktop de kanban/notas do usuário, Tauri) — listar boards, ver colunas e tarefas, buscar, criar/editar/mover/concluir/apagar tarefas, subtarefas, tags, prioridade, tempo registrado, colunas, boards e blocos de notas. Use sempre que o usuário falar do Lister, "meus boards", "minhas tarefas do lister", "adiciona no lister", "o que tem no board X", "marca como feita", "move pra coluna Y", "anota no bloco de notas", mesmo sem citar o nome do app quando o contexto for as listas/boards pessoais dele. NÃO é para tickets do Innoup (use innoup-tickets).
---

# Lister

Os dados ficam em `%APPDATA%\com.lister.app\lister_data.bin` (JSON puro, apesar do .bin).
Toda leitura/escrita passa pelo script — nunca edite o arquivo à mão:

```
python ~/.claude/skills/lister/lister.py <comando> ...
```

Boards e colunas aceitam id ou título (sem diferenciar maiúsculas; prefixo único também vale).
Tarefas são sempre por id — pegue com `show`, `search` ou da saída de `add`.
Cada escrita guarda a versão anterior em `lister_data.bin.bak`.

## Comandos

Leitura:
- `boards` — todos os boards (`[board]` kanban ou `[notes]` bloco de notas)
- `show <board> [--all]` — colunas e tarefas (sem `--all` esconde concluídas); num bloco de notas imprime o texto
- `task <id>` — tarefa completa em JSON
- `search <texto>` — busca em título/descrição de tarefas e em notas

Tarefas:
- `add <board> <coluna> "<título>" [--priority low|medium|high] [--desc "..."] [--tags "a,b"] [--subtasks "s1;s2"] [--top]`
  Tags inexistentes são criadas no board com cor aleatória. Padrão: prioridade medium, final da coluna.
- `edit <id> [--content ..] [--priority ..] [--desc ..] [--tags "a,b" | --tags ""] [--add-subtask "x"]... [--check "x"]... [--uncheck "x"]... [--remove-subtask "x"]... [--time <minutos>]`
  Subtarefa por id ou texto exato. `--tags` substitui a lista inteira. `--time` sobrescreve o tempo registrado.
- `done <id>` / `undone <id>` — concluir para o timer, como no app
- `move <id> <coluna> [--position N]` — dentro do mesmo board
- `delete <id>`

Colunas e boards:
- `add-column <board> "<título>" [--desc ..]`, `edit-column <board> <coluna> [--title ..] [--desc ..]`, `delete-column <board> <coluna>` (apaga as tarefas dela)
- `add-board "<título>" [--columns "A,B,C"] [--notes]`, `rename-board <board> "<título>"`, `delete-board <board>`
- `notes <board> [--set "texto"] [--append "texto"]` — markdown do bloco de notas; sem flag, lê

## Regras

- **Confirme antes de apagar** (`delete`, `delete-column`, `delete-board`) dizendo o que será perdido. `delete-board`/`delete-column` levam junto todas as tarefas.
- Se um board/coluna der "ambíguo", use o id que o erro lista.
- O app aberto recarrega do disco quando a janela ganha foco, então as mudanças aparecem ao clicar nele. Exceção: se o usuário mexer no app (ou no timer flutuante) **sem** a janela principal ter ganho foco depois da sua escrita, o app pode sobrescrever. Na dúvida, diga ao usuário para clicar na janela do Lister.
- Não mexa em `isRunning`/`lastStartTime` (timer ao vivo) — isso é do app.
- Para mudanças em lote, rode vários comandos em sequência; cada um é atômico.
