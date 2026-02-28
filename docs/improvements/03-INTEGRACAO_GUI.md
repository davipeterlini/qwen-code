# 🎯 Guia de Integração - Novas Funcionalidades

## 📋 Visão Geral

Este documento descreve como integrar as 4 novas funcionalidades implementadas no Qwen Code CLI.

---

## ✅ Integração Realizada

### 1. **Config.ts** - Registro dos Serviços

**Arquivo:** `packages/core/src/config/config.ts`

**Mudanças:**

```typescript
// Imports adicionados (linha ~73-78)
import { SkillActivationService } from '../skills/skill-activation-service.js';
import { HookService } from '../hooks/hook-service.js';
import { CheckpointService } from '../checkpoints/checkpoint-service.js';
import { MarkdownCommandLoader } from '../commands/markdown-command-loader.js';

// Propriedades adicionadas (linha ~425-428)
private skillActivationService: SkillActivationService | null = null;
private hookService: HookService | null = null;
private checkpointService: CheckpointService | null = null;
private markdownCommandLoader: MarkdownCommandLoader | null = null;

// Inicialização no initialize() (linha ~707-720)
this.skillActivationService = new SkillActivationService(this);
this.hookService = new HookService(this);
this.checkpointService = new CheckpointService(this);
this.markdownCommandLoader = new MarkdownCommandLoader();
await this.hookService.initialize();
await this.checkpointService.initialize();
await this.markdownCommandLoader.loadCommands(...);

// Getters adicionados (linha ~1661-1673)
getSkillActivationService(): SkillActivationService | null
getHookService(): HookService | null
getCheckpointService(): CheckpointService | null
getMarkdownCommandLoader(): MarkdownCommandLoader | null
```

**Status:** ✅ Completo

---

### 2. **CoreToolScheduler** - Hooks e Checkpoints

**Arquivo:** `packages/core/src/core/tool-scheduler-extensions.ts` (NOVO)

**Funções Criadas:**

```typescript
// Executar hooks antes/depois de ferramentas
executeToolHooks(config, hookType, context, signal);

// Criar checkpoint automático antes de ferramentas
createPreToolCheckpoint(config, toolCallRequest, sessionId);

// Verificar se hook quer bloquear execução
shouldBlockToolExecution(config, hookResults);

// Obter prompt modificado por hooks
getModifiedPromptFromHooks(hookResults);
```

**Como Integrar no CoreToolScheduler:**

```typescript
// No método schedule(), antes de executar ferramenta:
import {
  executeToolHooks,
  createPreToolCheckpoint,
  shouldBlockToolExecution,
} from './tool-scheduler-extensions.js';

// Antes de validar ferramenta
await executeToolHooks(
  config,
  'PreToolUse',
  {
    toolName: reqInfo.name,
    toolArgs: reqInfo.args,
    sessionId: this.sessionId,
  },
  signal,
);

// Criar checkpoint automático
await createPreToolCheckpoint(config, reqInfo, this.sessionId);

// Depois de executar ferramenta
await executeToolHooks(
  config,
  'PostToolUse',
  {
    toolName: reqInfo.name,
    toolOutput: result.output,
    sessionId: this.sessionId,
  },
  signal,
);
```

**Status:** ⚠️ Requer modificação no CoreToolScheduler.ts

---

### 3. **BuiltinCommandLoader** - Rewind Command

**Arquivo:** `packages/cli/src/services/BuiltinCommandLoader.ts`

**Mudanças:**

```typescript
// Import adicionado (linha ~43)
import { rewindCommand } from '../ui/commands/rewindCommand.js';

// Adicionado na lista de commands (linha ~85)
rewindCommand,
```

**Status:** ✅ Completo

---

### 4. **MarkdownCommandLoader** - Commands Markdown

**Arquivo:** `packages/cli/src/services/MarkdownCommandLoader.ts` (NOVO)

**Funcionalidade:**

- Carrega commands de `.qwen/commands/*.md`
- Converte markdown configs para SlashCommand
- Processa variáveis ($ARGUMENTS, $1, $2, --name)

