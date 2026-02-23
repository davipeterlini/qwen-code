# Configuração Qwen Code - Guia de Instalação

Este diretório contém as configurações compatíveis do Claude Code adaptadas para Qwen Code.

---

## 📍 Onde Configurar (Resposta Direta)

As configurações compatíveis devem ser configuradas no diretório **`~/.qwen/`** (home do usuário):

```
~/.qwen/                                    # Diretório global do Qwen
├── settings.json                           # ← Configurações gerais, hooks, MCPs
├── skills/                                 # ← Skills (workflows reutilizáveis)
├── rules/                                  # ← Rules (instruções globais)
└── agents/                                 # ← Agentes (especializados)
```

---

## 🚀 Instalação Rápida (30 minutos)

### Passo 1: Criar Estrutura

```bash
mkdir -p ~/.qwen/{skills,rules,agents}
```

### Passo 2: Copiar Skills (100% compatível)

```bash
# Opção A: Copiar
cp -r ~/.claude/skills/* ~/.qwen/skills/

# Opção B: Symlink (compartilha com Claude)
ln -s ~/.claude/skills ~/.qwen/skills
```

**Skills prioritários:**

- `tdd-workflow` - Test-driven development
- `security-review` - Security checklist
- `backend-patterns` - API design patterns
- `frontend-patterns` - React/Next.js patterns

### Passo 3: Copiar Rules (100% compatível)

```bash
cp -r ~/.claude/rules/* ~/.qwen/rules/
```

### Passo 4: Configurar settings.json

**Localização:** `~/.qwen/settings.json`

```bash
# Fazer backup
cp ~/.qwen/settings.json ~/.qwen/settings.json.backup

# Copiar configuração otimizada
cp ~/projects-personal/qwen-code/.qwen/settings-qwen-otimizado.json ~/.qwen/settings.json
```

**O que adiciona:**

#### Hooks (Validações Automáticas)

- Bloqueia dev servers fora do tmux
- Lembra de revisar antes de git push
- Bloqueia criação de .md aleatórios
- Loga URLs de PRs

#### MCPs (Ferramentas Gratuitas)

- `sequential-thinking` - Reasoning estendido
- `context7` - Busca documentação
- `playwright` - Automação de browser

#### Otimizações

```json
{
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "50",
    "CLAUDE_CODE_SUBAGENT_MODEL": "qwen3-coder-turbo"
  }
}
```

---

## 🔧 Instalação Avançada (Agentes)

### Adaptar Agentes (2-4 horas)

```bash
# Copiar agentes prioritários
for agent in code-reviewer security-reviewer tdd-guide planner rapid-prototyper; do
  cp -r ~/.claude/agents/$agent ~/.qwen/agents/
done

# Substituir modelos
find ~/.qwen/agents -type f \( -name "*.json" -o -name "*.md" \) -exec sed -i '' \
  -e 's/"model": "sonnet"/"model": "qwen3-coder-plus"/g' \
  -e 's/"model": "haiku"/"model": "qwen3-coder-turbo"/g' \
  {} +
```

---

## 📊 Tabela de Localização

| Componente      | Onde Configurar         | Compatibilidade | Tipo             |
| --------------- | ----------------------- | --------------- | ---------------- |
| **Skills**      | `~/.qwen/skills/`       | ✅ 100%         | Diretórios       |
| **Rules**       | `~/.qwen/rules/`        | ✅ 100%         | Arquivos .md     |
| **Hooks**       | `~/.qwen/settings.json` | ✅ 100%         | JSON: hooks      |
| **MCPs**        | `~/.qwen/settings.json` | ✅ 100%         | JSON: mcpServers |
| **Otimizações** | `~/.qwen/settings.json` | ✅ 100%         | JSON: env        |
| **Agentes**     | `~/.qwen/agents/`       | ⚠️ 80%          | Requer sed       |

---

## 🎯 Verificação Pós-Instalação

```bash
# 1. Verificar estrutura
tree -L 2 ~/.qwen/

# 2. Validar JSON
cat ~/.qwen/settings.json | python -m json.tool

# 3. Testar skills
qwen "Follow the TDD workflow skill"

# 4. Testar hooks (deve bloquear)
qwen "Write a file test.md"

# 5. Testar MCPs
qwen "Use sequential thinking to explain async/await"
```

---

## 🔄 Manutenção

### Script de Sync

```bash
# ~/.qwen/sync-from-claude.sh
#!/bin/bash
rsync -av --delete ~/.claude/skills/ ~/.qwen/skills/
rsync -av --delete ~/.claude/rules/ ~/.qwen/rules/
echo "✅ Synced!"
```

---

## 🆘 Troubleshooting

### Skills não funcionam

```bash
ls -la ~/.qwen/skills/
qwen "Follow the TDD workflow skill at ~/.qwen/skills/tdd-workflow/"
```

### Hooks não funcionam

```bash
cat ~/.qwen/settings.json | python -m json.tool
qwen --verbose
```

### MCPs não aparecem

```bash
npx @modelcontextprotocol/server-sequential-thinking
cat ~/.qwen/settings.json | grep -A 10 mcpServers
```

---

## 📚 Arquivos de Referência

- `CLAUDE.md` - Análise completa de compatibilidade
- `settings-qwen-otimizado.json` - Configuração otimizada pronta para usar
- `FLOW_PROXY_README.md` - Guia de configuração do proxy Flow

---

**Versão:** 1.0 | **Data:** 2026-02-20
