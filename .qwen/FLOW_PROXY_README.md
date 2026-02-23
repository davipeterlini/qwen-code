# Configuração de Proxy Flow para Qwen Code

Este guia detalha como configurar o Qwen Code para usar o proxy corporativo Flow.

---

## 🚀 Guia Rápido - Proxy Flow Local

**Seu proxy está em:** `~/projects-cit/flow/flow-llm-proxy`

### Método 1: Via Variáveis de Ambiente (MAIS SIMPLES)

1. **Adicione ao seu `~/.zshrc`:**

   ```bash
   # Flow LLM Proxy
   export HTTP_PROXY=http://localhost:8080
   export HTTPS_PROXY=http://localhost:8080
   export NO_PROXY=localhost,127.0.0.1
   ```

   _Ajuste a porta (8080) se seu proxy usa outra!_

2. **Recarregue o shell:**

   ```bash
   source ~/.zshrc
   ```

3. **Inicie o proxy Flow:**

   ```bash
   cd ~/projects-cit/flow/flow-llm-proxy
   npm start  # ou o comando que você usa
   ```

4. **Use o Qwen:**
   ```bash
   qwen "Hello, world!"
   ```

### Método 2: Via Arquivo de Configuração

1. **Crie `~/.qwen/.env.flow.local`:**

   ```env
   HTTP_PROXY=http://localhost:8080
   HTTPS_PROXY=http://localhost:8080
   NO_PROXY=localhost,127.0.0.1
   ```

2. **Carregue antes de usar:**
   ```bash
   source ~/.qwen/.env.flow.local
   qwen "seu comando"
   ```

### Resumo - 3 comandos

```bash
# 1. Inicie o proxy Flow
cd ~/projects-cit/flow/flow-llm-proxy && npm start

# 2. Configure variáveis (em outro terminal)
export HTTP_PROXY=http://localhost:8080 HTTPS_PROXY=http://localhost:8080

# 3. Use o Qwen
qwen "seu comando"
```

---

## Arquivos de Configuração

- **`flow-proxy.json`** - Configuração principal do proxy Flow (estruturada)
- **`.env.flow`** - Variáveis de ambiente para o proxy Flow
- **`flow-proxy-schema.json`** - Schema JSON para validação

## Setup Rápido

### Opção 1: Usando Variáveis de Ambiente (Recomendado)

```bash
# 1. Copiar e editar o arquivo de ambiente
cp .qwen/.env.flow .qwen/.env.flow.local

# 2. Editar com suas credenciais
nano .qwen/.env.flow.local

# 3. Carregar as variáveis
source .qwen/.env.flow.local

# 4. Verificar se funcionou
env | grep PROXY
```

### Opção 2: Usando Configuração JSON

```bash
# 1. Copiar e editar a configuração
cp .qwen/flow-proxy.json .qwen/flow-proxy.local.json

# 2. Editar com suas credenciais
nano .qwen/flow-proxy.local.json

# 3. Usar com Qwen Code
qwen --proxy-config .qwen/flow-proxy.local.json
```

## Configuração Detalhada

### 1. Configurar Credenciais

Edite `.qwen/.env.flow.local`:

```bash
# Suas credenciais Flow
FLOW_PROXY_USER=seu_usuario_corporativo
FLOW_PROXY_PASSWORD=sua_senha_segura

# Servidor proxy (geralmente não precisa mudar)
FLOW_PROXY_HOST=proxy.flow.company.com
FLOW_PROXY_PORT=8080
```

### 2. Configurar Certificado SSL (Opcional)

Se sua empresa usa certificados SSL próprios:

```bash
# Baixar o certificado CA corporativo
# (peça ao time de TI ou baixe do portal interno)

# Configurar caminho do certificado
FLOW_CA_CERT_PATH=/path/to/flow-ca-bundle.crt
NODE_EXTRA_CA_CERTS=/path/to/flow-ca-bundle.crt
```

### 3. Carregar Configuração

