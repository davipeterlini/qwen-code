---
name: deploy
description: Deploy application to production
allowed-tools:
  - Shell
  - Read
shell-mode: true
---

# Deploy Command

Deploy the application to production environment.

## Steps

1. **Verify current state**

   ```bash
   !git status
   !git rev-parse --abbrev-ref HEAD
   ```

2. **Run tests**

   ```bash
   !npm test
   ```

   If tests fail, abort deployment and report errors.

3. **Build application**

   ```bash
   !npm run build
   ```

4. **Deploy**

   ```bash
   !./deploy.sh $ARGUMENTS
   ```

5. **Verify deployment**
   ```bash
   !curl -s https://api.example.com/health
   ```

## Arguments

- Environment (optional): staging, production (default: production)
- Version (optional): Specific version to deploy

## Examples

```
/deploy
/deploy staging
/deploy production --version=1.2.3
```
