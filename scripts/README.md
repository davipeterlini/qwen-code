# 🔄 Scripts de Sync com Upstream

## Scripts Disponíveis

### sync-upstream.sh

Script principal para sincronização com o repositório oficial do Qwen Code.

**Uso:**

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

**Opções:**

- `--manual`: Cria a branch merge-back localmente (sem push remoto)
- `--force`: Força a recriação da branch merge-back
- `--dry-run`: Simula as operações sem executar
- `--help`: Mostra mensagem de ajuda

## Comandos NPM

Alternativamente, use os comandos npm:

```bash
npm run sync:upstream          # Sync completo
npm run sync:upstream:manual   # Apenas branch local
npm run sync:upstream:dry-run  # Dry run
npm run sync:upstream:force    # Força recriação
```

## Workflow GitHub Actions

O workflow `.github/workflows/sync-upstream.yml` pode ser executado:

1. **Automaticamente**: Toda segunda-feira às 9h UTC
2. **Manualmente**: Via GitHub UI em Actions → Sync with Upstream Qwen Code

## Documentação Completa

Veja `docs/SYNC_UPSTREAM.md` para documentação detalhada.