**Como Usar:**

```typescript
// No CommandService.create():
import { MarkdownCommandLoader } from './MarkdownCommandLoader.js';

const loaders = [
  new BuiltinCommandLoader(config),
  new MarkdownCommandLoader(config), // Adicionar este
  new FileCommandLoader(config),
];
```

**Status:** ✅ Completo (requer adição ao CommandService)

---

### 5. **SkillActivationService** - Auto-Activation

**Arquivo:** `packages/core/src/skills/skill-activation-service.ts`

**Como Integrar no Prompt System:**

```typescript
// No processamento de prompts do usuário:
import { SkillActivationService } from './skill-activation-service.js';

const skillActivationService = config.getSkillActivationService();

if (skillActivationService) {
  // Encontrar skills que devem ativar
  const matchingSkills = skillActivationService.findMatchingSkills(
    await skillManager.listSkills(),
    userInput,
    { threshold: 0.5 },
  );

  // Auto-ativar skills
  for (const match of matchingSkills) {
    if (match.autoActivate) {
      // Adicionar contexto da skill ao prompt
      const skillContext = skillActivationService.buildSkillContext(
        match.skill,
      );
      enhancedPrompt = `${skillContext}\n\n${userInput}`;

      // Notificar usuário
      console.log(skillActivationService.buildActivationMessage([match]));
    }
  }
}
```

**Status:** ⚠️ Requer integração no sistema de prompts

---

## 🚀 Passos para Integração Completa

### **Passo 1: Atualizar CommandService**

**Arquivo:** `packages/cli/src/services/CommandService.ts`

```typescript
// No método create(), adicionar MarkdownCommandLoader:
import { MarkdownCommandLoader } from './MarkdownCommandLoader.js';

static async create(
  config: Config | null,
  signal: AbortSignal,
): Promise<CommandService> {
  const loaders: ICommandLoader[] = [
    new BuiltinCommandLoader(config),
    new MarkdownCommandLoader(config), // ← ADICIONAR ESTE
    new FileCommandLoader(config),
  ];

  // ... resto do código
}
```

---

### **Passo 2: Integrar Hooks no CoreToolScheduler**

**Arquivo:** `packages/core/src/core/coreToolScheduler.ts`

**Local:** Método `schedule()` (linha ~800)

```typescript
import {
  executeToolHooks,
  createPreToolCheckpoint,
} from './tool-scheduler-extensions.js';

// Dentro do loop de tool calls, ANTES de executar:
for (const reqInfo of toolCallRequests) {
  // ← ADICIONAR AQUI:
  await executeToolHooks(
    this.config,
    'PreToolUse',
    {
      toolName: reqInfo.name,
      toolArgs: reqInfo.args,
      sessionId: this.sessionId,
    },
    signal,
  );

  await createPreToolCheckpoint(this.config, reqInfo, this.sessionId);

  // ... resto do código existente
}

// DEPOIS de executar ferramenta:
const toolResult: ToolResult = await promise;

// ← ADICIONAR AQUI:
await executeToolHooks(
  this.config,
  'PostToolUse',
  {
    toolName: reqInfo.name,
    toolOutput: toolResult.output,
    sessionId: this.sessionId,
  },
  signal,
);
```

---

### **Passo 3: Integrar Auto-Activation no Prompt Handler**

**Arquivo:** `packages/cli/src/ui/hooks/useGeminiStream.ts` (ou onde processa prompts)

```typescript
import { SkillActivationService } from '@qwen-code/qwen-code-core';

// No handler de prompt do usuário:
async function handleUserPrompt(userInput: string) {
  const skillActivationService = config.getSkillActivationService();
  const skillManager = config.getSkillManager();

  let enhancedPrompt = userInput;

  if (skillActivationService && skillManager) {
    const skills = await skillManager.listSkills();
    const matchingSkills = skillActivationService.findMatchingSkills(
      skills,
      userInput,
      { threshold: 0.3 },
    );

    // Auto-ativar skills matching
    for (const match of matchingSkills) {
      if (match.autoActivate) {
        const skillContext = skillActivationService.buildSkillContext(
          match.skill,
        );
        enhancedPrompt = `${skillContext}\n\n${userInput}`;

        // Mostrar notificação
        showMessage(skillActivationService.buildActivationMessage([match]));
      }
    }
  }

  // Enviar prompt enhanced
  await sendPrompt(enhancedPrompt);
}
```

