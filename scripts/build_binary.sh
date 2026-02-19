#!/bin/bash

# Script to build the Qwen Code CLI binary
# Usage: ./build_binary.sh [--skip-install]

set -e # Exit script if any command fails

# Source utility scripts with absolute paths
# Get script directory before sourcing constants
_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UTILS_DIR="${_SCRIPT_DIR}/utils"

source "${UTILS_DIR}/constants.sh"
source "${UTILS_DIR}/utils.sh"

# Function to explain build steps
explain_build_steps() {
  print_info "Building the Qwen Code CLI involves the following steps:"
  print "1. Check Node.js version"
  print "2. Install dependencies (if needed)"
  print "3. Clean previous builds"
  print "4. Generate git commit info"
  print "5. Build all packages in dependency order"
  print "6. Bundle the CLI with esbuild"
  print "7. Verify build artifacts"
  print ""
}

# Function to clean previous builds
clean_build() {
  print_info "Cleaning previous builds..."

  cd "$ROOT_DIR"

  if [ -d "$DIST_DIR" ]; then
    rm -rf "$DIST_DIR"
    print_success "Removed previous dist directory"
  fi

  # Run the clean script if it exists
  if [ -f "${SCRIPTS_DIR}/clean.js" ]; then
    node "${SCRIPTS_DIR}/clean.js"
    print_success "Ran clean script"
  fi
}

# Function to install dependencies
install_dependencies() {
  local skip_install="$1"

  if [ "$skip_install" == "--skip-install" ]; then
    print_alert "Skipping dependency installation"
    return 0
  fi

  print_info "Installing dependencies..."
  cd "$ROOT_DIR"

  npm install
  print_success "Dependencies installed"
}

# Function to build the CLI
build_cli() {
  print_info "Building Qwen Code CLI..."

  cd "$ROOT_DIR"

  # Run the build script
  npm run build

  print_success "CLI build completed"
}

# Main build function
build_binary() {
  local skip_install="$1"

  print_header_info "Qwen Code CLI Build Process"

  explain_build_steps

  print_info_bold "STEP 1: Checking Node.js version"
  check_node_version || exit 1

  print_info_bold "STEP 2: Installing dependencies"
  install_dependencies "$skip_install"

  print_info_bold "STEP 3: Cleaning previous builds"
  clean_build

  print_info_bold "STEP 4: Building CLI"
  build_cli

  print_info_bold "STEP 5: Verifying build artifacts"
  verify_build_artifacts || exit 1

  print_success "Build process completed successfully!"

  # Display version info
  local version=$(get_current_version)
  print_info "Built version: ${version}"
  print_info "Binary location: ${CLI_BINARY}"
}

# Execute function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  build_binary "$@"
fi
