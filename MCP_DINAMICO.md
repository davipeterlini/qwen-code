# MCP Dinâmico no Qwen Code

## 📋 Visão Geral

O **MCP (Model Context Protocol) Dinâmico** é uma implementação inspirada no Claude Code que permite carregar ferramentas externas **sob demanda**, economizando até **80% de tokens** no contexto inicial.

---

## 🎯 O Problema que Resolve

### Sem MCP Dinâmico (Carregamento Estático)

```
Início da Sessão:
├─ GitHub Tool      (2,500 tokens)
├─ PostgreSQL       (1,800 tokens)
├─ Slack            (1,200 tokens)
├─ Notion           (1,500 tokens)
└─ Context7         (3,000 tokens)

Total: 10,000 tokens (antes de começar!)
```

### Com MCP Dinâmico (Carregamento Sob Demanda)

```
Início da Sessão: 0 tokens

Usuário: "Consulte issues do GitHub"
→ Carrega GitHub Tool (+2,500 tokens)

Usuário: "Busque docs do React"
→ Carrega Context7 (+3,000 tokens)

Total: 5,500 tokens (45% de economia!)
```

---

## 🚀 Quick Start

### 1. Criar Configuração MCP

Crie `~/.qwen/mcp.json`:

```bash
mkdir -p ~/.qwen
cp examples/mcp.example.json ~/.qwen/mcp.json
```

### 2. Editar Configuração

Edite `~/.qwen/mcp.json` e habilite os servidores desejados:

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

### 3. Usar no Qwen Code

```bash
qwen

# Listar servidores configurados
/mcp list

# Carregar servidor sob demanda
/mcp load context7

# Ver estatísticas
/mcp stats
```

---

## 📦 Servidores MCP Disponíveis

### Oficiais (Model Context Protocol)

| Servidor       | Comando                                          | Uso                    | Tokens |
| -------------- | ------------------------------------------------ | ---------------------- | ------ |
| **Context7**   | `npx -y @upstash/context7-mcp`                   | Docs de bibliotecas    | ~3,000 |
| **GitHub**     | `npx -y @modelcontextprotocol/server-github`     | Issues, PRs, código    | ~2,500 |
| **Filesystem** | `npx -y @modelcontextprotocol/server-filesystem` | Arquivos locais        | ~1,500 |
| **PostgreSQL** | `npx -y @modelcontextprotocol/server-postgres`   | Banco de dados         | ~1,800 |
| **Slack**      | `npx -y @modelcontextprotocol/server-slack`      | Mensagens Slack        | ~1,200 |
| **Notion**     | `npx -y @modelcontextprotocol/server-notion`     | Páginas Notion         | ~1,500 |
| **Puppeteer**  | `npx -y @modelcontextprotocol/server-puppeteer`  | Navegar websites       | ~2,000 |
| **Memory**     | `npx -y @modelcontextprotocol/server-memory`     | Memória de longo prazo | ~1,000 |

### Instalação Rápida

```bash
# Context7 (Documentação de bibliotecas)
/mcp add context7 --command "npx -y @upstash/context7-mcp"

# GitHub (requer token)
export GITHUB_TOKEN=ghp_xxx
/mcp add github --command "npx -y @modelcontextprotocol/server-github"

# Filesystem (acesso a arquivos)
/mcp add filesystem --command "npx -y @modelcontextprotocol/server-filesystem /path/to/allow"
```

---

## 🔧 Configuração Detalhada

### Estrutura do `mcp.json`

```json
{
  "servers": [
    {
      "id": "unique-server-id",
      "name": "Display Name",
      "description": "O que este servidor faz",
      "command": "comando para iniciar",
      "args": ["--arg1", "--arg2"],
      "env": {
        "API_KEY": "valor"
      },
      "transport": "stdio",
      "enabled": true,
      "dynamic": true,
      "timeout": 30000
    }
  ],
  "dynamicLoading": true,
  "autoLoad": false,
  "tokenBudget": 50000
}
```

