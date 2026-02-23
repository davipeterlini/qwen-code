#!/bin/bash

# @license
# Copyright 2025 Google LLC
# SPDX-License-Identifier: Apache-2.0

# Script para sincronização com o repositório upstream do Qwen Code
# Uso: ./scripts/sync-upstream.sh [--manual] [--force] [--dry-run]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variáveis
UPSTREAM_REPO="https://github.com/QwenLM/qwen-code.git"
UPSTREAM_REMOTE="upstream"
MERGE_BACK_BRANCH="merge-back"
BASE_BRANCH="main"
DRY_RUN=false
FORCE=false
MANUAL_MODE=false

# Função de ajuda
show_help() {
    cat << EOF
${BLUE}Sync Upstream - Qwen Code${NC}

Sincroniza as mudanças do repositório oficial do Qwen Code.

${YELLOW}Uso:${NC}
  ./scripts/sync-upstream.sh [opções]

${YELLOW}Opções:${NC}
  --manual      Cria a branch merge-back localmente (sem push remoto)
  --force       Força a recriação da branch merge-back
  --dry-run     Simula as operações sem executar
  --help        Mostra esta mensagem de ajuda

${YELLOW}Exemplos:${NC}
  ./scripts/sync-upstream.sh                    # Sync completo (cria branch e PR)
  ./scripts/sync-upstream.sh --manual           # Apenas cria branch local
  ./scripts/sync-upstream.sh --dry-run          # Simula operações
  ./scripts/sync-upstream.sh --force --manual   # Recria branch local forçando

${YELLOW}Fluxo Completo:${NC}
  1. Adiciona remote upstream (se não existir)
  2. Fetch das mudanças do upstream
  3. Cria/atualiza branch merge-back
  4. (Opcional) Cria PR no GitHub

EOF
}

# Parse dos argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --manual)
            MANUAL_MODE=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Opção desconhecida: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Função para log
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verifica se está no diretório correto
if [ ! -f "package.json" ]; then
    log_error "Este script deve ser executado na raiz do projeto"
    exit 1
fi

# Verifica se tem git
if ! command -v git &> /dev/null; then
    log_error "Git não está instalado"
    exit 1
fi

log_info "Iniciando sync com upstream Qwen Code..."
log_info "Repositório upstream: $UPSTREAM_REPO"

# Dry run mode
if [ "$DRY_RUN" = true ]; then
    log_warning "Modo dry-run ativado - nenhuma mudança será feita"
fi

# Step 1: Verifica remote upstream
log_info "Verificando remote upstream..."
if git remote | grep -q "^${UPSTREAM_REMOTE}$"; then
    log_info "Remote '$UPSTREAM_REMOTE' já existe"
else
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] git remote add $UPSTREAM_REMOTE $UPSTREAM_REPO"
    else
        git remote add $UPSTREAM_REMOTE $UPSTREAM_REPO
        log_success "Remote '$UPSTREAM_REMOTE' adicionado"
    fi
fi

# Step 2: Fetch upstream
log_info "Buscando mudanças do upstream..."
if [ "$DRY_RUN" = true ]; then
    log_info "[DRY-RUN] git fetch $UPSTREAM_REMOTE $BASE_BRANCH"
else
    git fetch $UPSTREAM_REMOTE $BASE_BRANCH
    log_success "Upstream fetch completado"
fi

# Step 3: Mostra informações do upstream
if [ "$DRY_RUN" = false ]; then
    log_info "Último commit do upstream:"
    git log $UPSTREAM_REMOTE/$BASE_BRANCH -1 --pretty=format:"  %h - %s (%ci)" --color
    echo ""
    
    # Conta commits ahead
    COMMITS_AHEAD=$(git rev-list --count $BASE_BRANCH..$UPSTREAM_REMOTE/$BASE_BRANCH 2>/dev/null || echo "0")
    log_info "Commits à frente: $COMMITS_AHEAD"
    
    if [ "$COMMITS_AHEAD" -eq 0 ]; then
        log_success "Repositório já está sincronizado com upstream!"
        exit 0
    fi
fi

