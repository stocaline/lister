# Lister: Seu Quadro Kanban Pessoal

Lister é um quadro de tarefas interativo no estilo Kanban, projetado para ajudar a organizar suas tarefas de forma visual e intuitiva. Crie colunas, adicione cartões e gerencie seu fluxo de trabalho com uma interface simples de arrastar e soltar.

![Lister Screenshot](https://i.imgur.com/YOUR_SCREENSHOT_URL.png) 

---

## ✨ Funcionalidades

- **Gerenciamento de Colunas:** Crie, renomeie e exclua colunas para organizar seu trabalho.
- **Tarefas Detalhadas:** Adicione tarefas com conteúdo e marque-as como concluídas.
- **Arrastar e Soltar (Drag & Drop):** Reordene tarefas dentro de uma coluna ou mova-as facilmente entre colunas. Reorganize as próprias colunas no quadro.
- **Edição Rápida:** Dê um duplo clique no título do quadro, no título da coluna ou na descrição para editar diretamente.
- **Persistência Local:** Seu quadro é salvo automaticamente no armazenamento local do navegador, para que você não perca seu trabalho.
- **Importar e Exportar:** Exporte seu quadro inteiro para um arquivo JSON como backup ou para compartilhá-lo. Importe um quadro a qualquer momento.

---

## 🚀 Tecnologias Utilizadas

- **React:** Biblioteca principal para a construção da interface.
- **TypeScript:** Para um código mais seguro e manutenível.
- **Vite:** Build tool moderna e extremamente rápida.
- **Tailwind CSS:** Para estilização ágil e customizável.
- **dnd-kit:** Uma biblioteca leve e performática para funcionalidades de arrastar e soltar.

---

## ⚙️ Como Executar o Projeto

Siga os passos abaixo para executar o Lister em sua máquina local.

**Pré-requisitos:**
- [Node.js](https://nodejs.org/en/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/) (geralmente vem com o Node.js)

**Passos:**

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/stocaline/lister.git
   cd lister
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Abra no navegador:**
   Acesse `http://localhost:5173` (ou a porta indicada no seu terminal).

---

## 📖 Uso da Aplicação

- **Editar Títulos e Descrições:** Dê um duplo clique em qualquer título (quadro, coluna) ou descrição para entrar no modo de edição.
- **Mover Colunas:** Clique e arraste a área do título de uma coluna para reordená-la.
- **Mover Tarefas:** Clique e arraste um cartão de tarefa para outra posição na mesma coluna ou para uma coluna diferente.
- **Adicionar Itens:** Use os botões "+ Adicionar Coluna" e "+ Adicionar Tarefa".
- **Excluir Coluna:** Clique no "X" no canto superior direito de uma coluna.

---