# 🔄 Sync with Upstream - Guia de Sincronização

Este documento descreve como sincronizar as mudanças do repositório oficial do Qwen Code com este repositório.

## 📋 Visão Geral

O processo de sync:

1. **Cria uma branch `merge-back`** a partir do `main` do upstream (QwenLM/qwen-code)
2. **Abre uma Pull Request** para mergear as mudanças na branch `main` deste repositório
3. **Permite revisão manual** antes de integrar as mudanças

## 🚀 Métodos de Sync

### Método 1: GitHub Actions (Automático)

O workflow `sync-upstream.yml` pode ser executado:

- **Automaticamente**: Toda segunda-feira às 9h UTC
- **Manualmente**: Via GitHub UI

#### Executar Manualmente via GitHub UI:

1. Acesse **Actions** → **Sync with Upstream Qwen Code**
2. Clique em **Run workflow**
3. Configure as opções:
   - `force`: Recria a branch merge-back (deleta existente)
   - `create_pr`: Cria/atualiza PR após sync
   - `branch_name`: Nome da branch (padrão: `merge-back`)
4. Clique em **Run workflow**

### Método 2: Script Local (Manual)

Execute o script de sync:

```bash
# Sync completo (cria branch e PR)
./scripts/sync-upstream.sh

# Apenas cria branch local (sem PR)
./scripts/sync-upstream.sh --manual

# Simula operações (dry-run)
./scripts/sync-upstream.sh --dry-run

# Força recriação da branch
./scripts/sync-upstream.sh --force --manual

# Ajuda
./scripts/sync-upstream.sh --help
```

### Método 3: Comandos NPM

```bash
# Sync completo
npm run sync:upstream

# Apenas cria branch local
npm run sync:upstream:manual

# Dry run
npm run sync:upstream:dry-run
```

## 📝 Fluxo de Trabalho

### Fluxo Automático (GitHub Actions)

```
┌─────────────────────────────────────────────────────────────┐
│  1. Workflow é acionado (schedule ou manual)                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Checkout do repositório                                 │
│     - Fetch completo do histórico                           │
│     - Setup Node.js e GitHub CLI                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Configurar remote upstream                              │
│     - Adiciona https://github.com/QwenLM/qwen-code.git     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Fetch upstream/main                                     │
│     - Baixa últimas mudanças do upstream                    │
│     - Conta commits ahead                                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
              ┌──────────────────────┐
              │ Commits ahead = 0?   │
              └──────────────────────┘
                   ↓            ↓
                  SIM          NÃO
                   ↓            ↓
         ┌─────────────┐  ┌─────────────────┐
         │ ✅ Already  │  │ 5. Cria branch  │
         │ up to date  │  │    merge-back   │
         └─────────────┘  └─────────────────┘
                                 ↓
                        ┌─────────────────┐
                        │ 6. Push branch  │
                        │    para origin  │
                        └─────────────────┘
                                 ↓
                        ┌─────────────────┐
                        │ 7. Cria/Atualiza│
                        │     PR no GH    │
                        └─────────────────┘
                                 ↓
                        ┌─────────────────┐
                        │ 8. Summary e    │
                        │  notificações   │
                        └─────────────────┘
```

### Fluxo Manual (Local)

```bash
# 1. Execute o script
./scripts/sync-upstream.sh --manual

# 2. O script irá:
#    - Adicionar remote upstream (se não existir)
#    - Fetch upstream/main
#    - Criar branch merge-back
#    - Mostrar informações dos commits

# 3. Faça push manual (se desejar)
git push -u origin merge-back

# 4. Crie a PR:
#    - Via GitHub CLI:
gh pr create --head merge-back --base main --title "🔄 Sync with upstream"

#    - Ou via GitHub UI em:
#      https://github.com/SEU_REPO/compare/main...merge-back
```

## ⚠️ Passos Manuais Obrigatórios

Antes de mergear a PR de sync:

### 1. Review de Conflitos

Verifique conflitos com mudanças customizadas:

```bash
git fetch origin merge-back
git checkout merge-back
git diff main...merge-back
```

**Áreas para verificar:**

