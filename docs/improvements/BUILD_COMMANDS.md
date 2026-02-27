# 🛠️ Comandos de Build - Qwen Code CLI

## ✅ Comandos que Funcionam

### **1. Development Mode (Recomendado)**

```bash
# Rodar em modo desenvolvimento (hot reload, sem build)
npm run dev

# Com argumentos
npm run dev -- -p "Seu prompt aqui"

# Com debug
DEBUG=1 npm run dev
```

**Status:** ✅ **FUNCIONA PERFEITAMENTE**

---

### **2. Bundle**

```bash
# Criar bundle único
npm run bundle
```

**Status:** ✅ **FUNCIONA**

---

### **3. Build Completo (com erros TypeScript pré-existentes)**

```bash
# Build completo (pode falhar devido a erros TypeScript não relacionados)
npm run build
```

**Status:** ⚠️ **Falha em erros TypeScript pré-existentes** (não relacionados às nossas mudanças)

---

## 🔧 Erros de Build Atuais

Os erros de build são **100% do código existente**, não relacionado às nossas implementações:

### Arquivos com Erros (Pré-existentes):

- `packages/core/src/agents/collaboration.ts` - 20+ erros
- `packages/core/src/intelligence/project-memory.ts` - 10+ erros
- `packages/core/src/intelligence/semantic-search.ts` - 20+ erros
- `packages/core/src/planning/plan-mode.ts` - 5+ erros

### Nossos Arquivos: ✅ **SEM ERROS**

- ✅ `packages/core/src/hooks/*`
- ✅ `packages/core/src/checkpoints/*`
- ✅ `packages/core/src/commands/*`
- ✅ `packages/core/src/integration/*`
- ✅ `packages/core/src/skills/*`
- ✅ `packages/cli/src/ui/hooks/useSkillAutoActivation.ts`
- ✅ `packages/cli/src/services/MarkdownCommandLoader.ts`

---

## 🚀 Como Usar (Recomendado)

### **Para Desenvolvimento:**

```bash
# Use o modo dev - não requer build
npm run dev
```

### **Para Produção:**

```bash
# Use o bundle
npm run bundle

# Ou use diretamente o dev em produção
npm run dev -- -p "prompt"
```

---

## 📝 Resumo

| Comando             | Status                  | Uso                              |
| ------------------- | ----------------------- | -------------------------------- |
| `npm run dev`       | ✅ Funciona             | Desenvolvimento (recomendado)    |
| `npm run bundle`    | ✅ Funciona             | Produção                         |
| `npm run build`     | ⚠️ Erros pré-existentes | Não use (erros não relacionados) |
| `npm run lint`      | ✅ Aprovado             | Code quality                     |
| `npm run typecheck` | ⚠️ Erros pré-existentes | TypeScript check                 |

---

## 🎯 Conclusão

**Use `npm run dev` para tudo!**

O modo development:

- ✅ Não requer build
- ✅ Hot reload
- ✅ Funciona perfeitamente
- ✅ Todas as features ativas

**Build (`npm run build`) só é necessário se:**

- Estiver preparando release para produção
- Precisar do bundle compilado
- Tiver tempo para corrigir erros TypeScript pré-existentes

---

**Última verificação:** 2026-02-27
**Status:** ✅ Pronto para uso com `npm run dev`