# Step 4: Verifica se branch merge-back existe
if [ "$DRY_RUN" = false ]; then
    if git show-ref --verify --quiet refs/heads/$MERGE_BACK_BRANCH; then
        log_warning "Branch '$MERGE_BACK_BRANCH' já existe localmente"
        
        if [ "$FORCE" = true ]; then
            log_info "Forçando recriação da branch..."
            git branch -D $MERGE_BACK_BRANCH
            log_success "Branch '$MERGE_BACK_BRANCH' deletada"
        fi
    fi
fi

# Step 5: Cria branch merge-back
log_info "Criando branch '$MERGE_BACK_BRANCH' a partir do upstream..."
if [ "$DRY_RUN" = true ]; then
    log_info "[DRY-RUN] git checkout -b $MERGE_BACK_BRANCH $UPSTREAM_REMOTE/$BASE_BRANCH"
else
    git checkout -b $MERGE_BACK_BRANCH $UPSTREAM_REMOTE/$BASE_BRANCH
    log_success "Branch '$MERGE_BACK_BRANCH' criada"
fi

# Step 6: Push para remoto (se não for manual mode)
if [ "$MANUAL_MODE" = false ]; then
    log_info "Enviando branch para o remoto..."
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] git push -u origin $MERGE_BACK_BRANCH"
    else
        # Verifica se branch remota existe
        if git ls-remote --heads origin $MERGE_BACK_BRANCH | grep -q $MERGE_BACK_BRANCH; then
            if [ "$FORCE" = true ]; then
                log_warning "Forçando push da branch remota..."
                git push -u -f origin $MERGE_BACK_BRANCH
            else
                git push -u origin $MERGE_BACK_BRANCH
            fi
        else
            git push -u origin $MERGE_BACK_BRANCH
        fi
        log_success "Branch '$MERGE_BACK_BRANCH' enviada para origin"
    fi
else
    log_warning "Modo manual: branch não será enviada para o remoto"
fi

# Step 7: Voltar para main
if [ "$DRY_RUN" = false ]; then
    git checkout $BASE_BRANCH
    log_success "Retornando para branch '$BASE_BRANCH'"
fi

# Step 8: Criar PR (apenas se não for manual mode e tiver GitHub CLI)
if [ "$MANUAL_MODE" = false ] && [ "$DRY_RUN" = false ]; then
    if command -v gh &> /dev/null; then
        log_info "Verificando PR existente..."
        
        # Volta para merge-back para criar o PR
        git checkout $MERGE_BACK_BRANCH
        
        PR_EXISTS=$(gh pr list --head $MERGE_BACK_BRANCH --base $BASE_BRANCH --json number --jq '.[0].number' 2>/dev/null || echo "")
        
        if [ -n "$PR_EXISTS" ]; then
            log_warning "PR #$PR_EXISTS já existe"
            log_info "Atualizando descrição do PR..."
            
            # Atualiza PR existente
            gh pr edit $PR_EXISTS --body "$(cat << EOF
## 🔄 Sync with Upstream Repository (Updated)

Esta PR sincroniza as últimas mudanças do repositório oficial do Qwen Code.

### 📊 Resumo das Mudanças

- **Commits novos**: $COMMITS_AHEAD commits
- **Último commit**: $(git rev-parse --short $UPSTREAM_REMOTE/$BASE_BRANCH)
- **Data**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

### ⚠️ Passos Manuais Obrigatórios

Antes de mergear esta PR, por favor:

1. **Revise conflitos**: Verifique se há conflitos com nossas mudanças customizadas
2. **Teste localmente**:
   \`\`\`bash
   git fetch origin $MERGE_BACK_BRANCH
   git checkout $MERGE_BACK_BRANCH
   npm install
   npm run build
   npm test
   \`\`\`
3. **Verifique features customizadas**:
   - SuperClaude features (agents, intelligence, planning, robustness)
   - Custom workflows e exemplos
   - Documentação
4. **Rode testes completos**:
   \`\`\`bash
   npm run test:all
   npm run lint
   \`\`\`

### 🔗 Referências

- **Upstream**: https://github.com/QwenLM/qwen-code
- **Compare**: https://github.com/QwenLM/qwen-code/compare/$(git rev-parse $BASE_BRANCH)...$(git rev-parse $UPSTREAM_REMOTE/$BASE_BRANCH)

### 📝 Instruções de Merge

1. Resolva conflitos manualmente se necessário
2. Atualize changelog se necessário
3. Use **merge commit** (não squash) para preservar histórico upstream

---

🤖 Esta PR foi automaticamente atualizada pelo workflow sync-upstream.
EOF
)"
            log_success "PR #$PR_EXISTS atualizado"
        else
            log_info "Criando nova PR..."
            
            # Cria nova PR
            gh pr create \
                --title "🔄 Sync with upstream Qwen Code" \
                --body "$(cat << EOF
## 🔄 Sync with Upstream Repository

Esta PR sincroniza as últimas mudanças do repositório oficial do Qwen Code.

### 📊 Resumo das Mudanças

- **Commits novos**: $COMMITS_AHEAD commits
- **Último commit**: \`$(git rev-parse --short $UPSTREAM_REMOTE/$BASE_BRANCH)\`
- **Data do commit**: $(git log $UPSTREAM_REMOTE/$BASE_BRANCH -1 --pretty=format:'%ci')

### ⚠️ Passos Manuais Obrigatórios

Antes de mergear esta PR, por favor:

1. **Revise conflitos**: Verifique se há conflitos com nossas mudanças customizadas
2. **Teste localmente**:
   \`\`\`bash
   git fetch origin $MERGE_BACK_BRANCH
   git checkout $MERGE_BACK_BRANCH
   npm install
   npm run build
   npm test
   \`\`\`
3. **Verifique features customizadas**:
   - SuperClaude features (agents, intelligence, planning, robustness)
   - Custom workflows e exemplos
   - Documentação
4. **Rode testes completos**:
   \`\`\`bash
   npm run test:all
   npm run lint
   \`\`\`

### 🔗 Referências

- **Upstream**: https://github.com/QwenLM/qwen-code
- **Compare**: https://github.com/QwenLM/qwen-code/compare/$(git rev-parse $BASE_BRANCH)...$(git rev-parse $UPSTREAM_REMOTE/$BASE_BRANCH)

### 📝 Instruções de Merge

1. Resolva conflitos manualmente se necessário
2. Atualize changelog se necessário
3. Use **merge commit** (não squash) para preservar histórico upstream

---

🤖 Esta PR foi automaticamente criada pelo workflow sync-upstream.
EOF
)" \
                --head $MERGE_BACK_BRANCH \
                --base $BASE_BRANCH \
                --label "sync" \
                --label "upstream"
            
            log_success "PR criada com sucesso!"
        fi
        
        # Volta para main
        git checkout $BASE_BRANCH
    else
        log_warning "GitHub CLI (gh) não está instalado"
        log_info "Para criar a PR manualmente, execute:"
        echo "  git checkout $MERGE_BACK_BRANCH"
        echo "  git push -u origin $MERGE_BACK_BRANCH"
        echo "  # Depois crie a PR em: https://github.com/$(git remote get-url origin | sed 's/.*@github.com[/:]//' | sed 's/\.git$//')/compare/$BASE_BRANCH...$MERGE_BACK_BRANCH"
    fi
fi

# Summary
echo ""
log_success "Sync completado!"
echo ""
echo "=================================="
echo "         Resumo do Sync           "
echo "=================================="
echo "Upstream:      $UPSTREAM_REPO"
echo "Branch base:   $BASE_BRANCH"
echo "Branch sync:   $MERGE_BACK_BRANCH"
echo "Commits ahead: $COMMITS_AHEAD"
echo ""

if [ "$MANUAL_MODE" = true ]; then
    echo -e "${YELLOW}Próximos passos (modo manual):${NC}"
    echo "  1. git checkout $MERGE_BACK_BRANCH"
    echo "  2. git push -u origin $MERGE_BACK_BRANCH"
    echo "  3. Crie a PR no GitHub ou use: gh pr create --head $MERGE_BACK_BRANCH --base $BASE_BRANCH"
else
    echo -e "${GREEN}PR criada/atualizada automaticamente!${NC}"
    echo "Verifique em: https://github.com/$(git remote get-url origin | sed 's/.*@github.com[/:]//' | sed 's/\.git$//')/pulls"
fi

echo ""
echo "=================================="