- [ ] `packages/cli/src/ui/components/InputPrompt.tsx` (nossas customizações)
- [ ] `packages/core/src/agents/` (SuperClaude features)
- [ ] `packages/core/src/intelligence/` (Semantic search, project memory)
- [ ] `packages/core/src/planning/` (Plan mode)
- [ ] `packages/core/src/robustness/` (Quality monitoring)
- [ ] Configurações e scripts customizados

### 2. Testes Locais

```bash
# Instale dependências
npm install

# Build
npm run build

# Testes
npm test

# Lint
npm run lint

# Typecheck
npm run typecheck
```

### 3. Verificar Features Customizadas

Teste as funcionalidades que adicionamos:

```bash
# Teste ESC para restaurar prompt
npm start
# Digite um prompt, aperte Enter, depois ESC para restaurar

# Teste SuperClaude features
# Verifique agents, intelligence, planning, robustness
```

### 4. Resolver Conflitos

Se houver conflitos:

```bash
# Na branch merge-back
git checkout merge-back

# Resolva conflitos
git merge main
# ou
git rebase main

# Após resolver
git push -f origin merge-back
```

## 🔧 Configuração

### Pré-requisitos

- **Git** instalado
- **Node.js** 20+
- **GitHub CLI** (opcional, para criar PRs via terminal)

### Instalar GitHub CLI

```bash
# macOS
brew install gh

# Linux (Debian/Ubuntu)
type -p curl >/dev/null || sudo apt update && sudo apt install curl -y
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh -y

# Windows
winget install GitHub.cli
```

### Configurar Auth

```bash
# Autenticar GitHub CLI
gh auth login

# Verificar auth
gh auth status
```

## 📊 Monitoramento

### Verificar Status do Sync

```bash
# Ver commits ahead do upstream
git fetch upstream main
git rev-list --count main..upstream/main

# Ver branch merge-back
git branch -a | grep merge-back

# Ver PRs de sync
gh pr list --label sync
```

### Logs do Workflow

Acesse: **Actions** → **Sync with Upstream Qwen Code** → Workflow run

## 🐛 Troubleshooting

### Problema: Branch merge-back já existe

```bash
# Delete e recrie
./scripts/sync-upstream.sh --force

# Ou manualmente
git branch -D merge-back
git checkout -b merge-back upstream/main
```

### Problema: Conflitos no merge

```bash
# Checkout na branch
git checkout merge-back

# Merge com main para ver conflitos
git merge main

# Resolva conflitos manualmente
# ...

# Commit e push
git add .
git commit -m "Resolve merge conflicts"
git push -f origin merge-back
```

### Problema: PR não é criada

Verifique:

1. GitHub CLI está instalado: `gh --version`
2. Auth está configurada: `gh auth status`
3. Permissões no workflow

```bash
# Crie PR manualmente
gh pr create --head merge-back --base main --title "🔄 Sync with upstream"
```

### Problema: Workflow falha

1. Verifique logs do workflow
2. Tente executar manualmente com `force: true`
3. Execute sync localmente para debug:
   ```bash
   ./scripts/sync-upstream.sh --manual --dry-run
   ```

## 📅 Schedule

O sync automático roda:

- **Quando**: Toda segunda-feira às 9h UTC
- **Onde**: `.github/workflows/sync-upstream.yml`
- **Ação**: Cria/atualiza PR com mudanças da semana

### Alterar Schedule

Edite `.github/workflows/sync-upstream.yml`:

```yaml
schedule:
  # Mude o cron conforme necessário
  - cron: '0 9 * * 1' # Toda segunda às 9h UTC
```

**Exemplos de cron:**

- `0 0 * * *` - Diariamente à meia-noite UTC
- `0 9 * * 1-5` - Seg-Sex às 9h UTC
- `0 9 1 * *` - Dia 1 de cada mês às 9h UTC

## 🔗 Referências

- **Upstream**: https://github.com/QwenLM/qwen-code
- **GitHub Actions**: https://docs.github.com/en/actions
- **GitHub CLI**: https://cli.github.com/
- **Git Sync**: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique este documento
2. Consulte logs do workflow
3. Execute `./scripts/sync-upstream.sh --help`
4. Abra uma issue no repositório