---

### **Passo 4: Usar Função de Integração**

**Arquivo:** `packages/cli/src/core/initializer.ts`

```typescript
import { initializeNewFeatures } from '@qwen-code/qwen-code-core';

export async function initializeApp(
  config: Config,
  settings: LoadedSettings,
): Promise<InitializationResult> {
  // ... inicialização existente

  // ← ADICIONAR NO FINAL:
  await initializeNewFeatures(config);

  return {
    authError,
    themeError,
    shouldOpenAuthDialog,
    geminiMdFileCount: config.getGeminiMdFileCount(),
  };
}
```

---

## 📝 Resumo das Mudanças

| Arquivo                             | Mudança                 | Status   |
| ----------------------------------- | ----------------------- | -------- |
| `config/config.ts`                  | ✅ Serviços registrados | Completo |
| `core/tool-scheduler-extensions.ts` | ✅ Funções criadas      | Completo |
| `coreToolScheduler.ts`              | ⚠️ Integrar hooks       | Pendente |
| `BuiltinCommandLoader.ts`           | ✅ Rewind adicionado    | Completo |
| `MarkdownCommandLoader.ts`          | ✅ Loader criado        | Completo |
| `CommandService.ts`                 | ⚠️ Adicionar loader     | Pendente |
| `initializer.ts`                    | ⚠️ Chamar initialize    | Pendente |
| `useGeminiStream.ts`                | ⚠️ Auto-activation      | Pendente |

---

## ✅ Checklist de Integração

- [ ] Config.ts - Serviços registrados ✅
- [ ] CommandService - Adicionar MarkdownCommandLoader
- [ ] CoreToolScheduler - Integrar hooks e checkpoints
- [ ] Prompt Handler - Integrar skill auto-activation
- [ ] Initializer - Chamar initializeNewFeatures
- [ ] Testar todas as features

---

## 🧪 Testes de Validação

### Hooks

```bash
# Criar config
cat > .qwen/hooks.json << 'EOF'
{
  "PostToolUse": [{
    "matcher": "Edit|Write",
    "hooks": [{
      "type": "command",
      "command": "echo 'Hook executed!'"
    }]
  }]
}
EOF

# Testar
npm run dev
# Editar arquivo → hook deve executar
```

### Checkpoints

```bash
npm run dev
/rewind list
# Deve mostrar checkpoints criados automaticamente
```

### Markdown Commands

```bash
# Criar comando
mkdir -p .qwen/commands
cat > .qwen/commands/hello.md << 'EOF'
---
name: hello
description: Say hello
---
Hello! How can I help you today?
EOF

# Testar
/hello
```

### Skills Auto-Activation

```bash
# Copiar skill
cp -r examples/tdd-developer-skill .qwen/skills/

# Testar
npm run dev
# Digitar: "preciso escrever testes"
# → Skill deve ativar automaticamente
```

---

## 🎯 Conclusão

**Integração Completa Requer:**

1. ✅ Config.ts (feito)
2. ⚠️ CommandService.ts (5 min)
3. ⚠️ CoreToolScheduler.ts (10 min)
4. ⚠️ Prompt Handler (10 min)
5. ⚠️ Initializer.ts (2 min)

**Tempo Total Estimado:** ~30 minutos

**Status Atual:** 60% completo

- Serviços registrados e inicializados ✅
- Funções de integração criadas ✅
- Comandos registrados ✅
- Pendente: Integração nos pontos de execução

---

**Próximo Passo:** Executar os passos 1-5 acima para completar a integração.