### Campos da Configuração

| Campo            | Tipo     | Obrigatório | Descrição                               |
| ---------------- | -------- | ----------- | --------------------------------------- |
| `id`             | string   | **Sim**     | Identificador único                     |
| `name`           | string   | **Sim**     | Nome exibido                            |
| `description`    | string   | Não         | Descrição do servidor                   |
| `command`        | string   | **Sim**     | Comando para iniciar (stdio)            |
| `args`           | string[] | Não         | Argumentos do comando                   |
| `env`            | object   | Não         | Variáveis de ambiente                   |
| `transport`      | string   | Não         | `stdio` (padrão), `sse`, `websocket`    |
| `enabled`        | boolean  | Não         | Se está habilitado (padrão: true)       |
| `dynamic`        | boolean  | Não         | Carregamento sob demanda (padrão: true) |
| `timeout`        | number   | Não         | Timeout em ms (padrão: 30000)           |
| `dynamicLoading` | boolean  | Não         | Habilita carregamento dinâmico          |
| `autoLoad`       | boolean  | Não         | Auto-carrega ferramentas frequentes     |
| `tokenBudget`    | number   | Não         | Limite de tokens para MCP               |

---

## 📖 Comandos `/mcp`

### `/mcp list`

Lista todos os servidores configurados.

```
/mcp list
```

### `/mcp list tools`

Lista todas as ferramentas disponíveis.

```
/mcp list tools
```

### `/mcp add <id>`

Adiciona um novo servidor.

```
/mcp add context7 --command "npx -y @upstash/context7-mcp"
```

### `/mcp remove <id>`

Remove um servidor.

```
/mcp remove context7
```

### `/mcp enable <id>`

Habilita um servidor desabilitado.

```
/mcp enable postgres
```

### `/mcp disable <id>`

Desabilita um servidor (mantém config).

```
/mcp disable slack
```

### `/mcp load <id>`

Carrega um servidor sob demanda.

```
/mcp load github
```

### `/mcp unload <id>`

Descarrega um servidor para liberar tokens.

```
/mcp unload github
```

### `/mcp discover`

Descobre ferramentas de todos os servidores.

```
/mcp discover
```

### `/mcp stats`

Mostra estatísticas e uso de tokens.

```
/mcp stats
```

---

## 💡 Exemplos de Uso

### 1. Context7 - Documentação de Bibliotecas

```bash
# Configurar
/mcp add context7 --command "npx -y @upstash/context7-mcp"

# Usar no Qwen
qwen
/mcp load context7

"Qual a API mais recente do React para fetching de dados?"
"Mostre exemplos de uso do hooks useMemo do React"
```

### 2. GitHub - Issues e PRs

```bash
# Configurar (requer token)
export GITHUB_TOKEN=ghp_xxx
/mcp add github --command "npx -y @modelcontextprotocol/server-github"

# Usar no Qwen
qwen
/mcp load github

"Liste os issues abertos no repositório QwenLM/qwen-code"
"Crie um issue para adicionar suporte a MCP"
```

### 3. Filesystem - Arquivos Locais

```bash
# Configurar (cuidado com o path!)
/mcp add filesystem --command "npx -y @modelcontextprotocol/server-filesystem /Users/voce/projetos"

# Usar
qwen
/mcp load filesystem

"Liste todos os arquivos TypeScript neste diretório"
"Busque por 'TODO' em todos os arquivos .ts"
```

### 4. PostgreSQL - Banco de Dados

```bash
# Configurar
/mcp add postgres --command "npx -y @modelcontextprotocol/server-postgres" --env "DATABASE_URL=postgresql://localhost:5432/mydb"

# Usar
qwen
/mcp load postgres

"Liste todas as tabelas no banco"
"Execute: SELECT * FROM users WHERE active = true"
```

