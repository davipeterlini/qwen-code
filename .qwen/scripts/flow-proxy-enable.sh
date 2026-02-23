#!/usr/bin/env bash
# flow-proxy-enable.sh
# Habilita o proxy Flow para Qwen Code

set -euo pipefail

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretório do script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QWEN_DIR="$(dirname "$SCRIPT_DIR")"

# Arquivo de configuração
ENV_FILE="$QWEN_DIR/.env.flow.local"

# Banner
echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Flow Proxy Configuration Tool      ║${NC}"
echo -e "${BLUE}║   Qwen Code                          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# Verificar se arquivo existe
if [[ ! -f "$ENV_FILE" ]]; then
  echo -e "${YELLOW}⚠️  Arquivo de configuração não encontrado${NC}"
  echo ""
  echo "Criando arquivo de configuração..."

  # Criar arquivo de template
  cat > "$ENV_FILE" <<'EOF'
# Flow Proxy Configuration
FLOW_PROXY_USER=seu_usuario
FLOW_PROXY_PASSWORD=sua_senha
FLOW_PROXY_HOST=proxy.flow.company.com
FLOW_PROXY_PORT=8080
EOF

  echo -e "${GREEN}✅ Arquivo criado: $ENV_FILE${NC}"
  echo ""
  echo -e "${YELLOW}Por favor, edite o arquivo com suas credenciais:${NC}"
  echo -e "  ${BLUE}nano $ENV_FILE${NC}"
  echo ""
  exit 0
fi

# Carregar configuração
echo "📂 Carregando configuração..."
source "$ENV_FILE"

# Validar credenciais
if [[ -z "${FLOW_PROXY_USER:-}" ]] || [[ -z "${FLOW_PROXY_PASSWORD:-}" ]]; then
  echo -e "${RED}❌ Erro: Credenciais não configuradas${NC}"
  echo ""
  echo "Edite o arquivo de configuração:"
  echo -e "  ${BLUE}nano $ENV_FILE${NC}"
  echo ""
  exit 1
fi

if [[ "$FLOW_PROXY_USER" == "seu_usuario" ]] || [[ "$FLOW_PROXY_PASSWORD" == "sua_senha" ]]; then
  echo -e "${RED}❌ Erro: Use credenciais reais${NC}"
  echo ""
  echo "Edite o arquivo de configuração:"
  echo -e "  ${BLUE}nano $ENV_FILE${NC}"
  echo ""
  exit 1
fi

# Configurar valores padrão
FLOW_PROXY_HOST="${FLOW_PROXY_HOST:-proxy.flow.company.com}"
FLOW_PROXY_PORT="${FLOW_PROXY_PORT:-8080}"

# Exportar variáveis de ambiente
export HTTP_PROXY="http://${FLOW_PROXY_USER}:${FLOW_PROXY_PASSWORD}@${FLOW_PROXY_HOST}:${FLOW_PROXY_PORT}"
export HTTPS_PROXY="$HTTP_PROXY"
export NO_PROXY="localhost,127.0.0.1,*.local,*.internal,*.flow.company.com"

echo -e "${GREEN}✅ Proxy Flow habilitado${NC}"
echo ""
echo "📋 Configuração:"
echo -e "   Proxy: ${BLUE}${FLOW_PROXY_HOST}:${FLOW_PROXY_PORT}${NC}"
echo -e "   User:  ${BLUE}${FLOW_PROXY_USER}${NC}"
echo ""

# Testar conectividade (opcional)
if command -v timeout &> /dev/null; then
  echo "🔍 Testando conectividade..."

  if timeout 3 bash -c "echo > /dev/tcp/${FLOW_PROXY_HOST}/${FLOW_PROXY_PORT}" 2>/dev/null; then
    echo -e "${GREEN}✅ Proxy acessível${NC}"
  else
    echo -e "${YELLOW}⚠️  Não foi possível conectar ao proxy${NC}"
    echo "   Verifique se você está na rede corporativa"
  fi
  echo ""
fi

# Instruções
echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo ""
echo "1. Para usar no terminal atual:"
echo -e "   ${BLUE}source $SCRIPT_DIR/flow-proxy-enable.sh${NC}"
echo ""
echo "2. Para usar permanentemente, adicione ao ~/.zshrc ou ~/.bashrc:"
echo -e "   ${BLUE}echo 'source $SCRIPT_DIR/flow-proxy-enable.sh' >> ~/.zshrc${NC}"
echo ""
echo "3. Para testar a conexão:"
echo -e "   ${BLUE}$SCRIPT_DIR/flow-proxy-test.sh${NC}"
echo ""
echo "4. Para desabilitar:"
echo -e "   ${BLUE}source $SCRIPT_DIR/flow-proxy-disable.sh${NC}"
echo ""
