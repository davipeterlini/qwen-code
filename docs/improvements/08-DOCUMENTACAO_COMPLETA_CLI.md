# 📚 Documentação Completa da CLI Qwen Code

> **Versão:** 0.10.2  
> **Última atualização:** Fevereiro de 2026  
> **Node.js:** >= 20.0.0

---

## 🎯 Índice

1. [Visão Geral](#visão-geral)
2. [Instalação](#instalação)
3. [Comandos Slash (/)](#comandos-slash-)
4. [Ferramentas Built-in](#ferramentas-built-in)
5. [Configuração e Settings](#configuração-e-settings)
6. [MCP (Model Context Protocol)](#mcp-model-context-protocol)
7. [Hooks System](#hooks-system)
8. [Comandos Customizados (JSON & Markdown)](#comandos-customizados-json--markdown)
9. [Plan Documents](#plan-documents)
10. [Context Window Usage](#context-window-usage)
11. [Skills e Subagents](#skills-e-subagents)
12. [Autenticação](#autenticação)
13. [Configuração de Modelos](#configuração-de-modelos)
14. [Flags e Linha de Comando](#flags-e-linha-de-comando)
15. [Extensões](#extensões)
16. [Resumo de Sessão](#resumo-de-sessão)
17. [Sandbox Mode](#sandbox-mode)
18. [Atalhos de Teclado](#atalhos-de-teclado)
19. [Approval Modes](#approval-modes)
20. [Internacionalização (i18n)](#internacionalização-i18n)
21. [Vim Mode](#vim-mode)
22. [Acessibilidade](#acessibilidade)
23. [Troubleshooting](#troubleshooting)

---

## Visão Geral

Qwen Code é um agente de IA open-source para terminal, otimizado para modelos **Qwen3-Coder**. Ele ajuda você a:

- ✅ Entender bases de código grandes
- ✅ Automatizar tarefas repetitivas
- ✅ Desenvolver mais rápido com assistência de IA
- ✅ Gerenciar projetos com spec-driven development

### Fluxo de Trabalho Agêntico

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Usuário   │────▶│  Qwen Code   │────▶│  Ferramentas │
│   Prompt    │     │    (Agente)  │     │  (Ações)     │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Subagents   │
                    │  (Delegação) │
                    └──────────────┘
```

---

## Instalação

### Instalação Rápida (Recomendado)

#### Linux / macOS

```bash
curl -fsSL https://qwen-code-assets.oss-cn-hangzhou.aliyuncs.com/installation/install-qwen.sh | bash
```

#### Windows (CMD como Administrador)

```cmd
curl -fsSL -o %TEMP%\install-qwen.bat https://qwen-code-assets.oss-cn-hangzhou.aliyuncs.com/installation/install-qwen.bat && %TEMP%\install-qwen.bat
```

### Instalação Manual

#### Via NPM

```bash
npm install -g @qwen-code/qwen-code@latest
```

#### Via Homebrew (macOS, Linux)

```bash
brew install qwen-code
```

### Pré-requisitos

- **Node.js:** >= 20.0.0
- **npm:** >= 7.0.0

---

## Comandos Slash (/)

### 📋 Session Management

#### `/help` ou `/?`

**Descrição:** Exibe ajuda e comandos disponíveis

```bash
/help
```

#### `/clear`, `/reset`, `/new`

**Descrição:** Limpa o histórico da conversa e libera contexto

```bash
/clear
```

#### `/compress` ou `/summarize`

**Descrição:** Comprime o contexto substituindo por um resumo para economizar tokens

```bash
/compress
```

#### `/stats` ou `/usage`

**Descrição:** Mostra estatísticas da sessão atual

```bash
/stats              # Estatísticas gerais
/stats model        # Estatísticas do modelo
/stats tools        # Estatísticas de ferramentas
```

#### `/quit` ou `/exit`

**Descrição:** Sai do Qwen Code

```bash
/quit
```

#### `/resume`

**Descrição:** Retoma uma sessão anterior (abre seletor)

```bash
/resume
```

#### `/restore [tool-call-id]`

**Descrição:** Restaura uma tool call para o estado anterior

```bash
/restore
/restore abc123
```

**Requisitos:** Checkpointing deve estar habilitado

---

### 🔐 Autenticação & Configuração

#### `/auth` ou `/login`

**Descrição:** Configura autenticação

```bash
/auth
```

**Métodos suportados:**

- Qwen OAuth (recomendado)
- API Key (OpenAI, Anthropic, Gemini)

#### `/model`

**Descrição:** Troca o modelo da sessão atual

```bash
/model
```

Abre diálogo de seleção de modelo.

#### `/settings`

**Descrição:** Visualiza e edita configurações

```bash
/settings
```

#### `/theme`

**Descrição:** Altera o tema da UI

```bash
/theme
```

#### `/editor`

**Descrição:** Define editor externo preferido

```bash
/editor
```

#### `/permissions`

**Descrição:** Gerencia configurações de confiança de pastas

```bash
/permissions
```

---

### 📁 Projeto & Contexto

#### `/init`

**Descrição:** Analisa o projeto e cria arquivo QWEN.md (ou GEMINI.md)

```bash
/init
```

**Comportamento:**

- Lê arquivos do projeto
- Gera documentação abrangente
- Cria `.qwen/QWEN.md`

#### `/context`

**Descrição:** Exibe uso da janela de contexto e breakdown de tokens

```bash
/context
```

**Exibe:**

- Uso de tokens por categoria
- Barra de progresso visual
- Dicas de otimização

#### `/memory`

**Descrição:** Gerencia arquivos de memória do projeto

```bash
/memory
```

#### `/directory` ou `/dir`

**Descrição:** Gerencia diretórios do workspace

```bash
/directory add /path/to/dir1, /path/to/dir2
/directory show
```

**Subcomandos:**

- `add` - Adiciona diretórios (vírgula-separados)
- `show` - Lista diretórios atuais

#### `/summary`

**Descrição:** Gera resumo do projeto e salva em `.qwen/PROJECT_SUMMARY.md`

```bash
/summary
```

---

### 🔧 MCP (Model Context Protocol)

#### `/mcp <subcomando> [opções]`

**Descrição:** Gerencia servidores e ferramentas MCP

```bash
/mcp list              # Lista servidores configurados
/mcp list tools        # Lista todas as ferramentas MCP
/mcp add <server-id>   # Adiciona novo servidor
/mcp remove <id>       # Remove servidor
/mcp enable <id>       # Habilita servidor desabilitado
/mcp disable <id>      # Desabilita servidor (mantém config)
/mcp load <id>         # Carrega servidor sob demanda
/mcp unload <id>       # Descarrega servidor para liberar tokens
/mcp discover          # Descobre ferramentas de todos servidores
/mcp marketplace [id]  # Navega marketplace MCP
/mcp stats             # Mostra estatísticas MCP
```

**Exemplo de configuração:**

```json
{
  "servers": [
    {
      "id": "context7",
      "name": "Context7",
      "command": "npx -y @upstash/context7-mcp",
      "enabled": true,
      "dynamic": true
    }
  ],
  "dynamicLoading": true
}
```

---

### 🤖 Skills & Agents

#### `/skills`

**Descrição:** Lista skills disponíveis ou invoca skill específica

```bash
/skills                # Lista todas skills
/skills <nome-skill>   # Invoca skill específica
```

**Features:**

- Busca fuzzy por nome
- Auto-complete

#### `/agents`

**Descrição:** Gerencia subagents para delegação de tarefas

```bash
/agents manage         # Gerencia subagents existentes
/agents create         # Cria novo subagent
```

**Subcomandos:**

- `manage` - Abre diálogo de lista de subagents
- `create` - Abre diálogo de criação

---

### 📋 Planning

#### `/plans <subcomando>`

**Descrição:** Gerencia documentos de plano para spec-driven development

```bash
/plans list                    # Lista todos planos
/plans show <plan-id>          # Mostra detalhes de plano
/plans create "Título"         # Cria novo plano
/plans update <plan-id>        # Atualiza plano
/plans delete <plan-id>        # Deleta plano
```

**Estrutura de plano:**

```json
{
  "id": "plano-id",
  "title": "Título do Plano",
  "description": "Descrição detalhada",
  "status": "draft | in_progress | completed | abandoned",
  "steps": [
    {
      "id": "step-1",
      "description": "Descrição do passo",
      "status": "pending | in_progress | completed | skipped"
    }
  ]
}
```

---

### 🛠️ Ferramentas & Extensões

#### `/tools`

**Descrição:** Lista ferramentas disponíveis

```bash
/tools              # Lista ferramentas
/tools desc         # Lista com descrições
```

#### `/extensions`

**Descrição:** Gerencia extensões do Qwen Code

```bash
/extensions list
/extensions install <nome>
/extensions enable <nome>
```

---

### 🔧 Utilitários

#### `/export <formato>`

**Descrição:** Exporta histórico da sessão para arquivo

```bash
/export md          # Exporta para Markdown
/export html        # Exporta para HTML
/export json        # Exporta para JSON
/export jsonl       # Exporta para JSONL
```

#### `/copy`

**Descrição:** Copia último resultado ou snippet para clipboard

```bash
/copy
```

#### `/docs`

**Descrição:** Abre documentação completa no navegador

```bash
/docs
```

#### `/bug`

**Descrição:** Submete bug report

```bash
/bug [descrição]
```

**Comportamento:** Abre issue no GitHub com informações do sistema

#### `/status` ou `/about`

**Descrição:** Mostra versão e informações do sistema

```bash
/status
```

---

### ⚙️ Comandos Adicionais

#### `/rewind`

**Descrição:** Retrocede histórico da conversa

```bash
/rewind
```

#### `/vim`

**Descrição:** Toggle Vim mode

```bash
/vim
```

#### `/language`

**Descrição:** Altera idioma da UI

```bash
/language
```

#### `/approval-mode`

**Descrição:** Configura modo de aprovação para tool execution

```bash
/approval-mode
```

#### `/ide`

**Descrição:** Comandos de integração com IDE

```bash
/ide
```

---

## Ferramentas Built-in

### 📄 File Operations

#### `ReadFile`

**Descrição:** Lê e retorna conteúdo de arquivo

**Parâmetros:**

- `absolute_path` (obrigatório): Caminho absoluto do arquivo
- `offset` (opcional): Linha inicial
- `limit` (opcional): Número de linhas

**Suporta:** Texto, imagens (PNG, JPG, GIF, WEBP, SVG, BMP), PDF

**Exemplo:**

```
ReadFile: /path/to/file.ts, offset=0, limit=50
```

#### `WriteFile`

**Descrição:** Escreve conteúdo em arquivo

**Parâmetros:**

- `file_path` (obrigatório): Caminho absoluto
- `content` (obrigatório): Conteúdo a escrever

**Features:**

- Suporta modificação do usuário
- Mostra diff para confirmação

#### `Edit`

**Descrição:** Edita arquivos com search and replace

**Parâmetros:**

- `file_path`: Caminho do arquivo
- `original_text`: Texto original
- `new_text`: Texto novo

---

### 🔍 Search Operations

#### `Glob`

**Descrição:** Busca rápida de arquivos por padrão

**Parâmetros:**

- `pattern`: Padrão glob (ex: `**/*.ts`)
- `path`: Diretório base

#### `Grep` / `RipGrep`

**Descrição:** Busca de conteúdo usando ripgrep

**Parâmetros:**

- `pattern`: Regex pattern
- `path`: Diretório
- `include`: Padrão de arquivos

#### `Ls`

**Descrição:** Lista conteúdo de diretório

**Parâmetros:**

- `path`: Caminho do diretório
- `recursive`: Busca recursiva

---

### 💻 Shell & Execution

#### `Shell` (run_shell_command)

**Descrição:** Executa comandos shell

**Parâmetros:**

- `command` (obrigatório): Comando bash
- `is_background` (opcional): Executa em background
- `timeout` (opcional): Timeout em ms (max 600000)
- `description` (opcional): Descrição breve
- `directory` (opcional): Diretório de trabalho

**Features:**

- Execução foreground/background
- Timeout handling
- Command allowlisting
- Suporte a Co-authored-by no git

**Exemplo:**

```
Shell: npm install, is_background=false, timeout=120000
```

---

### 🤖 Task & Agent Tools

#### `Task` (Subagent)

**Descrição:** Cria e gerencia subagents para delegação

**Parâmetros:**

- `description`: Descrição da tarefa
- `tools`: Ferramentas permitidas
- `model`: Modelo a usar

#### `Skill`

**Descrição:** Executa skills predefinidas

**Parâmetros:**

- `skill_name`: Nome da skill
- `arguments`: Argumentos

#### `TodoWrite`

**Descrição:** Gerencia listas de tarefas

**Parâmetros:**

- `todos`: Lista de todos

---

### 🔌 MCP Tools

#### `McpTool`

**Descrição:** Executa ferramentas de servidores MCP

**Parâmetros:**

- `server_id`: ID do servidor
- `tool_name`: Nome da tool
- `arguments`: Argumentos da tool

---

### 🌐 Other Tools

#### `Memory`

**Descrição:** Gerencia memória do projeto

#### `WebFetch`

**Descrição:** Busca conteúdo web

#### `Lsp` (Language Server Protocol)

**Descrição:** Integração LSP para code intelligence

#### `ExitPlanMode`

**Descrição:** Sai do plan mode

---

## Configuração e Settings

### 📁 Arquivos de Configuração

| Arquivo                 | Escopo           | Descrição                      |
| ----------------------- | ---------------- | ------------------------------ |
| `~/.qwen/settings.json` | Usuário (global) | Aplica a todas sessões         |
| `.qwen/settings.json`   | Projeto          | Aplica apenas ao projeto atual |

### ⚙️ Schema de Settings

#### General Settings (`general.*`)

```json
{
  "general": {
    "preferredEditor": "vscode",
    "vimMode": false,
    "enableAutoUpdate": true,
    "gitCoAuthor": true,
    "checkpointing": {
      "enabled": true
    },
    "debugKeystrokeLogging": false,
    "language": "auto",
    "outputLanguage": "en",
    "terminalBell": true,
    "chatRecording": true,
    "defaultFileEncoding": "utf-8"
  }
}
```

**Campos:**

- `preferredEditor` - Editor preferido para abrir arquivos
- `vimMode` - Habilita keybindings Vim
- `enableAutoUpdate` - Habilita atualizações automáticas
- `gitCoAuthor` - Adiciona Co-authored-by em commits git
- `checkpointing.enabled` - Habilita checkpoint de sessão
- `debugKeystrokeLogging` - Log de keystrokes para debug
- `language` - Idioma da UI (auto, ou códigos custom)
- `outputLanguage` - Idioma de output do LLM
- `terminalBell` - Toca sino ao completar
- `chatRecording` - Habilita salvamento de histórico
- `defaultFileEncoding` - Encoding padrão (utf-8, utf-8-bom)

#### UI Settings (`ui.*`)

```json
{
  "ui": {
    "theme": "dark",
    "customThemes": {},
    "hideWindowTitle": false,
    "showStatusInTitle": true,
    "hideTips": false,
    "showLineNumbers": true,
    "showCitations": true,
    "customWittyPhrases": [],
    "enableWelcomeBack": true,
    "enableUserFeedback": true,
    "accessibility": {
      "enableLoadingPhrases": true,
      "screenReader": false
    }
  }
}
```

#### Model Settings (`model.*`)

```json
{
  "model": {
    "name": "qwen3-coder-plus",
    "maxSessionTurns": -1,
    "summarizeToolOutput": true,
    "chatCompression": {
      "contextPercentageThreshold": 0.8
    },
    "sessionTokenLimit": 200000,
    "skipNextSpeakerCheck": false,
    "skipLoopDetection": false,
    "skipStartupContext": false,
    "enableOpenAILogging": false,
    "generationConfig": {
      "timeout": 30000,
      "maxRetries": 3,
      "enableCacheControl": true,
      "schemaCompliance": "auto",
      "contextWindowSize": 256000
    }
  }
}
```

#### Context Settings (`context.*`)

```json
{
  "context": {
    "fileName": "QWEN.md",
    "importFormat": "tree",
    "includeDirectories": [],
    "loadFromIncludeDirectories": false,
    "fileFiltering": {
      "respectGitIgnore": true,
      "respectQwenIgnore": true,
      "enableRecursiveFileSearch": true,
      "enableFuzzySearch": true
    }
  }
}
```

#### Tools Settings (`tools.*`)

```json
{
  "tools": {
    "sandbox": "docker",
    "shell": {
      "enableInteractiveShell": true,
      "pager": "cat",
      "showColor": true
    },
    "allowed": ["*"],
    "autoAccept": false,
    "exclude": [],
    "core": ["ReadFile", "WriteFile", "Shell"],
    "useRipgrep": true,
    "approvalMode": "default"
  }
}
```

#### MCP Settings (`mcp.*`, `mcpServers.*`)

```json
{
  "mcp": {
    "servers": [],
    "allowed": ["*"],
    "excluded": [],
    "dynamicLoading": true,
    "tokenBudget": 50000
  }
}
```

#### Security Settings (`security.*`)

```json
{
  "security": {
    "auth": {
      "selectedType": "openai",
      "useExternal": false,
      "enforcedType": null,
      "apiKey": null
    },
    "folderTrust": {
      "featureEnabled": true,
      "enabled": true
    }
  }
}
```

#### IDE Settings (`ide.*`)

```json
{
  "ide": {
    "enabled": true,
    "hasSeenNudge": false
  }
}
```

#### Privacy Settings (`privacy.*`)

```json
{
  "privacy": {
    "usageStatisticsEnabled": true
  }
}
```

#### Telemetry Settings (`telemetry.*`)

```json
{
  "telemetry": {
    "target": "local",
    "otlpEndpoint": "http://localhost:4317",
    "otlpProtocol": "grpc",
    "logPrompts": true,
    "outfile": null
  }
}
```

#### Advanced Settings (`advanced.*`)

```json
{
  "advanced": {
    "autoConfigureMemory": true,
    "bugCommand": {
      "url": "https://github.com/QwenLM/qwen-code/issues/new"
    },
    "dnsResolutionOrder": "ipv4first",
    "excludedEnvVars": [],
    "tavilyApiKey": null
  }
}
```

---

## MCP (Model Context Protocol)

### 📋 Visão Geral

MCP permite conectar a ferramentas e serviços externos através de protocolo padronizado.

**Arquivos de Implementação:**

- `packages/core/src/mcp/MCPRegistry.ts`
- `packages/core/src/mcp/MCPConfigManager.ts`
- `packages/core/src/mcp/DynamicMCPLoader.ts`
- `packages/core/src/mcp/MCPMarketplace.ts`
- `packages/core/src/mcp/MCPOAuthManager.ts`

### 🎯 Features

#### Server Configuration

- **Transport Types:** stdio, SSE, WebSocket
- **Dynamic Loading:** Carrega servidores sob demanda para economizar tokens
- **Token Budget:** Budget configurável (padrão 50,000)
- **Auto-discovery:** Descobre ferramentas de servidores

#### Server Management

- Adicionar/remover servidores
- Habilitar/desabilitar servidores
- Carregar/descarregar servidores dinamicamente
- Ver estatísticas de servidores

#### OAuth Support

- Gerenciamento de tokens OAuth
- Armazenamento de tokens (file, keychain, hybrid)
- Service account impersonation
- Google Auth provider

### 📦 MCP Server Schema

```json
{
  "id": "server-id",
  "name": "Server Name",
  "command": "npx -y @modelcontextprotocol/server-example",
  "args": [],
  "env": {},
  "url": "http://localhost:3000",
  "transport": "stdio",
  "enabled": true,
  "dynamic": true,
  "timeout": 30000,
  "description": "Descrição do servidor"
}
```

### 🚀 Servidores Disponíveis

| Servidor       | Comando                                          | Uso                 | Tokens |
| -------------- | ------------------------------------------------ | ------------------- | ------ |
| **Context7**   | `npx -y @upstash/context7-mcp`                   | Docs de bibliotecas | ~3,000 |
| **GitHub**     | `npx -y @modelcontextprotocol/server-github`     | Issues, PRs, código | ~2,500 |
| **Filesystem** | `npx -y @modelcontextprotocol/server-filesystem` | Arquivos locais     | ~1,500 |
| **PostgreSQL** | `npx -y @modelcontextprotocol/server-postgres`   | Banco de dados      | ~1,800 |
| **Slack**      | `npx -y @modelcontextprotocol/server-slack`      | Mensagens Slack     | ~1,200 |
| **Notion**     | `npx -y @modelcontextprotocol/server-notion`     | Páginas Notion      | ~1,500 |
| **Puppeteer**  | `npx -y @modelcontextprotocol/server-puppeteer`  | Navegar websites    | ~2,000 |
| **Memory**     | `npx -y @modelcontextprotocol/server-memory`     | Memória longo prazo | ~1,000 |

### 💡 Economia de Tokens

#### Carregamento Estático vs Dinâmico

| Método       | Tokens/Dia | Tokens/Semana | Economia |
| ------------ | ---------- | ------------- | -------- |
| **Estático** | 8,800      | 61,600        | -        |
| **Dinâmico** | 2,200      | 15,400        | **75%**  |

---

## Hooks System

### 📋 Visão Geral

Hooks de automação que rodam em pontos específicos do ciclo de vida da sessão.

**Arquivo:** `packages/cli/src/services/HooksManager.ts`

### 🔔 Hooks Disponíveis

| Hook Name            | Trigger                         |
| -------------------- | ------------------------------- |
| `onSessionStart`     | Quando sessão inicia            |
| `onPromptSubmit`     | Antes de submeter prompt        |
| `onResponse`         | Após receber resposta do modelo |
| `onToolCall`         | Antes de executar tool          |
| `onToolComplete`     | Após executar tool              |
| `onSessionEnd`       | Quando sessão termina           |
| `onFileEdit`         | Antes de editar arquivo         |
| `onFileEditComplete` | Após editar arquivo             |

### ⚙️ Configuração

**Arquivo:** `~/.qwen/hooks.json` ou `.qwen/hooks.json`

```json
{
  "hooks": {
    "onSessionStart": {
      "enabled": true,
      "script": "./scripts/on-start.sh",
      "timeout": 30000,
      "continueOnError": false
    },
    "onToolCall": {
      "enabled": true,
      "script": "echo 'Tool chamada: $QWEN_TOOL_NAME'",
      "timeout": 10000,
      "continueOnError": true
    },
    "onFileEdit": {
      "enabled": true,
      "script": "cp \"$QWEN_FILE_PATH\" \"$QWEN_FILE_PATH.bak\"",
      "timeout": 10000,
      "continueOnError": true
    }
  }
}
```

### 🌍 Variáveis de Ambiente

Hooks recebem contexto via variáveis de ambiente:

- `QWEN_HOOK_NAME` - Nome do hook
- `QWEN_PROJECT_ROOT` - Caminho do projeto
- `QWEN_PROMPT` - Prompt submetido (onPromptSubmit)
- `QWEN_TOOL_NAME` - Tool chamada (onToolCall)
- `QWEN_FILE_PATH` - Arquivo sendo editado (onFileEdit)
- `QWEN_SESSION_DURATION` - Duração da sessão em ms (onSessionEnd)

### 💡 Exemplos de Uso

#### Log de Sessões

```json
{
  "hooks": {
    "onSessionStart": {
      "enabled": true,
      "script": "echo \"[$(date)] Session started\" >> ~/.qwen/sessions.log"
    },
    "onSessionEnd": {
      "enabled": true,
      "script": "echo \"[$(date)] Session ended ($QWEN_SESSION_DURATION ms)\" >> ~/.qwen/sessions.log"
    }
  }
}
```

#### Backup Automático

```json
{
  "hooks": {
    "onFileEdit": {
      "enabled": true,
      "script": "cp \"$QWEN_FILE_PATH\" \"$QWEN_FILE_PATH.backup.$(date +%s)\"",
      "timeout": 10000,
      "continueOnError": true
    }
  }
}
```

---

## Comandos Customizados (JSON & Markdown)

### 📄 JSON Commands

**Arquivo:** `packages/cli/src/services/JsonCommandLoader.ts`

**Configuração:** `.qwen/commands.json` ou `~/.qwen/commands.json`

```json
{
  "commands": {
    "test": {
      "description": "Rodar testes",
      "prompt": "Execute a suíte de testes deste projeto",
      "tools": ["Shell"],
      "autoApprove": false
    },
    "review": {
      "description": "Code review",
      "prompt": "Revise o código em busca de bugs, qualidade e melhorias",
      "tools": ["ReadFile", "Glob"]
    },
    "explain": {
      "description": "Explicar código",
      "prompt": "Explique o código selecionado em detalhes"
    }
  }
}
```

### 📝 Markdown Commands

**Arquivo:** `packages/cli/src/services/MarkdownCommandLoader.ts`

**Configuração:** `.qwen/commands/` ou `~/.qwen/commands/`

```markdown
---
name: test
description: Rodar testes
allowedTools:
  - Shell
---

Execute a suíte de testes deste projeto.

Argumentos: $ARGUMENTS
Posicional: $1, $2, $3
Named: $--flag
```

### ✨ Features

- **Substituição de variáveis:** `$ARGUMENTS`, `$1`, `$2`, `$--flag`
- **Restrições de tools:** Lista de tools permitidas
- **Shell mode:** Suporte a modo shell
- **Working directory:** Configuração de diretório

### 💡 Exemplo de Uso

```bash
# Criar comando customizado
echo '{
  "commands": {
    "deploy": {
      "description": "Deploy para produção",
      "prompt": "Execute o deploy para produção com validações",
      "tools": ["Shell"]
    }
  }
}' > .qwen/commands.json

# Usar no Qwen
/deploy
```

---

## Plan Documents

### 📋 Visão Geral

Spec-driven development com documentos de plano.

**Arquivo:** `packages/cli/src/services/PlanDocumentsManager.ts`

### 📦 Estrutura de Plano

```json
{
  "id": "plano-id",
  "title": "Título do Plano",
  "description": "Descrição detalhada do objetivo",
  "status": "draft | in_progress | completed | abandoned",
  "steps": [
    {
      "id": "step-1",
      "description": "Descrição do passo",
      "status": "pending | in_progress | completed | skipped",
      "completedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

### 🎯 Comandos

```bash
/plans list                    # Lista todos planos
/plans show <id>               # Mostra detalhes
/plans create "Título"         # Cria novo plano
/plans update <id>             # Atualiza plano
/plans delete <id>             # Deleta plano
```

### 💡 Exemplo de Workflow

```bash
# 1. Criar plano
/plans create "Implementar autenticação OAuth"

# 2. O Qwen ajuda a criar plano estruturado com:
#    - Descrição do objetivo
#    - Passos detalhados
#    - Critérios de aceite

# 3. Acompanhar progresso
/plans show implementar-autenticacao-oauth-xyz

# 4. Atualizar status (via interação com Qwen)
```

### 📁 Armazenamento

- **Linux/macOS:** `~/.qwen/plans/`
- **Windows:** `%USERPROFILE%\\.qwen\\plans\\`

Cada plano é um arquivo JSON separado com índice central.

---

## Context Window Usage

### 📊 Visão Geral

Acompanhe e exiba uso de tokens em diferentes categorias.

**Arquivo:** `packages/cli/src/ui/commands/contextCommand.ts`

### 📈 Categorias de Tokens

| Categoria         | Típico   | Descrição                 |
| ----------------- | -------- | ------------------------- |
| **System Prompt** | ~2,500   | Prompt do sistema         |
| **Tools**         | ~8,200   | Ferramentas disponíveis   |
| **MCP Tools**     | Variável | Servidores MCP carregados |
| **Memory Files**  | Variável | Arquivos QWEN.md          |
| **Messages**      | Variável | Histórico de conversa     |

### 🔢 Limites de Tokens por Modelo

| Modelo           | Input     | Output |
| ---------------- | --------- | ------ |
| qwen3-coder-plus | 256,000   | 32,000 |
| qwen3.5-plus     | 256,000   | 32,000 |
| claude-sonnet-4  | 200,000   | 64,000 |
| gemini-2.5-pro   | 2,000,000 | 64,000 |
| gpt-4o           | 128,000   | 16,384 |

### 📊 Exemplo de Output

```
╔═══════════════════════════════════════════════════════════╗
║  📊 CONTEXT WINDOW USAGE                      45.2% used  ║
╠═══════════════════════════════════════════════════════════╣
║  Model: qwen3-coder-plus                                  ║
╠═══════════════════════════════════════════════════════════╣
║  ██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░             ║
╠═══════════════════════════════════════════════════════════╣
║  BREAKDOWN:                                               ║
║  ├─ System Prompt:    2,500 tokens (  1.0%)               ║
║  ├─ Tools:            8,200 tokens (  3.2%)               ║
║  ├─ MCP Tools:            0 tokens (  0.0%)               ║
║  ├─ Memory Files:     1,100 tokens (  0.4%)  (2 files)    ║
║  ├─ Messages:        98,500 tokens ( 38.4%)               ║
╠═══════════════════════════════════════════════════════════╣
║  TOTAL USED:         110,300 / 256,000 tokens             ║
║  AVAILABLE:          145,700 tokens remaining             ║
║  OUTPUT LIMIT:        32,000 tokens                       ║
╚═══════════════════════════════════════════════════════════╝

Tip: Use /memory show to view memory content, /compress to compact history.
```

### ✨ Features

- Barra de progresso visual
- Breakdown percentual
- Status de servidores MCP
- Dicas de otimização

---

## Skills e Subagents

### 🎯 Skills

**Arquivo:** `packages/core/src/tools/skill.ts`

Skills são workflows predefinidos que podem ser invocados por nome.

**Comando:** `/skills [nome-skill]`

**Exemplo:**

```bash
/skills
/skills code-review
```

### 🤖 Subagents

**Arquivos:**

- `packages/core/src/subagents/subagent.ts`
- `packages/cli/src/ui/commands/agentsCommand.ts`

#### Features

- ✅ Criar subagents especializados
- ✅ Delegar tarefas para subagents
- ✅ Acompanhar execução de subagents
- ✅ Configurar tools disponíveis para subagents

#### Configuração de Subagent

- Nome e descrição
- Prompt da tarefa
- Tool allowlist
- Configuração de modelo
- Limites de turns
- Limites de tempo

#### Estatísticas de Subagent

- Rounds executados
- Tool calls (sucesso/falha)
- Uso de tokens
- Duração

#### 💡 Exemplo de Uso

```bash
# Criar subagent especializado
/agents create

# O Qwen abre diálogo para:
# 1. Nome do subagent
# 2. Descrição da especialização
# 3. Tools permitidas
# 4. Modelo a usar

# Delegar tarefa
"Por favor, use o subagent de testes para gerar testes unitários"
```

---

## Autenticação

### 🔐 Visão Geral

Múltiplos métodos de autenticação suportados.

**Arquivo:** `packages/cli/src/config/auth.ts`

### Métodos de Auth

#### Qwen OAuth (Recomendado)

- ✅ Sign in com conta qwen.ai
- ✅ 1,000 requisições grátis/dia
- ✅ Fluxo OAuth via browser
- ✅ Credenciais cacheadas localmente

**Configuração:**

```bash
# Dentro do Qwen Code
/auth
# Escolha "Qwen OAuth"
```

#### API Key Authentication

**OpenAI-compatible** (OpenAI, Dashscope, ModelScope, OpenRouter)

- Environment: `OPENAI_API_KEY`, `DASHSCOPE_API_KEY`
- Settings: `settings.security.auth.apiKey`
- Config: `modelProviders.openai[].envKey`

**Anthropic**

- Environment: `ANTHROPIC_API_KEY`
- Requer: `baseUrl` no config modelProviders

**Gemini**

- Environment: `GEMINI_API_KEY`
- Settings: `settings.security.auth.apiKey`

**Vertex AI**

- Environment: `GOOGLE_API_KEY`
- Sets: `GOOGLE_GENAI_USE_VERTEXAI=true`

### 📊 Prioridade de Configuração

1. Comandos `export` no shell
2. Arquivos `.env`
3. `settings.json` → `env`
4. `settings.security.auth.apiKey`

### 💡 Exemplo de Configuração

```json
{
  "security": {
    "auth": {
      "selectedType": "openai"
    }
  },
  "modelProviders": {
    "openai": [
      {
        "id": "qwen3-coder-plus",
        "name": "qwen3-coder-plus",
        "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "envKey": "DASHSCOPE_API_KEY"
      }
    ]
  },
  "env": {
    "DASHSCOPE_API_KEY": "sk-xxxxxxxxxxxxx"
  }
}
```

---

## Configuração de Modelos

### 🎯 Métodos de Configuração

1. **settings.json** (Recomendado)
   - `~/.qwen/settings.json` (global)
   - `.qwen/settings.json` (projeto)

2. **Flags CLI**
   - `-m, --model <model>` - Especifica modelo
   - `--auth-type <type>` - Especifica tipo de auth

3. **Variáveis de Ambiente**
   - `QWEN_MODEL` - Modelo padrão
   - `QWEN_AUTH_TYPE` - Tipo de auth

### 📦 Model Providers Configuration

```json
{
  "modelProviders": {
    "openai": [
      {
        "id": "gpt-4o",
        "name": "GPT-4o",
        "envKey": "OPENAI_API_KEY",
        "baseUrl": "https://api.openai.com/v1"
      }
    ],
    "anthropic": [
      {
        "id": "claude-sonnet-4-20250514",
        "name": "Claude Sonnet 4",
        "envKey": "ANTHROPIC_API_KEY",
        "baseUrl": "https://api.anthropic.com"
      }
    ],
    "gemini": [
      {
        "id": "gemini-2.5-pro",
        "name": "Gemini 2.5 Pro",
        "envKey": "GEMINI_API_KEY"
      }
    ]
  },
  "model": {
    "name": "gpt-4o"
  },
  "security": {
    "auth": {
      "selectedType": "openai"
    }
  }
}
```

### ⚙️ Generation Configuration

```json
{
  "model": {
    "generationConfig": {
      "timeout": 30000,
      "maxRetries": 3,
      "enableCacheControl": true,
      "schemaCompliance": "auto",
      "contextWindowSize": 256000
    }
  }
}
```

### 💡 Exemplos de Configuração

#### Thinking Mode (para modelos suportados)

```json
{
  "modelProviders": {
    "openai": [
      {
        "id": "qwen3.5-plus",
        "name": "qwen3.5-plus (thinking)",
        "envKey": "DASHSCOPE_API_KEY",
        "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "generationConfig": {
          "extra_body": {
            "enable_thinking": true
          }
        }
      }
    ]
  }
}
```

#### Múltiplos Providers

```json
{
  "modelProviders": {
    "openai": [
      {
        "id": "gpt-4o",
        "name": "GPT-4o",
        "envKey": "OPENAI_API_KEY"
      }
    ],
    "anthropic": [
      {
        "id": "claude-sonnet-4-20250514",
        "name": "Claude Sonnet 4",
        "envKey": "ANTHROPIC_API_KEY"
      }
    ]
  },
  "env": {
    "OPENAI_API_KEY": "sk-xxx",
    "ANTHROPIC_API_KEY": "sk-ant-xxx"
  }
}
```

---

## Flags e Linha de Comando

### 🚩 Flags Principais

| Flag                    | Alias | Descrição                     |
| ----------------------- | ----- | ----------------------------- |
| `--model`               | `-m`  | Modelo a usar                 |
| `--prompt`              | `-p`  | Prompt não-interativo         |
| `--prompt-interactive`  | `-i`  | Interativo com prompt inicial |
| `--sandbox`             | `-s`  | Rodar em sandbox              |
| `--sandbox-image`       |       | URI da imagem sandbox         |
| `--debug`               | `-d`  | Modo debug                    |
| `--yolo`                |       | Auto-aprovar todas tools      |
| `--approval-mode`       |       | Modo de aprovação             |
| `--checkpointing`       |       | Habilitar checkpointing       |
| `--telemetry`           |       | Habilitar telemetry           |
| `--include-directories` |       | Diretórios adicionais         |
| `--exclude-tools`       |       | Excluir tools específicas     |
| `--core-tools`          |       | Apenas core tools             |
| `--auth-type`           |       | Tipo de auth                  |
| `--screen-reader`       |       | Modo screen reader            |
| `--input-format`        |       | Formato de input              |
| `--output-format`       |       | Formato de output             |
| `--chat-recording`      |       | Habilitar gravação de chat    |
| `--continue`            |       | Continuar última sessão       |
| `--resume`              |       | Retomar sessão específica     |
| `--session-id`          |       | Especificar session ID        |
| `--max-session-turns`   |       | Máximo de turns               |
| `--extensions`          |       | Carregar extensões            |
| `--proxy`               |       | URL do proxy                  |

### 💻 Comandos

| Comando                        | Descrição                  |
| ------------------------------ | -------------------------- |
| `qwen`                         | Launch interactive CLI     |
| `qwen [query]`                 | One-shot query             |
| `qwen -p "prompt"`             | Modo não-interativo        |
| `qwen extensions <subcommand>` | Gerenciamento de extensões |
| `qwen mcp <subcommand>`        | Gerenciamento de MCP       |

### 💡 Exemplos de Uso

```bash
# Modo interativo
qwen

# One-shot query
qwen "Explique a estrutura deste projeto"

# Modo não-interativo
qwen -p "Gere testes para src/utils.ts"

# Com modelo específico
qwen -m qwen3-coder-plus

# Com YOLO mode (auto-aprova tudo)
qwen --yolo -p "Refatore este módulo"

# Retomar sessão anterior
qwen --resume

# Com sandbox
qwen --sandbox
```

---

## Extensões

### 📋 Visão Geral

Extensões permitem adicionar funcionalidades customizadas.

**Arquivos:** `packages/cli/src/commands/extensions/`

### 🎯 Comandos de Extensão

| Comando                       | Descrição                   |
| ----------------------------- | --------------------------- |
| `extensions new <path>`       | Criar nova extensão         |
| `extensions link <path>`      | Link para desenvolvimento   |
| `extensions install <name>`   | Instalar extensão           |
| `extensions uninstall <name>` | Desinstalar extensão        |
| `extensions list`             | Listar extensões instaladas |
| `extensions enable <name>`    | Habilitar extensão          |
| `extensions disable <name>`   | Desabilitar extensão        |
| `extensions update <name>`    | Atualizar extensão          |
| `extensions settings <name>`  | Settings da extensão        |

### 📦 Estrutura de Extensão

```
minha-extensao/
├── qwen-extension.json    # Manifesto
├── src/
│   └── index.ts           # Código principal
└── package.json           # Dependências
```

### 💡 Exemplo de Extensão

**qwen-extension.json:**

```json
{
  "name": "minha-extensao",
  "version": "1.0.0",
  "description": "Minha extensão customizada",
  "main": "src/index.ts",
  "commands": {
    "meu-comando": {
      "description": "Descrição do comando"
    }
  }
}
```

---

## Resumo de Sessão

### ✨ Features

- ✅ Salvamento automático de sessão
- ✅ Diálogo seletor de sessão
- ✅ Continuar conversas anteriores
- ✅ Especificação de session ID

### 🎯 Comandos

- `--continue` - Continuar última sessão
- `--resume <session-id>` - Retomar sessão específica
- `--resume` (vazio) - Mostrar seletor
- `/resume` - Retomar de dentro da sessão

### 📁 Armazenamento

- **Sessões:** `.qwen/sessions/`
- **Checkpoints:** `.qwen/checkpoints/`

---

## Sandbox Mode

### 📋 Visão Geral

Execute comandos em ambiente sandbox isolado.

**Arquivo:** `packages/cli/src/config/sandboxConfig.ts`

### 🚩 Opções

- `--sandbox` - Habilitar sandbox
- `--sandbox-image` - Imagem sandbox customizada

### 🎯 Modos

- **Docker sandbox**
- **Podman sandbox**
- **No sandbox** (execução nativa)

### 💡 Exemplo

```bash
# Com Docker sandbox
qwen --sandbox

# Com imagem customizada
qwen --sandbox-image ghcr.io/qwenlm/qwen-code:latest
```

---

## Atalhos de Teclado

| Atalho    | Ação                          |
| --------- | ----------------------------- |
| `Ctrl+C`  | Cancelar operação atual       |
| `Ctrl+D`  | Sair (em linha vazia)         |
| `Up/Down` | Navegar histórico de comandos |
| `Tab`     | Auto-complete                 |

---

## Approval Modes

### 🎯 Modos

| Modo        | Descrição                       |
| ----------- | ------------------------------- |
| `plan`      | Mostra plano antes de executar  |
| `default`   | Pergunta para cada tool         |
| `auto-edit` | Auto-aprovar edição de arquivos |
| `yolo`      | Auto-aprovar todas tools        |

### ⚙️ Configuração

- **CLI:** `--approval-mode <mode>`
- **Settings:** `tools.approvalMode`
- **Comando:** `/approval-mode`

### 💡 Exemplo

```bash
# YOLO mode (auto-aprova tudo)
qwen --yolo

# Plan mode (mostra plano)
qwen --approval-mode plan

# Auto-edit mode
qwen --approval-mode auto-edit
```

---

## Internacionalização (i18n)

### 🌍 Idiomas Suportados

- English (padrão)
- Chinese (zh)
- German (de)
- French (fr)
- Japanese (ja)
- Russian (ru)
- Portuguese (pt-BR)

### ⚙️ Configuração

- **Settings:** `general.language`
- **Comando:** `/language`
- **Locales custom:** `~/.qwen/locales/`

---

## Vim Mode

### ✨ Features

- ✅ Keybindings Vim no input
- ✅ Modos Normal/Insert
- ✅ Comandos de navegação

### ⚙️ Configuração

- **Settings:** `general.vimMode`
- **Comando:** `/vim`

---

## Acessibilidade

### ✨ Features

- ✅ Modo screen reader
- ✅ Toggle de loading phrases
- ✅ Opção de output plain-text

### ⚙️ Configuração

- **Settings:** `ui.accessibility.screenReader`
- **Settings:** `ui.accessibility.enableLoadingPhrases`
- **CLI:** `--screen-reader`

---

## Troubleshooting

### 🔧 Problemas Comuns

#### Build falhando

```bash
# Limpar e reconstruir
npm run clean
npm install
npm run build
```

#### Erro de TypeScript "Cannot write file"

```bash
# Limpar diretório dist
rm -rf packages/*/dist
npm run build
```

#### Lint falhando

```bash
# Auto-fix
npm run lint:fix

# Verificar erros
npm run lint
```

#### MCP server não inicia

```bash
# Testar comando manualmente
npx -y @upstash/context7-mcp

# Verificar timeout no mcp.json
{
  "servers": [{
    "timeout": 60000
  }]
}
```

#### Token budget exceeded

```json
{
  "mcp": {
    "tokenBudget": 100000
  }
}
```

#### "Command not found"

```bash
# Instalar npx globalmente
npm install -g npx
```

### 📞 Suporte

- **Bug reports:** `/bug` dentro do Qwen Code
- **Documentação:** `/docs`
- **GitHub Issues:** https://github.com/QwenLM/qwen-code/issues

---

## 📚 Referências

- [Documentação Oficial](https://qwenlm.github.io/qwen-code-docs/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Qwen3-Coder](https://github.com/QwenLM/Qwen3-Coder)
- [Discord](https://discord.gg/ycKBjdNd)

---

**© 2026 Qwen Code. Apache License 2.0**
