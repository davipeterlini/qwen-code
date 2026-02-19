# How to Contribute

We would love to accept your patches and contributions to this project.

## Contribution Process

### Code Reviews

All submissions, including submissions by project members, require review. We
use [GitHub pull requests](https://docs.github.com/articles/about-pull-requests)
for this purpose.

### Pull Request Guidelines

To help us review and merge your PRs quickly, please follow these guidelines. PRs that do not meet these standards may be closed.

#### 1. Link to an Existing Issue

All PRs should be linked to an existing issue in our tracker. This ensures that every change has been discussed and is aligned with the project's goals before any code is written.

- **For bug fixes:** The PR should be linked to the bug report issue.
- **For features:** The PR should be linked to the feature request or proposal issue that has been approved by a maintainer.

If an issue for your change doesn't exist, please **open one first** and wait for feedback before you start coding.

#### 2. Keep It Small and Focused

We favor small, atomic PRs that address a single issue or add a single, self-contained feature.

- **Do:** Create a PR that fixes one specific bug or adds one specific feature.
- **Don't:** Bundle multiple unrelated changes (e.g., a bug fix, a new feature, and a refactor) into a single PR.

Large changes should be broken down into a series of smaller, logical PRs that can be reviewed and merged independently.

#### 3. Use Draft PRs for Work in Progress

If you'd like to get early feedback on your work, please use GitHub's **Draft Pull Request** feature. This signals to the maintainers that the PR is not yet ready for a formal review but is open for discussion and initial feedback.

#### 4. Ensure All Checks Pass

Before submitting your PR, ensure that all automated checks are passing by running `npm run preflight`. This command runs all tests, linting, and other style checks.

#### 5. Update Documentation

If your PR introduces a user-facing change (e.g., a new command, a modified flag, or a change in behavior), you must also update the relevant documentation in the `/docs` directory.

#### 6. Write Clear Commit Messages and a Good PR Description

Your PR should have a clear, descriptive title and a detailed description of the changes. Follow the [Conventional Commits](https://www.conventionalcommits.org/) standard for your commit messages.

- **Good PR Title:** `feat(cli): Add --json flag to 'config get' command`
- **Bad PR Title:** `Made some changes`

In the PR description, explain the "why" behind your changes and link to the relevant issue (e.g., `Fixes #123`).

## Development Setup and Workflow

This section guides contributors on how to build, modify, and understand the development setup of this project.

### Setting Up the Development Environment

**Prerequisites:**

1.  **Node.js**:
    - **Development:** Please use Node.js `~20.19.0`. This specific version is required due to an upstream development dependency issue. You can use a tool like [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions.
    - **Production:** For running the CLI in a production environment, any version of Node.js `>=20` is acceptable.
2.  **Git**

### Build Process

To clone the repository:

```bash
git clone https://github.com/QwenLM/qwen-code.git # Or your fork's URL
cd qwen-code
```

To install dependencies defined in `package.json` as well as root dependencies:

```bash
npm install
```

To build the entire project (all packages):

```bash
npm run build
```

This command typically compiles TypeScript to JavaScript, bundles assets, and prepares the packages for execution. Refer to `scripts/build.js` and `package.json` scripts for more details on what happens during the build.

### Enabling Sandboxing

[Sandboxing](#sandboxing) is highly recommended and requires, at a minimum, setting `QWEN_SANDBOX=true` in your `~/.env` and ensuring a sandboxing provider (e.g. `macOS Seatbelt`, `docker`, or `podman`) is available. See [Sandboxing](#sandboxing) for details.

To build both the `qwen-code` CLI utility and the sandbox container, run `build:all` from the root directory:

```bash
npm run build:all
```

To skip building the sandbox container, you can use `npm run build` instead.

### Running

To start the Qwen Code application from the source code (after building), run the following command from the root directory:

```bash
npm start
```

If you'd like to run the source build outside of the qwen-code folder, you can utilize `npm link path/to/qwen-code/packages/cli` (see: [docs](https://docs.npmjs.com/cli/v9/commands/npm-link)) to run with `qwen-code`

### Running Tests

This project contains two types of tests: unit tests and integration tests.

#### Unit Tests

To execute the unit test suite for the project:

```bash
npm run test
```

This will run tests located in the `packages/core` and `packages/cli` directories. Ensure tests pass before submitting any changes. For a more comprehensive check, it is recommended to run `npm run preflight`.

#### Integration Tests

The integration tests are designed to validate the end-to-end functionality of Qwen Code. They are not run as part of the default `npm run test` command.

To run the integration tests, use the following command:

```bash
npm run test:e2e
```

For more detailed information on the integration testing framework, please see the [Integration Tests documentation](./docs/integration-tests.md).

### Linting and Preflight Checks

To ensure code quality and formatting consistency, run the preflight check:

```bash
npm run preflight
```

This command will run ESLint, Prettier, all tests, and other checks as defined in the project's `package.json`.

_ProTip_

after cloning create a git precommit hook file to ensure your commits are always clean.

```bash
echo "
# Run npm build and check for errors
if ! npm run preflight; then
  echo "npm build failed. Commit aborted."
  exit 1
fi
" > .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```

#### Formatting

To separately format the code in this project by running the following command from the root directory:

```bash
npm run format
```

This command uses Prettier to format the code according to the project's style guidelines.

#### Linting

To separately lint the code in this project, run the following command from the root directory:

```bash
npm run lint
```

### Coding Conventions

- Please adhere to the coding style, patterns, and conventions used throughout the existing codebase.
- **Imports:** Pay special attention to import paths. The project uses ESLint to enforce restrictions on relative imports between packages.

### Project Structure

- `packages/`: Contains the individual sub-packages of the project.
  - `cli/`: The command-line interface.
  - `core/`: The core backend logic for Qwen Code.
- `docs/`: Contains all project documentation.
- `scripts/`: Utility scripts for building, testing, and development tasks.

For more detailed architecture, see `docs/architecture.md`.

## Documentation Development

This section describes how to develop and preview the documentation locally.

### Prerequisites

1. Ensure you have Node.js (version 18+) installed
2. Have npm or yarn available

### Setup Documentation Site Locally

To work on the documentation and preview changes locally:

1. Navigate to the `docs-site` directory:

   ```bash
   cd docs-site
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Link the documentation content from the main `docs` directory:

   ```bash
   npm run link
   ```

   This creates a symbolic link from `../docs` to `content` in the docs-site project, allowing the documentation content to be served by the Next.js site.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the documentation site with live updates as you make changes.

Any changes made to the documentation files in the main `docs` directory will be reflected immediately in the documentation site.

## Debugging

### VS Code:

0.  Run the CLI to interactively debug in VS Code with `F5`
1.  Start the CLI in debug mode from the root directory:
    ```bash
    npm run debug
    ```
    This command runs `node --inspect-brk dist/index.js` within the `packages/cli` directory, pausing execution until a debugger attaches. You can then open `chrome://inspect` in your Chrome browser to connect to the debugger.
2.  In VS Code, use the "Attach" launch configuration (found in `.vscode/launch.json`).

Alternatively, you can use the "Launch Program" configuration in VS Code if you prefer to launch the currently open file directly, but 'F5' is generally recommended.

To hit a breakpoint inside the sandbox container run:

```bash
DEBUG=1 qwen-code
```

**Note:** If you have `DEBUG=true` in a project's `.env` file, it won't affect qwen-code due to automatic exclusion. Use `.qwen-code/.env` files for qwen-code specific debug settings.

### React DevTools

To debug the CLI's React-based UI, you can use React DevTools. Ink, the library used for the CLI's interface, is compatible with React DevTools version 4.x.

1.  **Start the Qwen Code application in development mode:**

    ```bash
    DEV=true npm start
    ```

2.  **Install and run React DevTools version 4.28.5 (or the latest compatible 4.x version):**

    You can either install it globally:

    ```bash
    npm install -g react-devtools@4.28.5
    react-devtools
    ```

    Or run it directly using npx:

    ```bash
    npx react-devtools@4.28.5
    ```

    Your running CLI application should then connect to React DevTools.

## Sandboxing

> TBD

## Manual Publish

We publish an artifact for each commit to our internal registry. But if you need to manually cut a local build, then run the following commands:

```
npm run clean
npm install
npm run auth
npm run prerelease:dev
npm publish --workspaces
```

## Build & Publish to Flow Coder GCP

Scripts para automatizar o build e publicação do binário do Qwen Code CLI no bucket GCP do Flow Coder.

### Estrutura

```
scripts/
├── build_and_publish.sh       # Script principal - build + publish
├── build_binary.sh            # Build do binário CLI
├── publish_gcp_bucket.sh      # Publicação no GCP bucket
└── utils/
    ├── constants.sh           # Constantes do projeto
    └── utils.sh               # Funções utilitárias
```

### Pré-requisitos

1. **Node.js**: Versão 20.0.0 ou superior
2. **Google Cloud SDK**:

   ```bash
   # macOS
   brew install google-cloud-sdk
   ```

3. **Autenticação GCP**:
   ```bash
   gcloud auth login
   gcloud config set project ciandt-flow-plataform
   ```

### Scripts Disponíveis

#### 1. Script Principal: build_and_publish.sh

Build completo e publicação no GCP bucket:

```bash
# Uso básico (usa versão do package.json)
./scripts/build_and_publish.sh

# Com versão específica
./scripts/build_and_publish.sh 0.10.2

# Sem instalar dependências (mais rápido)
./scripts/build_and_publish.sh --skip-install
```

**O que faz:**

1. Build do binário CLI (inclui todos os pacotes)
2. Verifica artefatos de build
3. Upload para `gs://flow_coder_dev/flow_coder_cli/`
4. Cria arquivo de versão com metadados

#### 2. Build Isolado: build_binary.sh

Apenas build do binário:

```bash
./scripts/build_binary.sh
./scripts/build_binary.sh --skip-install
```

#### 3. Publicação Isolada: publish_gcp_bucket.sh

Apenas publicação:

```bash
./scripts/publish_gcp_bucket.sh
./scripts/publish_gcp_bucket.sh 0.10.2
```

### URLs de Acesso

Após a publicação:

- **Última versão**: https://storage.googleapis.com/flow_coder_dev/flow_coder_cli/cli.js
- **Versão específica**: https://storage.googleapis.com/flow_coder_dev/flow_coder_cli/cli-{version}.js
- **Info de versão**: https://storage.googleapis.com/flow_coder_dev/flow_coder_cli/version.json

### Exemplo de Fluxo Completo

```bash
# 1. Navegar para o projeto
cd /Users/davipeterlini/projects-personal/qwen-code

# 2. Garantir que está autenticado no GCP
gcloud auth login
gcloud config set project ciandt-flow-plataform

# 3. Executar build e publicação
./scripts/build_and_publish.sh

# Saída esperada:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#   Qwen Code CLI Build & Publish Process
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# ℹ Using version from package.json: 0.10.2
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#   STEP 1: Build CLI Binary
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# ✓ Build artifacts verified: cli.js (17M)
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#   STEP 2: Publish to GCP Bucket
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# ✓ Uploaded cli.js successfully
# ✓ Uploaded cli-0.10.2.js successfully
# ✓ Publishing completed successfully!
```

### Troubleshooting

**Erro: "gcloud not found"**

```bash
brew install google-cloud-sdk
```

**Erro: "Not authenticated"**

```bash
gcloud auth login
```

**Erro: "Cannot access bucket"**

```bash
gcloud config set project ciandt-flow-plataform
gcloud storage ls gs://flow_coder_dev
```

**Erro: "CLI binary not found"**

```bash
# Executar build primeiro
./scripts/build_binary.sh

# Verificar se dist/cli.js existe
ls -lh dist/cli.js
```

### Integração com CI/CD

Para usar em pipelines:

```bash
# GitHub Actions / GitLab CI
- name: Build and Publish
  run: |
    ./scripts/build_and_publish.sh ${{ github.ref_name }} --skip-install
  env:
    GOOGLE_APPLICATION_CREDENTIALS: ${{ secrets.GCP_SA_KEY }}
```

## Instalação do Binário Publicado

Esta seção descreve como instalar o Qwen Code CLI publicado no GCP bucket para usuários finais e desenvolvedores.

### Método 1: Instalação Automática via Script (Recomendado)

Use os scripts oficiais:

```bash
# Linux/macOS
curl -fsSL https://qwen-code-assets.oss-cn-hangzhou.aliyuncs.com/installation/install-qwen.sh | bash

# Windows (Admin CMD)
curl -fsSL -o %TEMP%\install-qwen.bat https://qwen-code-assets.oss-cn-hangzhou.aliyuncs.com/installation/install-qwen.bat && %TEMP%\install-qwen.bat
```

> Reinicie o terminal após a instalação.

### Método 2: Instalação via NPM

```bash
npm install -g @qwen-code/qwen-code@latest
```

Verificar instalação:

```bash
qwen --version
```

### Método 3: Instalação via Homebrew

```bash
brew install qwen-code
```

### Método 4: Instalação Manual do GCP Bucket

Para instalar diretamente do bucket de desenvolvimento:

```bash
# 1. Criar diretório
sudo mkdir -p /usr/local/lib/qwen-code

# 2. Baixar binário
curl -fsSL https://storage.googleapis.com/flow_coder_dev/flow_coder_cli/cli.js -o qwen-cli.js
sudo mv qwen-cli.js /usr/local/lib/qwen-code/cli.js
sudo chmod +x /usr/local/lib/qwen-code/cli.js

# 3. Criar wrapper script
sudo tee /usr/local/bin/qwen > /dev/null << 'EOF'
#!/bin/bash
exec node /usr/local/lib/qwen-code/cli.js "$@"
EOF

sudo chmod +x /usr/local/bin/qwen

# 4. Verificar
qwen --version
```

### Método 5: Instalação de Versão Específica

```bash
# Instalar versão específica do GCP
VERSION="0.10.2"
curl -fsSL https://storage.googleapis.com/flow_coder_dev/flow_coder_cli/cli-${VERSION}.js -o qwen-cli.js
# ... seguir passos do Método 4
```

### Verificar Versão Disponível

```bash
# Ver informações da versão publicada
curl -s https://storage.googleapis.com/flow_coder_dev/flow_coder_cli/version.json

# Exemplo de saída:
# {
#   "version": "0.10.2",
#   "updated": "2026-02-19T10:30:00Z",
#   "binary": "cli.js",
#   "versioned_binary": "cli-0.10.2.js"
# }
```

### Configuração Pós-Instalação

Após instalar, configure a autenticação:

#### Opção 1: OAuth (Grátis - 1000 req/dia)

```bash
qwen
# Dentro da sessão:
/auth  # Escolher "Qwen OAuth"
```

#### Opção 2: API Key

Criar `~/.qwen/settings.json`:

```json
{
  "modelProviders": {
    "openai": [
      {
        "id": "qwen3-coder-plus",
        "name": "qwen3-coder-plus",
        "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "envKey": "DASHSCOPE_API_KEY"
      }
    ]
  },
  "env": {
    "DASHSCOPE_API_KEY": "sk-xxxxxxxxxxxxx"
  },
  "security": {
    "auth": {
      "selectedType": "openai"
    }
  },
  "model": {
    "name": "qwen3-coder-plus"
  }
}
```

Ou via variável de ambiente:

```bash
# Linux/macOS
export DASHSCOPE_API_KEY="sk-xxxxxxxxxxxxx"
qwen

# Windows (PowerShell)
$env:DASHSCOPE_API_KEY="sk-xxxxxxxxxxxxx"
qwen
```

### Atualização

```bash
# Via NPM
npm update -g @qwen-code/qwen-code@latest

# Via Homebrew
brew upgrade qwen-code

# Via GCP (substituir instalação manual)
curl -fsSL https://storage.googleapis.com/flow_coder_dev/flow_coder_cli/cli.js -o /usr/local/lib/qwen-code/cli.js
```

### Desinstalação

```bash
# Via NPM
npm uninstall -g @qwen-code/qwen-code

# Via Homebrew
brew uninstall qwen-code

# Manual
sudo rm /usr/local/bin/qwen
sudo rm -rf /usr/local/lib/qwen-code

# Remover configurações (opcional)
rm -rf ~/.qwen
```

### Troubleshooting de Instalação

**Comando não encontrado:**

```bash
# Adicionar ao PATH
export PATH="$PATH:$(npm config get prefix)/bin"

# Tornar permanente (bash)
echo 'export PATH="$PATH:$(npm config get prefix)/bin"' >> ~/.bashrc
source ~/.bashrc

# Tornar permanente (zsh)
echo 'export PATH="$PATH:$(npm config get prefix)/bin"' >> ~/.zshrc
source ~/.zshrc
```

**Erro EACCES (permissão negada):**

```bash
# Configurar diretório npm global
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Reinstalar
npm install -g @qwen-code/qwen-code
```

**Node.js versão antiga:**

```bash
# Verificar versão
node --version  # Deve ser >= 20.0.0

# Atualizar via nvm (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
nvm alias default 20
```

**Module not found:**

```bash
# Limpar cache e reinstalar
npm cache clean --force
npm uninstall -g @qwen-code/qwen-code
npm install -g @qwen-code/qwen-code
```