```bash
# Método 1: Source direto
source .qwen/.env.flow.local

# Método 2: Export em uma linha
export $(cat .qwen/.env.flow.local | grep -v '^#' | grep -v '^$' | xargs)

# Método 3: Adicionar ao seu shell profile
echo 'source ~/projects/qwen-code/.qwen/.env.flow.local' >> ~/.zshrc
```

## Testando a Configuração

### 1. Verificar Variáveis de Ambiente

```bash
# Ver todas as variáveis de proxy
env | grep -i proxy

# Ver configuração Flow específica
env | grep FLOW
```

### 2. Testar Conectividade do Proxy

```bash
# Testar se o proxy está acessível
telnet proxy.flow.company.com 8080

# Testar conexão HTTP através do proxy
curl -x http://proxy.flow.company.com:8080 https://www.google.com

# Testar com autenticação
curl -x http://seu_usuario:sua_senha@proxy.flow.company.com:8080 https://www.google.com
```

### 3. Testar com APIs

```bash
# Testar OpenAI através do proxy
curl -x $HTTP_PROXY https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Testar Dashscope através do proxy
curl -x $HTTP_PROXY https://dashscope.aliyuncs.com/compatible-mode/v1/models \
  -H "Authorization: Bearer $DASHSCOPE_API_KEY"

# Testar Anthropic através do proxy
curl -x $HTTP_PROXY https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

### 4. Testar com Qwen Code

```bash
# Teste simples
qwen "Hello, world!"

# Com debug habilitado
PROXY_LOG_LEVEL=debug qwen "Test proxy connection"

# Ver logs detalhados de rede
NODE_DEBUG=http,https qwen "Test with detailed logs"
```

## Configuração por Ambiente

### Desenvolvimento Local (sem proxy)

```bash
# Desabilitar proxy temporariamente
unset HTTP_PROXY HTTPS_PROXY
unset FLOW_PROXY_USER FLOW_PROXY_PASSWORD

qwen
```

### Ambiente Corporativo (com proxy Flow)

```bash
# Carregar configuração Flow
source .qwen/.env.flow.local

# Verificar
echo $HTTP_PROXY

# Usar Qwen normalmente
qwen
```

### Home Office / VPN

```bash
# Geralmente não precisa de proxy quando em VPN
unset HTTP_PROXY HTTPS_PROXY

# Ou use auto-detect
export PROXY_AUTO_DETECT=true
```

## Integração com ferramentas

### Git

```bash
# Configurar git para usar o proxy Flow
git config --global http.proxy $HTTP_PROXY
git config --global https.proxy $HTTPS_PROXY

# Desabilitar para hosts internos
git config --global http.https://github.com-davipeterlini.proxy ""
```

### npm/yarn

```bash
# npm
npm config set proxy $HTTP_PROXY
npm config set https-proxy $HTTPS_PROXY

# yarn
yarn config set proxy $HTTP_PROXY
yarn config set https-proxy $HTTPS_PROXY
```

### Docker

Adicionar ao `~/.docker/config.json`:

```json
{
  "proxies": {
    "default": {
      "httpProxy": "http://proxy.flow.company.com:8080",
      "httpsProxy": "http://proxy.flow.company.com:8080",
      "noProxy": "localhost,127.0.0.1,*.local"
    }
  }
}
```

## Troubleshooting

### Erro: "Unable to connect"

```bash
# 1. Verificar se proxy está acessível
ping proxy.flow.company.com
telnet proxy.flow.company.com 8080

# 2. Verificar credenciais
echo $FLOW_PROXY_USER
# (não mostre a senha no terminal!)

# 3. Testar conexão direta
curl https://www.google.com

# 4. Testar com proxy
curl -x $HTTP_PROXY https://www.google.com
```

### Erro: "407 Proxy Authentication Required"

```bash
# Verificar formato das credenciais
echo $HTTP_PROXY
# Deve ser: http://usuario:senha@proxy.flow.company.com:8080

