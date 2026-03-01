# 📊 Guia Completo de Benchmark - Qwen Code CLI vs Claude Code

> **Versão:** 2.0.0
> **Última atualização:** Fevereiro de 2026
> **Objetivo:** Comparar performance e qualidade entre Qwen Code (aplicação buildada) e Claude Code CLI executando testes diretamente no terminal

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Preparação do Ambiente](#preparação-do-ambiente)
3. [Metodologia de Benchmark](#metodologia-de-benchmark)
4. [Suite de Testes Rápidos](#suite-de-testes-rápidos)
5. [Executando os Testes](#executando-os-testes)
6. [Métricas de Avaliação](#métricas-de-avaliação)
7. [Planilha de Resultados](#planilha-de-resultados)
8. [Análise Comparativa](#análise-comparativa)

---

## Visão Geral

### 🎯 Objetivos do Benchmark

Este guia fornece metodologia prática para comparar **diretamente no terminal**:

| CLI             | Comando                              | Descrição                                       |
| --------------- | ------------------------------------ | ----------------------------------------------- |
| **Qwen Code**   | `node dist/cli.js` ou `npm run qwen` | Aplicação Qwen buildada (desenvolvimento local) |
| **Claude Code** | `claude`                             | CLI da Anthropic (referência de mercado)        |

**O que avaliar:**

1. **Qualidade de Código** - Correção, legibilidade, melhores práticas
2. **Tempo de Resposta** - Velocidade de geração
3. **Experiência do Usuário** - Fluxo de trabalho, ergonomia
4. **Recursos Avançados** - Hooks, Skills, MCP, Subagents

### 🚀 Abordagem Simplificada

Ao invés de testes complexos, este guia foca em:

- ✅ **Testes diretos no terminal** - Use `node dist/cli.js` e `claude` diretamente
- ✅ **Prompts rápidos** - Testes de 1-5 minutos cada
- ✅ **Comparação lado a lado** - Mesmo prompt, ambas CLIs
- ✅ **Avaliação subjetiva** - Sua percepção de qualidade

### 📊 Comparativo Direto

```bash
# Exemplo de teste comparativo
node dist/cli.js "Crie uma função TypeScript que valide emails"
claude "Create a TypeScript function that validates emails"
```

### ⚠️ Importante: Condições Justas

Para garantir comparativo **justo e real**:

- ✅ **Mesmo projeto** de teste (diretório limpo)
- ✅ **Mesmos prompts** (traduzidos quando necessário)
- ✅ **Mesmo contexto** inicial (zero-state, sem histórico)
- ✅ **Mesmas condições** de rede/hardware

---

## Preparação do Ambiente

### 🖥️ Requisitos Mínimos

| Componente   | Requisito               |
| ------------ | ----------------------- |
| **Node.js**  | >= 20.0.0               |
| **npm**      | >= 9.0.0                |
| **Git**      | Qualquer versão recente |
| **Terminal** | bash, zsh, ou similar   |

### 📦 Instalação das CLIs

#### 1. Qwen Code (Aplicação Buildada)

```bash
# No diretório do projeto qwen-code
npm install

# Build da aplicação
npm run build

# Verificar build
ls -la dist/cli.js

# Opcional: criar alias para facilitar
alias qwen="node $(pwd)/dist/cli.js"

# Verificar instalação
node dist/cli.js --version
```

#### 2. Claude Code CLI

```bash
# Instalar globalmente
npm install -g @anthropic-ai/claude-code

# Ou usar npx (sem instalação permanente)
npx @anthropic-ai/claude-code --version

# Verificar instalação
claude --version
```

### 🔧 Setup do Projeto de Teste

#### Criar Diretório de Benchmark

```bash
# Criar diretório limpo para testes
mkdir -p ~/benchmark-cli
cd ~/benchmark-cli

# Inicializar projeto Node.js
npm init -y

# Criar estrutura básica
mkdir -p src tests
```

#### Estrutura Recomendada

```
benchmark-cli/
├── src/
│   └── (código gerado pelos testes)
├── tests/
│   └── (testes gerados)
├── package.json
└── README.md
```

#### Limpar Antes de Cada Teste

```bash
# Script de limpeza (executar antes de cada teste)
rm -rf src/* tests/*
git clean -fdx  # Remove todos arquivos não versionados
```

---

## Metodologia de Benchmark

### 📐 Abordagem Simplificada

Cada teste segue o padrão:

```
1. Limpar diretório (git clean -fdx)
2. Executar prompt no Qwen (node dist/cli.js)
3. Cronometrar tempo (time command ou percepção)
4. Salvar resultado
5. Limpar diretório
6. Executar mesmo prompt no Claude
7. Comparar resultados
```

### 🎯 Critérios de Avaliação

#### 1. **Correção Funcional** (0-10)

| Nota | Critério                      |
| ---- | ----------------------------- |
| 10   | Funciona perfeitamente        |
| 8-9  | Funciona, pequenos ajustes    |
| 6-7  | Funciona parcialmente         |
| 4-5  | Requer ajustes significativos |
| 0-3  | Não funciona                  |

#### 2. **Qualidade de Código** (0-10)

| Nota | Critério                       |
| ---- | ------------------------------ |
| 10   | Production-ready, testes, docs |
| 8-9  | Bom código, precisa de testes  |
| 6-7  | Código aceitável               |
| 4-5  | Código fraco                   |
| 0-3  | Código inutilizável            |

#### 3. **Consumo de Tokens** (métricas reais)

| Métrica              | Descrição                     | Como medir                    |
| -------------------- | ----------------------------- | ----------------------------- |
| **Tokens de Input**  | Tokens enviados na requisição | Output da CLI ou logs         |
| **Tokens de Output** | Tokens gerados na resposta    | Output da CLI ou logs         |
| **Total de Tokens**  | Input + Output                | Soma das métricas             |
| **Custo Estimado**   | Preço da requisição           | Calculado com base nos tokens |

#### 4. **Tempo de Resposta** (segundos)

| Nota | Tempo  |
| ---- | ------ |
| 10   | < 5s   |
| 8-9  | 5-10s  |
| 6-7  | 10-20s |
| 4-5  | 20-40s |
| 0-3  | > 40s  |

#### 5. **Experiência do Usuário** (0-10)

| Nota | Critério                    |
| ---- | --------------------------- |
| 10   | Fluxo perfeito, zero atrito |
| 8-9  | Bom fluxo, minor atritos    |
| 6-7  | Fluxo aceitável             |
| 4-5  | Fluxo problemático          |
| 0-3  | Fluxo quebrado              |

### 📊 Fórmula de Score Final

```
Score = (Correção × 0.25) +
        (Qualidade × 0.25) +
        (Eficiência Tokens × 0.20) +
        (Tempo Normalizado × 0.15) +
        (UX × 0.15)

Onde:
- Tempo Normalizado = max(0, 10 - (tempo_segundos / 5))
- Eficiência Tokens = 10 - ((total_tokens - baseline) / baseline × 5)
```

### 🔍 Como Medir Tokens

#### Qwen Code (node dist/cli.js)

```bash
# Habilitar logs detalhados
export DEBUG=qwen*
node dist/cli.js "<prompt>" 2>&1 | grep -E "(tokens|usage|input|output)"

# Ou verificar output direto (algumas CLIs mostram no final)
node dist/cli.js "<prompt>"
```

#### Claude Code

```bash
# Claude Code geralmente mostra tokens no output
claude "<prompt>"

# Ou usar verbose mode
claude "<prompt>" --verbose
```

#### Script para Extrair Tokens

```bash
#!/bin/bash
# extract-tokens.sh

OUTPUT_FILE=$1

# Extrair tokens de input
INPUT_TOKENS=$(grep -oP 'input tokens: \K\d+' $OUTPUT_FILE || echo 0)

# Extrair tokens de output
OUTPUT_TOKENS=$(grep -oP 'output tokens: \K\d+' $OUTPUT_FILE || echo 0)

# Total
TOTAL=$((INPUT_TOKENS + OUTPUT_TOKENS))

echo "Input: $INPUT_TOKENS tokens"
echo "Output: $OUTPUT_TOKENS tokens"
echo "Total: $TOTAL tokens"

# Calcular custo estimado (exemplo: $0.0001/1K input, $0.0003/1K output)
COST=$(echo "scale=6; ($INPUT_TOKENS * 0.0001 + $OUTPUT_TOKENS * 0.0003) / 1000" | bc)
echo "Custo estimado: \$${COST}"
```

---

## Suite de Testes Rápidos

### 🧪 Como Usar

Cada teste deve ser executado **primeiro no Qwen (buildado)**, depois no `claude`.

**Template de execução:**

```bash
# 0. Ir para diretório do qwen-code (para usar dist/cli.js)
cd /path/to/qwen-code

# 1. Limpar ambiente de teste
cd ~/benchmark-cli && git clean -fdx

# 2. Executar no Qwen (cronometre e capture tokens)
time node /path/to/qwen-code/dist/cli.js "<PROMPT>" 2>&1 | tee qwen-output-test-01.txt

# 3. Extrair tokens do output
./scripts/extract-tokens.sh qwen-output-test-01.txt

# 4. Salvar resultado
cp -r src qwen-result-test-01

# 5. Limpar e executar no Claude
git clean -fdx
time claude "<PROMPT>" 2>&1 | tee claude-output-test-01.txt

# 6. Extrair tokens do output
./scripts/extract-tokens.sh claude-output-test-01.txt

# 7. Salvar resultado
cp -r src claude-result-test-01

# 8. Comparar
diff -r qwen-result-test-01 claude-result-test-01
```

### 🛠️ Script de Automação com Tokens

Crie um script para facilitar:

```bash
#!/bin/bash
# benchmark.sh

QWEN_CLI="/path/to/qwen-code/dist/cli.js"
BENCHMARK_DIR=~/benchmark-cli
RESULTS_DIR=~/benchmark-results/$(date +%Y%m%d-%H%M%S)

mkdir -p $RESULTS_DIR

run_test() {
  local test_num=$1
  local prompt=$2

  echo "🧪 Teste $test_num: $prompt"

  # Limpar
  cd $BENCHMARK_DIR && git clean -fdx

  # Qwen
  echo "⏳ Executando Qwen..."
  START_TIME=$(date +%s.%N)
  node $QWEN_CLI "$prompt" 2>&1 | tee $RESULTS_DIR/qwen-test-$test_num.txt
  END_TIME=$(date +%s.%N)
  QWEN_TIME=$(echo "$END_TIME - $START_TIME" | bc)

  # Extrair tokens Qwen
  ./scripts/extract-tokens.sh $RESULTS_DIR/qwen-test-$test_num.txt > $RESULTS_DIR/qwen-tokens-$test_num.txt

  # Salvar código
  cp -r src $RESULTS_DIR/qwen-code-$test_num

  # Limpar
  git clean -fdx

  # Claude
  echo "⏳ Executando Claude..."
  START_TIME=$(date +%s.%N)
  claude "$prompt" 2>&1 | tee $RESULTS_DIR/claude-test-$test_num.txt
  END_TIME=$(date +%s.%N)
  CLAUDE_TIME=$(echo "$END_TIME - $START_TIME" | bc)

  # Extrair tokens Claude
  ./scripts/extract-tokens.sh $RESULTS_DIR/claude-test-$test_num.txt > $RESULTS_DIR/claude-tokens-$test_num.txt

  # Salvar código
  cp -r src $RESULTS_DIR/claude-code-$test_num

  # Registrar métricas
  echo "$test_num,$QWEN_TIME,$CLAUDE_TIME" >> $RESULTS_DIR/metrics.csv

  echo "✅ Teste $test_num completo!"
  echo "   Qwen: ${QWEN_TIME}s"
  echo "   Claude: ${CLAUDE_TIME}s"
}

# Exemplo de uso
# run_test 1 "Crie uma função TypeScript que valide emails"
```

---

### 🧪 Teste 1: Validação de Email (Básico)

**Tempo estimado:** 1-2 minutos

**Prompt (Qwen):**

```
Crie uma função TypeScript que valide emails.
A função deve:
1. Verificar formato básico (texto@texto.texto)
2. Retornar boolean
3. Incluir JSDoc
4. Exportar a função

Nome: validateEmail
Arquivo: src/validateEmail.ts
```

**Prompt (Claude):**

```
Create a TypeScript function that validates emails.
Requirements:
1. Check basic format (text@text.text)
2. Return boolean
3. Include JSDoc
4. Export the function

Name: validateEmail
File: src/validateEmail.ts
```

**Critérios:**

- ✅ Regex funcional
- ✅ Tipagem correta
- ✅ Documentação JSDoc
- ✅ Exportação correta

---

### 🧪 Teste 2: Refatoração (Intermediário)

**Tempo estimado:** 2-3 minutos

**Prompt (Qwen):**

````
Refatore esta função para melhorar performance e legibilidade:

```typescript
function processData(data) {
  var result = [];
  for (var i = 0; i < data.length; i++) {
    if (data[i].active == true) {
      var item = data[i];
      item.processed = true;
      result.push(item);
    }
  }
  return result;
}
````

Use TypeScript, tipos adequados, e métodos funcionais.
Arquivo: src/processData.ts

```

**Prompt (Claude):**
```

Refactor this function for better performance and readability:

[Paste same code]

Use TypeScript, proper types, and functional methods.
File: src/processData.ts

```

**Critérios:**
- ✅ Conversão para TypeScript
- ✅ Uso de filter/map
- ✅ Tipos adequados
- ✅ Imutabilidade

---

### 🧪 Teste 3: Componente React (Intermediário)

**Tempo estimado:** 3-5 minutos

**Prompt (Qwen):**
```

Crie um componente React funcional TypeScript para login.

Requisitos:

1. Campos: email, senha
2. Validação em tempo real
3. Estado de loading
4. Tratamento de erros
5. Use hooks (useState, useEffect)

Exporte como: src/LoginForm.tsx

```

**Prompt (Claude):**
```

Create a TypeScript React functional component for login.

Requirements:

1. Fields: email, password
2. Real-time validation
3. Loading state
4. Error handling
5. Use hooks (useState, useEffect)

Export as: src/LoginForm.tsx

```

**Critérios:**
- ✅ Estrutura React correta
- ✅ Tipagem de props/estado
- ✅ Validação funcional
- ✅ Loading state
- ✅ Error handling

---

### 🧪 Teste 4: Debug de Código (Intermediário)

**Tempo estimado:** 2-3 minutos

**Prompt (Qwen):**
```

Encontre e corrija os bugs neste código:

```typescript
async function fetchUsers() {
  const response = await fetch('/api/users');
  const users = response.json();

  users.forEach((user) => {
    if ((user.role = 'admin')) {
      console.log('Admin found:', user.name);
    }
  });

  return users;
}
```

Liste todos os bugs encontrados e explique cada correção.
Arquivo: src/fetchUsers.ts

```

**Bugs para encontrar:**
1. `response.json()` precisa de await
2. `=` ao invés de `===` (atribuição vs comparação)
3. Falta tratamento de erro
4. Falta verificação de response.ok

---

### 🧪 Teste 5: API REST (Avançado)

**Tempo estimado:** 5-8 minutos

**Prompt (Qwen):**
```

Crie uma API REST completa para gerenciamento de tarefas (TODO).

Requisitos:

1. Node.js + Express + TypeScript
2. CRUD completo (Create, Read, Update, Delete)
3. Validação com Zod
4. Persistência em memória (array)
5. Rotas: GET, POST, PUT, DELETE
6. Tratamento de erros
7. Status codes corretos

Arquivo: src/api/todo.ts

```

**Prompt (Claude):**
```

Create a complete REST API for task management (TODO).

Requirements:

1. Node.js + Express + TypeScript
2. Full CRUD (Create, Read, Update, Delete)
3. Validation with Zod
4. In-memory persistence (array)
5. Routes: GET, POST, PUT, DELETE
6. Error handling
7. Correct status codes

File: src/api/todo.ts

```

**Critérios:**
- ✅ Estrutura Express correta
- ✅ Tipagem TypeScript
- ✅ Validação Zod
- ✅ CRUD completo
- ✅ Error handling

---

## Executando os Testes

### 📋 Checklist de Execução

#### Para Cada Teste:

```

[ ] 1. Limpar diretório (git clean -fdx)
[ ] 2. Executar no Qwen (node dist/cli.js)
[ ] 3. Anotar tempo de resposta
[ ] 4. Salvar resultado (cp -r src qwen-test-XX)
[ ] 5. Limpar diretório
[ ] 6. Executar no claude
[ ] 7. Anotar tempo de resposta
[ ] 8. Salvar resultado (cp -r src claude-test-XX)
[ ] 9. Preencher planilha de resultados

````

### 🛠️ Comandos Úteis

#### Medir Tempo com Precisão

```bash
# Usar time do bash
time node dist/cli.js "<prompt>"

# Output exemplo:
# node dist/cli.js "<prompt>"  2.34s user 0.45s system 85% cpu 3.271 total
````

#### Comparar Resultados

```bash
# Comparar estrutura de arquivos
diff qwen-test-01 claude-test-01

# Comparar linhas de código
wc -l qwen-test-01/src/*.ts claude-test-01/src/*.ts

# Ver diferenças em arquivo específico
diff qwen-test-01/src/validateEmail.ts claude-test-01/src/validateEmail.ts
```

#### Salvar Outputs

```bash
# Salvar output completo do Qwen
node dist/cli.js "<prompt>" 2>&1 | tee qwen-output-test-01.txt

# Salvar output completo do Claude
claude "<prompt>" 2>&1 | tee claude-output-test-01.txt
```

### 📝 Dicas de Execução

1. **Execute em sequência** - Não alterne entre testes
2. **Mantenha o contexto limpo** - Sempre use `git clean -fdx`
3. **Anote tudo** - Tempo, qualidade percebida, issues
4. **Use o mesmo prompt** - Traduza apenas o necessário
5. **Não edite resultados** - Avalie como foram gerados
6. **Build antes de testar** - Sempre rode `npm run build` antes dos testes

---

## Métricas de Avaliação

### 📊 Planilha de Resultados

Copie e preencha esta planilha para cada teste:

```markdown
| Teste | CLI          | Tempo (s) | Input Tokens | Output Tokens | Total Tokens | Custo Estimado | Correção (0-10) | Qualidade (0-10) | UX (0-10) | Score Final |
| ----- | ------------ | --------- | ------------ | ------------- | ------------ | -------------- | --------------- | ---------------- | --------- | ----------- |
| 1     | Qwen (build) |           |              |               |              | $              |                 |                  |           |             |
| 1     | Claude       |           |              |               |              | $              |                 |                  |           |             |
| 2     | Qwen (build) |           |              |               |              | $              |                 |                  |           |             |
| 2     | Claude       |           |              |               |              | $              |                 |                  |           |             |
| 3     | Qwen (build) |           |              |               |              | $              |                 |                  |           |             |
| 3     | Claude       |           |              |               |              | $              |                 |                  |           |             |
| 4     | Qwen (build) |           |              |               |              | $              |                 |                  |           |             |
| 4     | Claude       |           |              |               |              | $              |                 |                  |           |             |
| 5     | Qwen (build) |           |              |               |              | $              |                 |                  |           |             |
| 5     | Claude       |           |              |               |              | $              |                 |                  |           |             |
```

### 📈 Métricas Agregadas

```markdown
| Métrica              | Qwen (build) | Claude  | Diferença |
| -------------------- | ------------ | ------- | --------- |
| Tempo Médio          | 0.0s         | 0.0s    | -         |
| Total Tokens (médio) | 0            | 0       | -         |
| Custo Médio          | $0.00        | $0.00   | -         |
| Correção Média       | 0.0          | 0.0     | -         |
| Qualidade Média      | 0.0          | 0.0     | -         |
| **Score Final**      | **0.0**      | **0.0** | **-**     |
```

### 📈 Como Calcular o Score Final

```
Score = (Correção × 0.35) + (Qualidade × 0.35) + (Tempo Normalizado × 0.15) + (UX × 0.15)

Tempo Normalizado = max(0, 10 - (tempo_segundos / 5))

Exemplo:
- Correção: 8
- Qualidade: 7
- Tempo: 10s → Tempo Normalizado = 10 - (10/5) = 8
- UX: 9

Score = (8 × 0.35) + (7 × 0.35) + (8 × 0.15) + (9 × 0.15)
Score = 2.8 + 2.45 + 1.2 + 1.35 = 7.8
```

### 📝 Avaliação Subjetiva

Além dos números, registre impressões:

```markdown
## Observações - Teste 1

### Qwen

**Pontos fortes:**

- Gerou código funcional
- Boa documentação

**Pontos fracos:**

- Mais lento que o esperado
- Código verboso

### Claude

**Pontos fortes:**

- Muito rápido
- Código conciso

**Pontos fracos:**

- Falta tratamento de erro

### Vencedor: Claude (por velocidade)
```

---

## Planilha de Resultados

### 📋 Template para Copiar

```markdown
# Resultados do Benchmark

**Data:** 2026-02-28
**Versão Qwen:** build local (npm run build)
**Versão Claude:** latest
**Preços usados:**

- Qwen: $0.0001/1K input, $0.0003/1K output
- Claude: $0.0003/1K input, $0.0015/1K output

## Resumo

| Métrica               | Qwen (build) | Claude  | Diferença |
| --------------------- | ------------ | ------- | --------- |
| Tempo Médio           | 0.0s         | 0.0s    | -         |
| Input Tokens (médio)  | 0            | 0       | -         |
| Output Tokens (médio) | 0            | 0       | -         |
| Total Tokens (médio)  | 0            | 0       | -         |
| Custo Médio           | $0.00        | $0.00   | -         |
| Correção Média        | 0.0          | 0.0     | -         |
| Qualidade Média       | 0.0          | 0.0     | -         |
| UX Médio              | 0.0          | 0.0     | -         |
| **Score Final**       | **0.0**      | **0.0** | **-**     |

## Detalhe por Teste

### Teste 1: Validação de Email

| CLI          | Tempo | Input | Output | Total | Custo | Correção | Qualidade | UX  | Score |
| ------------ | ----- | ----- | ------ | ----- | ----- | -------- | --------- | --- | ----- |
| Qwen (build) |       |       |        |       | $     |          |           |     |       |
| Claude       |       |       |        |       | $     |          |           |     |       |

**Observações:**

- Qwen:
- Claude:

**Vencedor:**

---

### Teste 2: Refatoração

| CLI          | Tempo | Input | Output | Total | Custo | Correção | Qualidade | UX  | Score |
| ------------ | ----- | ----- | ------ | ----- | ----- | -------- | --------- | --- | ----- |
| Qwen (build) |       |       |        |       | $     |          |           |     |       |
| Claude       |       |       |        |       | $     |          |           |     |       |

**Observações:**

**Vencedor:**

---

### Teste 3: Componente React

| CLI          | Tempo | Input | Output | Total | Custo | Correção | Qualidade | UX  | Score |
| ------------ | ----- | ----- | ------ | ----- | ----- | -------- | --------- | --- | ----- |
| Qwen (build) |       |       |        |       | $     |          |           |     |       |
| Claude       |       |       |        |       | $     |          |           |     |       |

**Observações:**

**Vencedor:**

---

### Teste 4: Debug de Código

| CLI          | Tempo | Input | Output | Total | Custo | Correção | Qualidade | UX  | Score |
| ------------ | ----- | ----- | ------ | ----- | ----- | -------- | --------- | --- | ----- |
| Qwen (build) |       |       |        |       | $     |          |           |     |       |
| Claude       |       |       |        |       | $     |          |           |     |       |

**Observações:**

**Vencedor:**

---

### Teste 5: API REST

| CLI          | Tempo | Input | Output | Total | Custo | Correção | Qualidade | UX  | Score |
| ------------ | ----- | ----- | ------ | ----- | ----- | -------- | --------- | --- | ----- |
| Qwen (build) |       |       |        |       | $     |          |           |     |       |
| Claude       |       |       |        |       | $     |          |           |     |       |

**Observações:**

**Vencedor:**

---

## Comparativo de Tokens

| Métrica      | Qwen (build) | Claude | Diferença | % Economia |
| ------------ | ------------ | ------ | --------- | ---------- |
| Total Tokens | 0            | 0      | 0         | -          |
| Custo Total  | $0.00        | $0.00  | $0.00     | -          |
| Tokens/Teste | 0            | 0      | 0         | -          |

---

## Conclusão

**Vencedor Geral:**

**Motivo:**

**Ações de Melhoria para Qwen:**

1.
2.
3.
```

---

## Análise Comparativa

### 🔍 Interpretando Resultados

#### Diferenças Significativas

| Diferença | Interpretação                     |
| --------- | --------------------------------- |
| > 20%     | Diferença significativa           |
| 10-20%    | Diferença moderada                |
| < 10%     | Diferença marginal/empate técnico |

#### Cenários Comuns

**Qwen mais lento, mesma qualidade:**

- Problema de infraestrutura/otimização
- Ação: Otimizar streaming, reduzir overhead

**Qwen mesma velocidade, qualidade inferior:**

- Problema de modelo/prompt engineering
- Ação: Melhorar system prompt, few-shot examples

**Qwen perde em UX:**

- Problema de ergonomia/fluxo
- Ação: Melhorar mensagens, feedback visual

### 📊 Exemplo Preenchido

```markdown
# Resultados do Benchmark

**Data:** 2026-02-28
**Versão Qwen:** build local (dev)
**Versão Claude:** 1.0.0
**Preços usados:**

- Qwen: $0.0001/1K input, $0.0003/1K output
- Claude: $0.0003/1K input, $0.0015/1K output

## Resumo

| Métrica               | Qwen (build) | Claude   | Diferença |
| --------------------- | ------------ | -------- | --------- |
| Tempo Médio           | 12.5s        | 8.2s     | +52% Qwen |
| Input Tokens (médio)  | 350          | 320      | +9% Qwen  |
| Output Tokens (médio) | 450          | 400      | +12% Qwen |
| Total Tokens (médio)  | 800          | 720      | +11% Qwen |
| Custo Médio           | $0.00017     | $0.00070 | -76% Qwen |
| Correção Média        | 8.2          | 8.8      | -0.6      |
| Qualidade Média       | 7.8          | 8.5      | -0.7      |
| UX Médio              | 8.0          | 8.5      | -0.5      |
| **Score Final**       | **8.0**      | **8.6**  | **-0.6**  |

## Conclusão

**Vencedor Geral:** Claude Code (qualidade) mas Qwen economiza 76% em custos

**Motivo:**

- Claude: 52% mais rápido, qualidade superior
- Qwen: Custo 76% menor, qualidade aceitável

**Ações de Melhoria para Qwen:**

1. Otimizar first token time (infraestrutura)
2. Melhorar system prompt para qualidade
3. Manter vantagem de custo
```

### 💰 Como Calcular Custos

#### Fórmula

```
Custo = (Input Tokens / 1000 × Preço Input) + (Output Tokens / 1000 × Preço Output)
```

#### Preços de Referência (fevereiro 2026)

| Modelo/Provider       | Input (por 1K) | Output (por 1K) |
| --------------------- | -------------- | --------------- |
| **Qwen (Alibaba)**    | $0.0001        | $0.0003         |
| **Claude 3.5 Sonnet** | $0.0003        | $0.0015         |
| **Claude 3.5 Haiku**  | $0.00008       | $0.0004         |
| **GPT-4o**            | $0.0025        | $0.0075         |
| **GPT-4o-mini**       | $0.00015       | $0.0006         |

#### Script de Cálculo

```bash
#!/bin/bash
# calculate-cost.sh

INPUT_TOKENS=$1
OUTPUT_TOKENS=$2
PRICE_INPUT=${3:-0.0001}   # Default: preço Qwen
PRICE_OUTPUT=${4:-0.0003}  # Default: preço Qwen

# Calcular custo
COST=$(echo "scale=6; ($INPUT_TOKENS / 1000 * $PRICE_INPUT) + ($OUTPUT_TOKENS / 1000 * $PRICE_OUTPUT)" | bc)

echo "Input: $INPUT_TOKENS tokens"
echo "Output: $OUTPUT_TOKENS tokens"
echo "Custo: \$${COST}"
```

#### Uso

```bash
# Calcular custo Qwen
./calculate-cost.sh 350 450 0.0001 0.0003
# Output: Custo: $0.000170

# Calcular custo Claude
./calculate-cost.sh 320 400 0.0003 0.0015
# Output: Custo: $0.000696
```

### 🎯 Próximos Passos

#### Se Qwen Perdeu

1. **Identifique gaps específicos**
   - Performance? → Otimizar infra
   - Qualidade? → Melhorar prompts
   - UX? → Melhorar interface

2. **Priorize melhorias**
   - Impacto alto + esforço baixo primeiro
   - Quick wins para motivar time

3. **Re-teste após melhorias**
   - Benchmark contínuo
   - Acompanhe progresso

#### Se Qwen Ganhou/Empatou

1. **Valide resultados**
   - Mais testes, mais amostras
   - Diferentes tipos de projeto

2. **Documente aprendizados**
   - O que funcionou bem?
   - O que pode melhorar ainda mais?

3. **Mantenha qualidade**
   - Benchmark regressivo
   - Não quebrar o que funciona

---

## 📚 Referências

- [Claude Code CLI](https://github.com/anthropics/claude-code)
- [Qwen Code CLI](https://github.com/qwen-code/qwen-code)
- [LMSys Chatbot Arena](https://chat.lmsys.org/)
- [BigCode Bench](https://huggingface.co/bigcode)
- [OpenAI Pricing](https://openai.com/pricing)
- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [Alibaba Cloud Pricing](https://www.alibabacloud.com/product/intelligent-computing/pricing)

---

**Documento criado:** 2026-02-28
**Última atualização:** 2026-02-28
**Versão:** 2.0.0 - Benchmark: Qwen Code (aplicação buildada - node dist/cli.js) vs Claude Code CLI
**Métricas principais:** Tempo, Tokens (input/output), Custo estimado, Qualidade de código
