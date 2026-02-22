#!/usr/bin/env bash
# flow-proxy-test.sh
# Testa a configuração do proxy Flow

set -euo pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Contadores
PASSED=0
FAILED=0

# Função para teste
test_step() {
  local description="$1"
  local command="$2"

  echo -n "🔍 $description... "

  if eval "$command" &>/dev/null; then
    echo -e "${GREEN}✅${NC}"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}❌${NC}"
    ((FAILED++))
    return 1
  fi
}

# Banner
echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Flow Proxy Connection Test         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# Teste 1: Verificar variáveis de ambiente
echo -e "${YELLOW}1. Verificando variáveis de ambiente${NC}"

if [[ -z "${HTTP_PROXY:-}" ]]; then
  echo -e "${RED}❌ HTTP_PROXY não configurado${NC}"
  echo ""
  echo "Execute primeiro:"
  echo -e "  ${BLUE}source .qwen/scripts/flow-proxy-enable.sh${NC}"
  echo ""
  exit 1
fi

echo -e "   HTTP_PROXY:  ${GREEN}${HTTP_PROXY}${NC}"
echo -e "   HTTPS_PROXY: ${GREEN}${HTTPS_PROXY}${NC}"
echo -e "   NO_PROXY:    ${GREEN}${NO_PROXY:-}${NC}"
echo ""

# Teste 2: Conectividade do proxy
echo -e "${YELLOW}2. Testando conectividade do proxy${NC}"

# Extrair host e porta do HTTP_PROXY
if [[ "$HTTP_PROXY" =~ ([^:]+):([0-9]+)$ ]]; then
  PROXY_HOST="${BASH_REMATCH[1]#*@}"
  PROXY_PORT="${BASH_REMATCH[2]}"

  test_step "Conectando ao proxy $PROXY_HOST:$PROXY_PORT" \
    "timeout 5 bash -c 'echo > /dev/tcp/${PROXY_HOST}/${PROXY_PORT}'"
else
  echo -e "${YELLOW}⚠️  Não foi possível extrair host/porta do HTTP_PROXY${NC}"
fi
echo ""

# Teste 3: Conexão HTTP através do proxy
echo -e "${YELLOW}3. Testando requisições HTTP${NC}"

test_step "GET https://www.google.com" \
  "curl -x '$HTTP_PROXY' -s -o /dev/null -w '%{http_code}' --connect-timeout 10 https://www.google.com | grep -q '200'"

test_step "GET https://api.github.com" \
  "curl -x '$HTTP_PROXY' -s -o /dev/null -w '%{http_code}' --connect-timeout 10 https://api.github.com | grep -q '200'"

echo ""

# Teste 4: APIs de LLM
echo -e "${YELLOW}4. Testando APIs de LLM${NC}"

# OpenAI
if [[ -n "${OPENAI_API_KEY:-}" ]]; then
  test_step "OpenAI API" \
    "curl -x '$HTTP_PROXY' -s -o /dev/null -w '%{http_code}' --connect-timeout 10 \
      'https://api.openai.com/v1/models' \
      -H 'Authorization: Bearer $OPENAI_API_KEY' | grep -q '200'"
else
  echo -e "   OpenAI API: ${YELLOW}⏭️  OPENAI_API_KEY não configurado${NC}"
fi

# Anthropic
if [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
  test_step "Anthropic API" \
    "curl -x '$HTTP_PROXY' -s -o /dev/null -w '%{http_code}' --connect-timeout 10 \
      'https://api.anthropic.com/v1/messages' \
      -H 'x-api-key: $ANTHROPIC_API_KEY' \
      -H 'anthropic-version: 2023-06-01' \
      -H 'content-type: application/json' \
      -d '{\"model\":\"claude-3-5-sonnet-20241022\",\"max_tokens\":1,\"messages\":[{\"role\":\"user\",\"content\":\"hi\"}]}' | grep -q '200'"
else
  echo -e "   Anthropic API: ${YELLOW}⏭️  ANTHROPIC_API_KEY não configurado${NC}"
fi

# Dashscope (Qwen)
if [[ -n "${DASHSCOPE_API_KEY:-}" ]]; then
  test_step "Dashscope API (Qwen)" \
    "curl -x '$HTTP_PROXY' -s -o /dev/null -w '%{http_code}' --connect-timeout 10 \
      'https://dashscope.aliyuncs.com/compatible-mode/v1/models' \
      -H 'Authorization: Bearer $DASHSCOPE_API_KEY' | grep -q '200'"
else
  echo -e "   Dashscope API: ${YELLOW}⏭️  DASHSCOPE_API_KEY não configurado${NC}"
fi

echo ""

# Teste 5: SSL/TLS
echo -e "${YELLOW}5. Verificando SSL/TLS${NC}"

if [[ -n "${NODE_EXTRA_CA_CERTS:-}" ]]; then
  if [[ -f "$NODE_EXTRA_CA_CERTS" ]]; then
    echo -e "   CA Cert: ${GREEN}✅ $NODE_EXTRA_CA_CERTS${NC}"
  else
    echo -e "   CA Cert: ${RED}❌ Arquivo não encontrado: $NODE_EXTRA_CA_CERTS${NC}"
  fi
else
  echo -e "   CA Cert: ${YELLOW}⚠️  NODE_EXTRA_CA_CERTS não configurado${NC}"
fi

if [[ "${NODE_TLS_REJECT_UNAUTHORIZED:-1}" == "0" ]]; then
  echo -e "   TLS Verification: ${YELLOW}⚠️  DESABILITADO (não recomendado para produção)${NC}"
else
  echo -e "   TLS Verification: ${GREEN}✅ HABILITADO${NC}"
fi

echo ""

# Resumo
echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Resumo dos Testes                   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""
echo -e "   Testes passados: ${GREEN}$PASSED${NC}"
echo -e "   Testes falhados: ${RED}$FAILED${NC}"
echo ""

if [[ $FAILED -eq 0 ]]; then
  echo -e "${GREEN}✅ Todos os testes passaram!${NC}"
  echo ""
  echo "Seu proxy Flow está configurado corretamente."
  echo "Você pode usar o Qwen Code normalmente."
  echo ""
  exit 0
else
  echo -e "${RED}❌ Alguns testes falharam${NC}"
  echo ""
  echo "Possíveis causas:"
  echo "  • Credenciais incorretas"
  echo "  • Proxy não acessível (verifique se está na rede corporativa)"
  echo "  • Firewall bloqueando conexões"
  echo "  • Certificados SSL inválidos"
  echo ""
  echo "Consulte o README para mais informações:"
  echo -e "  ${BLUE}.qwen/FLOW_PROXY_README.md${NC}"
  echo ""
  exit 1
fi