# Verificar se caracteres especiais na senha estão codificados
# Se sua senha tem @ # % etc, use URL encoding:
# @ -> %40
# # -> %23
# % -> %25

# Exemplo com senha especial:
export FLOW_PROXY_PASSWORD='S3nh@Esp3c!al'
# Codificar: S3nh%40Esp3c%21al
```

### Erro: "SSL certificate problem"

```bash
# Opção 1: Instalar certificado CA corporativo
export NODE_EXTRA_CA_CERTS=/path/to/flow-ca-bundle.crt

# Opção 2: Desabilitar verificação SSL (NÃO recomendado para produção)
export NODE_TLS_REJECT_UNAUTHORIZED=0

# Opção 3: Atualizar certificados do sistema
# macOS:
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain /path/to/flow-ca.crt

# Linux:
sudo cp /path/to/flow-ca.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

### Erro: "ETIMEDOUT" ou "ECONNRESET"

```bash
# Aumentar timeout
export PROXY_TIMEOUT=60000
export REQUEST_TIMEOUT=120000

# Habilitar retry
export MAX_RETRIES=5
export RETRY_DELAY=2000

# Verificar firewall
# Certifique-se de que portas 80, 443, 8080 estão abertas
```

### Debug Avançado

```bash
# Habilitar todos os logs
export NODE_DEBUG=http,https,tls,net
export PROXY_LOG_LEVEL=trace
export DEBUG=*

# Capturar tráfego de rede
# macOS:
sudo tcpdump -i any -w proxy-debug.pcap host proxy.flow.company.com

# Linux:
sudo tcpdump -i any -w proxy-debug.pcap host proxy.flow.company.com

# Analisar depois com Wireshark
```

## Segurança

### ⚠️ Boas Práticas

1. **NUNCA commite credenciais**

   ```bash
   # Adicione ao .gitignore
   echo '.qwen/.env.flow.local' >> .gitignore
   echo '.qwen/flow-proxy.local.json' >> .gitignore
   ```

2. **Use variáveis de ambiente do sistema**

   ```bash
   # Adicione ao ~/.zshrc ou ~/.bashrc
   export FLOW_PROXY_USER='seu_usuario'
   export FLOW_PROXY_PASSWORD='sua_senha'
   ```

3. **Use um gerenciador de senhas**
   - 1Password CLI
   - LastPass CLI
   - Vault
   - AWS Secrets Manager

4. **Rotacione senhas regularmente**
   - Configure lembretes para trocar senha a cada 90 dias
   - Use senhas fortes e únicas

5. **Limite escopo de NO_PROXY**
   ```bash
   # Seja específico sobre hosts que não usam proxy
   NO_PROXY=localhost,127.0.0.1,*.flow.internal
   ```

### Exemplo com 1Password

```bash
# Armazenar credenciais no 1Password
op item create --category=login \
  --title="Flow Proxy" \
  username="seu_usuario" \
  password="sua_senha"

# Carregar credenciais
export FLOW_PROXY_USER=$(op read "op://Private/Flow Proxy/username")
export FLOW_PROXY_PASSWORD=$(op read "op://Private/Flow Proxy/password")
```

## Scripts Úteis

### script: flow-proxy-enable.sh

```bash
#!/bin/bash
# Habilitar proxy Flow

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Carregar configuração
source "$SCRIPT_DIR/.env.flow.local"

# Validar
if [[ -z "$FLOW_PROXY_USER" ]] || [[ -z "$FLOW_PROXY_PASSWORD" ]]; then
  echo "❌ Erro: Credenciais não configuradas"
  echo "Edite .qwen/.env.flow.local primeiro"
  exit 1
fi

# Exportar variáveis
export HTTP_PROXY="http://${FLOW_PROXY_USER}:${FLOW_PROXY_PASSWORD}@${FLOW_PROXY_HOST}:${FLOW_PROXY_PORT}"
export HTTPS_PROXY="$HTTP_PROXY"
export NO_PROXY="localhost,127.0.0.1,*.local,*.internal,*.flow.company.com"

echo "✅ Proxy Flow habilitado"
echo "   Proxy: $FLOW_PROXY_HOST:$FLOW_PROXY_PORT"
echo "   User: $FLOW_PROXY_USER"
```

