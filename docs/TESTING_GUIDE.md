# 🧪 Guia de Teste das Melhorias

## 🚀 Rodar em Modo Desenvolvimento (Recomendado)

O modo dev usa `tsx` para rodar TypeScript diretamente, sem precisar de build:

```bash
# Rodar o CLI em modo interativo
npm run dev

# Rodar com um prompt específico
npm run dev -- -p "Leia os arquivos src/index.ts e src/utils.ts"

# Rodar em modo headless
npm run dev -- -p "Explique a estrutura do projeto"
```

### Vantagens do modo dev:

- ✅ Hot reload (mudanças são refletidas instantaneamente)
- ✅ Não precisa compilar
- ✅ Ideal para testar as melhorias

---

## 📋 Testando Parallel Tool Execution

### Teste 1: Leitura Múltipla de Arquivos

```bash
npm run dev
```

No prompt interativo:

```
Leia os seguintes arquivos e me diga o que cada um faz:
- src/index.ts
- src/utils/helpers.ts
- src/config/settings.ts
```

**O que observar:**

- As ferramentas de leitura devem executar em **paralelo**
- Tempo de resposta deve ser **mais rápido** (~1s em vez de ~3s)
- Logs devem mostrar execução concorrente

### Teste 2: Operações Independentes

```
Crie três arquivos vazios:
1. tests/test1.ts
2. tests/test2.ts
3. tests/test3.ts
```

**O que observar:**

- Criação dos 3 arquivos deve ocorrer em paralelo

### Teste 3: Operações Dependentes (não paralelizam)

```
1. Leia o arquivo package.json
2. Modifique o arquivo package.json adicionando um script
3. Leia o arquivo modificado
```

**O que observar:**

- Estas operações **não** paralelizam (há dependência)
- Execução sequencial correta

---

## 🎯 Testando Enhanced @mentions Auto-complete

### Teste 1: Fuzzy Search

```bash
npm run dev
```

No prompt, digite:

```
@util
```

**O que observar:**

- Sugestões devem aparecer ordenadas por relevância
- `utils/` ou `utils.ts` devem aparecer primeiro
- Paths relativos (não absolutos)

### Teste 2: Match Parcial

```
@help
```

**O que observar:**

- `src/utils/helpers.ts` deve aparecer
- `docs/help.md` deve aparecer
- Ranking baseado em quão bem o nome combina

### Teste 3: Extensões Comuns

```
@config
```

**O que observar:**

- `config.json`, `config.ts`, `config.yaml` prioritários
- Arquivos na raiz prioritários sobre subdiretórios

### Teste 4: Paths Relativos

```
@src/comp
```

**O que observar:**

- Paths mostrados como `src/components/...` (não `/Users/.../src/components/...`)
- Mais fácil de entender o contexto

---

## 📊 Medindo Economia de Tokens

### Antes (simulação)

```bash
# Com a versão original (git checkout main)
npm run dev -- -p "Leia arquivo1.ts, arquivo2.ts, arquivo3.ts"
# Anote: número de requests, tempo, tokens
```

### Depois (com melhorias)

```bash
# Com as melhorias
npm run dev -- -p "Leia arquivo1.ts, arquivo2.ts, arquivo3.ts"
# Compare: número de requests, tempo, tokens
```

**Métricas esperadas:**

- Requests: 3 → 1 (66% menos)
- Tempo: 3s → 1s (66% mais rápido)
- Tokens: ~3000 → ~1000 (66% economia)

---

## 🐛 Debug e Logs

### Habilitar logs detalhados

```bash
DEBUG=1 npm run dev
```

### Ver logs específicos

```bash
# Logs do scheduler
DEBUG=TOOL_SCHEDULER npm run dev

# Logs de file search
DEBUG=FILE_SEARCH npm run dev
```

---

## ✅ Checklist de Validação

### Parallel Execution

- [ ] Ferramentas independentes executam em paralelo
- [ ] Ferramentas dependentes mantêm ordem sequencial
- [ ] Cancelamento (Ctrl+C) funciona corretamente
- [ ] Erros em uma ferramenta não afetam as outras

### Auto-complete

- [ ] Sugestões aparecem rapidamente (<200ms)
- [ ] Ranking prioriza matches exatos
- [ ] Paths relativos são mostrados
- [ ] Fuzzy search funciona (ex: `utls` encontra `utils`)
- [ ] Tecla TAB completa corretamente

---

## 🔍 Troubleshooting

### Parallel execution não está funcionando?

Verifique os logs:

```bash
DEBUG=TOOL_SCHEDULER npm run dev
```

Deve aparecer:

```
[TOOL_SCHEDULER] Grouping independent tool calls for parallel execution
[TOOL_SCHEDULER] Executing group of 3 tools in parallel
```

### Auto-complete não aparece?

1. Verifique se o pattern tem pelo menos 2 caracteres
2. Confira se existem arquivos matching no diretório
3. Tente desabilitar e reabilitar fuzzy search nas settings

### Erros de TypeScript?

Os erros atuais no build **não afetam** o modo dev:

```bash
# Estes erros são de outros arquivos, não das nossas mudanças
npm run dev  # Funciona mesmo com erros de typecheck
```

---

## 📝 Reportando Resultados

Após testar, reporte:

1. Tempo médio de execução (antes vs depois)
2. Número de requests observados
3. Qualidade do auto-complete (1-5)
4. Bugs encontrados
5. Logs relevantes (se houver)

---

## 🎉 Sucesso!

Se tudo funcionar:

- ✅ Parallel execution reduz requests e tempo
- ✅ Auto-complete é mais rápido e preciso
- ✅ UX geral melhorou

Próximos passos:

1. Rodar testes automatizados: `npm test`
2. Corrigir erros de TypeScript existentes (não relacionados)
3. Fazer build completo: `npm run build`
