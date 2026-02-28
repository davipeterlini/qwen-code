# Qwen Code - Melhorias Implementadas

Este documento descreve as melhorias implementadas no Qwen Code, inspiradas nas melhores funcionalidades de CLIs do mercado como **Claude Code**, **Cursor**, e **Windsurf**.

## 📋 Índice

1. [Comando /context](#-comando-context)
2. [Custom Slash Commands (JSON)](#-custom-slash-commands-json)
3. [Hooks System](#-hooks-system)
4. [Plan Documents](#-plan-documents)
5. [Exemplos de Uso](#-exemplos-de-uso)

---

## 🎯 Comando `/context`

Visualização detalhada do uso da janela de contexto com breakdown por categoria.

### Funcionalidades

- **Visualização em tempo real** do uso de tokens
- **Breakdown por categoria**:
  - System Prompt
  - Tools disponíveis
  - MCP Tools (se configurado)
  - Arquivos de memória (QWEN.md)
  - Histórico de mensagens
- **Barra de progresso** visual
- **Alertas** quando uso ultrapassa 80%
- **Limites por modelo** configurados automaticamente

### Uso

```bash
# Dentro de uma sessão Qwen Code:
/context
```

### Exemplo de Output

```
╔═══════════════════════════════════════════════════════════╗
║  📊 CONTEXT WINDOW USAGE                      45.2% used  ║
╠═══════════════════════════════════════════════════════════╣
║  Model: qwen3-coder-plus                                  ║
╠═══════════════════════════════════════════════════════════╣
║  ██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ║
╠═══════════════════════════════════════════════════════════╣
║  BREAKDOWN:                                               ║
║  ├─ System Prompt:    2,500 tokens (  1.0%)           ║
║  ├─ Tools:            8,200 tokens (  3.2%)           ║
║  ├─ MCP Tools:            0 tokens (  0.0%)           ║
║  ├─ Memory Files:     1,100 tokens (  0.4%)  (2 files)   ║
║  ├─ Messages:        98,500 tokens ( 38.4%)           ║
╠═══════════════════════════════════════════════════════════╣
║  TOTAL USED:         110,300 / 256,000 tokens                     ║
║  AVAILABLE:          145,700 tokens remaining                        ║
║  OUTPUT LIMIT:        32,000 tokens                               ║
╚═══════════════════════════════════════════════════════════╝

Tip: Use /memory show to view memory content, /compress to compact history.
```

### Modelos Suportados

- **Qwen**: qwen3-coder-plus, qwen3.5-plus, qwen-max, qwen-plus
- **Claude**: claude-sonnet-4, claude-opus-4, claude-3-5-sonnet
- **Gemini**: gemini-2.5-pro, gemini-2.0-flash
- **GPT**: gpt-4o, gpt-4-turbo

---

## 📝 Custom Slash Commands (JSON)

Crie seus próprios comandos slash personalizados usando arquivos JSON.

### Estrutura do Arquivo

Crie um arquivo `.qwen/commands.json` no seu projeto ou `~/.qwen/commands.json` para comandos globais:

```json
{
  "commands": {
    "nome-do-comando": {
      "description": "Descrição do comando",
      "prompt": "Prompt que será executado",
      "tools": ["ReadFile", "WriteFile"],
      "autoApprove": false
    }
  }
}
```

### Campos

| Campo         | Tipo     | Obrigatório | Descrição                         |
| ------------- | -------- | ----------- | --------------------------------- |
| `description` | string   | Não         | Descrição exibida no `/help`      |
| `prompt`      | string   | **Sim**     | Prompt enviado ao modelo          |
| `tools`       | string[] | Não         | Lista de ferramentas permitidas   |
| `autoApprove` | boolean  | Não         | Aprova automaticamente tool calls |

### Exemplo de Uso

```json
{
  "commands": {
    "review": {
      "description": "Review code changes",
      "prompt": "Please review the code for quality, bugs, and improvements.",
      "tools": ["ReadFile", "Glob"],
      "autoApprove": false
    },
    "test": {
      "description": "Generate tests",
      "prompt": "Generate comprehensive unit tests for this module.",
      "tools": ["ReadFile", "WriteFile"],
      "autoApprove": false
    }
  }
}
```

### Comandos Criados

Depois de configurar, use no Qwen Code:

```bash
/review
/test
```

### Variáveis de Ambiente nos Prompts

Os prompts podem usar variáveis que serão substituídas:

- `$QWEN_PROJECT_ROOT` - Diretório raiz do projeto
- `$QWEN_DATE` - Data atual
- `$QWEN_TIME` - Hora atual

---

## 🔗 Hooks System

Automatize ações com hooks executados em eventos específicos.

### Eventos Disponíveis

| Hook                 | Quando é Executado              |
| -------------------- | ------------------------------- |
| `onSessionStart`     | Quando uma sessão inicia        |
| `onPromptSubmit`     | Antes de enviar um prompt       |
| `onResponse`         | Após receber resposta do modelo |
| `onToolCall`         | Antes de executar uma tool      |
| `onToolComplete`     | Após executar uma tool          |
| `onFileEdit`         | Antes de editar um arquivo      |
| `onFileEditComplete` | Após editar um arquivo          |
| `onSessionEnd`       | Quando uma sessão termina       |

### Estrutura do Arquivo

Crie `.qwen/hooks.json` ou `~/.qwen/hooks.json`:

```json
{
  "hooks": {
    "onSessionStart": {
      "enabled": true,
      "script": "echo 'Session started' >> ~/.qwen/log.txt",
      "timeout": 5000,
      "continueOnError": true
    }
  }
}
```

### Campos

| Campo             | Tipo    | Padrão          | Descrição                |
| ----------------- | ------- | --------------- | ------------------------ |
| `enabled`         | boolean | `true`          | Se o hook está ativo     |
| `script`          | string  | **Obrigatório** | Comando shell a executar |
| `timeout`         | number  | `30000`         | Timeout em ms            |
| `continueOnError` | boolean | `false`         | Continua se falhar       |

### Variáveis de Ambiente

Os hooks recebem variáveis de ambiente com contexto:

- `QWEN_HOOK_NAME` - Nome do hook sendo executado
- `QWEN_PROJECT_ROOT` - Diretório do projeto
- `QWEN_PROMPT` - Prompt submetido (onPromptSubmit)
- `QWEN_TOOL_NAME` - Tool chamada (onToolCall)
- `QWEN_FILE_PATH` - Arquivo sendo editado (onFileEdit)
- `QWEN_SESSION_DURATION` - Duração da sessão em ms (onSessionEnd)

### Exemplos de Uso

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

#### Backup Automático antes de Editar

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

#### Validação de Prompts

```json
{
  "hooks": {
    "onPromptSubmit": {
      "enabled": false,
      "script": "echo \"$QWEN_PROMPT\" | grep -q 'DELETE\\|DROP\\|rm -rf' && exit 1 || exit 0",
      "continueOnError": true
    }
  }
}
```

---

## 📋 Plan Documents

Gerencie planos de desenvolvimento com spec-driven development.

### Comandos Disponíveis

```bash
# Listar todos os planos
/plans

# Mostrar detalhes de um plano
/plans show <plan-id>

# Criar novo plano
/plans create "Refatorar módulo de autenticação"

# Atualizar plano
/plans update <plan-id> --status "in_progress"

# Deletar plano
/plans delete <plan-id>
```

### Estrutura de um Plano

Cada plano contém:

- **ID** - Identificador único
- **Title** - Título do plano
- **Description** - Descrição detalhada
- **Status** - draft, in_progress, completed, abandoned
- **Steps** - Lista de passos com status individual
- **Metadata** - Informações adicionais
- **Timestamps** - Criação e atualização

### Exemplo de Uso

```bash
# Criar plano
/plans create "Implementar autenticação OAuth"

# O Qwen vai ajudar a criar um plano estruturado com:
# - Descrição do objetivo
# - Passos detalhados
# - Critérios de aceite

# Acompanhar progresso
/plans show implementar-autenticacao-oauth-xyz123

# Atualizar status de um passo
# (Através de interação com o Qwen)
```

### Armazenamento

Os planos são salvos em:

- **Linux/macOS**: `~/.qwen/plans/`
- **Windows**: `%USERPROFILE%\\.qwen\\plans\\`

Cada plano é um arquivo JSON separado com índice central.

---

## 📚 Exemplos de Uso

### Workflow Completo de Desenvolvimento

```bash
# 1. Iniciar sessão e ver contexto
qwen
/context

# 2. Criar plano para feature
/plans create "Adicionar sistema de cache"

# 3. Usar comando customizado para review
/review src/cache.ts

# 4. Gerar testes
/test src/cache.ts

# 5. Hooks fazem backup automático antes de editar
# (configurado em hooks.json)

# 6. Acompanhar uso de tokens
/context

# 7. Compressar histórico se necessário
/compress

# 8. Atualizar plano
/plans update adicionar-sistema-de-cache-abc --status "completed"
```

### Configuração Recomendada

#### `.qwen/commands.json`

```json
{
  "commands": {
    "review": {
      "description": "Code review",
      "prompt": "Review for quality, bugs, security, performance.",
      "tools": ["ReadFile", "Glob"]
    },
    "test": {
      "description": "Generate tests",
      "prompt": "Generate comprehensive tests.",
      "tools": ["ReadFile", "WriteFile"]
    },
    "explain": {
      "description": "Explain codebase",
      "prompt": "Explain the architecture and flow.",
      "tools": ["ReadFile", "Glob", "Grep"]
    }
  }
}
```

#### `.qwen/hooks.json`

```json
{
  "hooks": {
    "onSessionStart": {
      "enabled": true,
      "script": "echo \"[$(date)] Session started\" >> ~/.qwen/log.txt"
    },
    "onFileEdit": {
      "enabled": true,
      "script": "cp \"$QWEN_FILE_PATH\" \"$QWEN_FILE_PATH.bak\"",
      "continueOnError": true
    },
    "onSessionEnd": {
      "enabled": true,
      "script": "echo \"[$(date)] Session ended\" >> ~/.qwen/log.txt"
    }
  }
}
```

---

## 🎯 Próximas Melhorias (Roadmap)

- [ ] **Agent Teams** - Múltiplos agentes trabalhando em paralelo
- [ ] **MCP Dinâmico** - Carregamento sob demanda de tools
- [ ] **Delegate Mode** - Delegar tasks para agentes especializados
- [ ] **Long-Running Tasks** - Execução de tasks multi-step
- [ ] **Compactação Inteligente** - Summarization hierárquico
- [ ] **Plugin Marketplace** - Marketplace de plugins e skills

---

## 📝 Referências

Estas melhorias foram inspiradas em:

- **Claude Code** - Memory files, Plan mode, Hooks, MCP
- **Cursor** - Custom commands, AI-driven workflows
- **Windsurf** - Multi-agent orchestration
- **Aider** - Git integration, model-agnostic approach

Documentação original:

- [Claude Code Changelog](https://dev.to/oikon/reflections-of-claude-code-from-changelog-833)
- [AI CLI Tools Comparison 2026](https://www.tldl.io/resources/ai-coding-tools-2026)