### script: flow-proxy-disable.sh

```bash
#!/bin/bash
# Desabilitar proxy Flow

unset HTTP_PROXY
unset HTTPS_PROXY
unset NO_PROXY
unset FLOW_PROXY_USER
unset FLOW_PROXY_PASSWORD
unset FLOW_PROXY_HOST
unset FLOW_PROXY_PORT

echo "✅ Proxy Flow desabilitado"
```

### script: flow-proxy-test.sh

```bash
#!/bin/bash
# Testar conexão através do proxy Flow

echo "🔍 Testando proxy Flow..."
echo ""

# Verificar variáveis
echo "1. Verificando variáveis de ambiente..."
if [[ -z "$HTTP_PROXY" ]]; then
  echo "❌ HTTP_PROXY não configurado"
  exit 1
fi
echo "✅ HTTP_PROXY: $HTTP_PROXY"
echo ""

# Testar conectividade do proxy
echo "2. Testando conectividade do proxy..."
if timeout 5 bash -c "echo > /dev/tcp/${FLOW_PROXY_HOST}/${FLOW_PROXY_PORT}"; then
  echo "✅ Proxy acessível"
else
  echo "❌ Proxy não acessível"
  exit 1
fi
echo ""

# Testar conexão HTTP
echo "3. Testando conexão HTTP através do proxy..."
if curl -x "$HTTP_PROXY" -s -o /dev/null -w "%{http_code}" https://www.google.com | grep -q "200"; then
  echo "✅ Conexão HTTP funcionando"
else
  echo "❌ Erro na conexão HTTP"
  exit 1
fi
echo ""

# Testar API OpenAI
echo "4. Testando API OpenAI..."
if [[ -n "$OPENAI_API_KEY" ]]; then
  if curl -x "$HTTP_PROXY" -s -o /dev/null -w "%{http_code}" \
    https://api.openai.com/v1/models \
    -H "Authorization: Bearer $OPENAI_API_KEY" | grep -q "200"; then
    echo "✅ OpenAI API acessível"
  else
    echo "⚠️  OpenAI API não acessível"
  fi
else
  echo "⚠️  OPENAI_API_KEY não configurado"
fi
echo ""

echo "✅ Todos os testes passaram!"
```

## Suporte

### Documentação Relacionada

- [Documentação Geral](.qwen/CLAUDE.md)
- [Exemplos de Configuração](.qwen/settings.example.json)
- [Variáveis de Ambiente](.qwen/env.example)

### Contatos

- **Time de TI**: suporte-ti@flow.company.com
- **Configuração de Proxy**: proxy-admin@flow.company.com
- **Qwen Code Issues**: https://github.com/QwenLM/qwen-code/issues

### FAQ

**P: Preciso configurar o proxy toda vez que usar o Qwen?**
R: Não, adicione `source .qwen/.env.flow.local` ao seu `~/.zshrc` ou `~/.bashrc`

**P: O proxy funciona com outros modelos além do Qwen?**
R: Sim, funciona com OpenAI, Anthropic, Google Gemini, etc.

**P: Posso usar diferentes proxies para diferentes projetos?**
R: Sim, crie um arquivo `.env.flow.local` em cada projeto

**P: Como saber se estou usando o proxy?**
R: Execute `echo $HTTP_PROXY` ou habilite logs com `PROXY_LOG_LEVEL=debug`

**P: O proxy afeta a performance?**
R: Pode adicionar latência mínima (~50-200ms), mas é necessário em redes corporativas

---

**Última atualização:** 2026-02-19
**Versão:** 1.0.0
