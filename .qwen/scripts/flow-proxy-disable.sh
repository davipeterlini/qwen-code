#!/usr/bin/env bash
# flow-proxy-disable.sh
# Desabilita o proxy Flow

set -euo pipefail

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔓 Desabilitando proxy Flow...${NC}"
echo ""

# Desabilitar variáveis de proxy
unset HTTP_PROXY
unset HTTPS_PROXY
unset NO_PROXY
unset FLOW_PROXY_USER
unset FLOW_PROXY_PASSWORD
unset FLOW_PROXY_HOST
unset FLOW_PROXY_PORT

echo -e "${GREEN}✅ Proxy Flow desabilitado${NC}"
echo ""
echo "Agora você está usando conexão direta (sem proxy)"
echo ""