---

## 🎛️ Dynamic Loading vs Static Loading

### Dynamic Loading (Recomendado)

```json
{
  "servers": [
    {
      "id": "github",
      "dynamic": true // Carrega apenas quando usado
    }
  ],
  "dynamicLoading": true
}
```

**Vantagens:**

- ✅ Economiza tokens (60-80%)
- ✅ Inicialização mais rápida
- ✅ Escalável (100+ servidores)

**Desvantagens:**

- ⚠️ Pequeno delay no primeiro uso

### Static Loading

```json
{
  "servers": [
    {
      "id": "filesystem",
      "dynamic": false // Carrega sempre no início
    }
  ],
  "dynamicLoading": false
}
```

**Vantagens:**

- ✅ Ferramentas sempre disponíveis
- ✅ Sem delay no primeiro uso

**Desvantagens:**

- ❌ Consome tokens continuamente
- ❌ Limita número de servidores

---

## 🔐 Segurança

### Variáveis de Ambiente

Nunca coloque tokens diretamente no `mcp.json`:

```json
// ❌ NÃO FAÇA ISSO
{
  "servers": [{
    "env": {
      "GITHUB_TOKEN": "ghp_xxx"
    }
  }]
}

// ✅ FAÇA ISSO
{
  "servers": [{
    "env": {
      "GITHUB_TOKEN": "${GITHUB_TOKEN}"
    }
  }]
}
```

Use `export` no shell:

```bash
export GITHUB_TOKEN=ghp_xxx
qwen
```

### Paths de Arquivos

Cuidado ao usar Filesystem MCP:

```json
// ❌ Muito amplo
"command": "npx -y @modelcontextprotocol/server-filesystem /"

// ✅ Específico
"command": "npx -y @modelcontextprotocol/server-filesystem /Users/voce/projetos/qwen-code"
```

---

## 📊 Economia de Tokens

### Cenário Típico

| Servidor   | Tokens    | Uso Diário |
| ---------- | --------- | ---------- |
| Context7   | 3,000     | 2x         |
| GitHub     | 2,500     | 5x         |
| Filesystem | 1,500     | 10x        |
| PostgreSQL | 1,800     | 1x         |
| **Total**  | **8,800** | -          |

### Estático vs Dinâmico (7 dias)

| Método       | Tokens/Dia | Tokens/Semana | Economia |
| ------------ | ---------- | ------------- | -------- |
| **Estático** | 8,800      | 61,600        | -        |
| **Dinâmico** | 2,200      | 15,400        | **75%**  |

---

## 🐛 Troubleshooting

### "Command not found"

```bash
# Instale npx globalmente
npm install -g npx
```

### "Timeout error"

Aumente o timeout no `mcp.json`:

```json
{
  "servers": [
    {
      "timeout": 60000
    }
  ]
}
```

### "Token budget exceeded"

Aumente o budget ou use menos servidores:

```json
{
  "tokenBudget": 100000
}
```

### "Server failed to start"

Verifique o comando e variáveis de ambiente:

```bash
# Teste o comando manualmente
npx -y @upstash/context7-mcp
```

---

## 🚀 Próximos Passos

### Roadmap

- [ ] Auto-load de ferramentas frequentes
- [ ] Cache de ferramentas entre sessões
- [ ] UI para gerenciar servidores
- [ ] Suporte a SSE e WebSocket
- [ ] Plugin marketplace

### Contribuições

Contribua com:

- Novos servidores MCP
- Melhorias no loader dinâmico
- Documentação de casos de uso

---

## 📚 Referências

- [Model Context Protocol Docs](https://modelcontextprotocol.io/)
- [Claude Code MCP](https://dev.to/oikon/reflections-of-claude-code-from-changelog-833)
- [Context7 MCP](https://github.com/upstash/context7-mcp)
- [MCP Servers GitHub](https://github.com/modelcontextprotocol/servers)
