#!/bin/bash

# Utility functions for Qwen Code build and publish scripts

# Check if utils are already loaded to avoid redefining readonly variables
if [ -z "${QWEN_UTILS_LOADED}" ]; then
  # Mark utils as loaded
  QWEN_UTILS_LOADED=true

  # Color codes for terminal output
  readonly RED='\033[0;31m'
  readonly GREEN='\033[0;32m'
  readonly YELLOW='\033[1;33m'
  readonly BLUE='\033[0;34m'
  readonly BOLD='\033[1m'
  readonly NC='\033[0m' # No Color
fi

# Print functions
print() {
  echo -e "$@"
}

print_info() {
  echo -e "${BLUE}ℹ${NC} $@"
}

print_info_bold() {
  echo -e "${BOLD}${BLUE}ℹ${NC} ${BOLD}$@${NC}"
}

print_success() {
  echo -e "${GREEN}✓${NC} $@"
}

print_error() {
  echo -e "${RED}✗${NC} $@" >&2
}

print_alert() {
  echo -e "${YELLOW}⚠${NC} $@"
}

print_header_info() {
  echo ""
  echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}${BLUE}  $@${NC}"
  echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# Get current version from package.json
get_current_version() {
  if [ ! -f "$VERSION_FILE" ]; then
    print_error "Version file not found: $VERSION_FILE"
    return 1
  fi

  # Extract version using grep and sed
  local version=$(grep -o '"version": *"[^"]*"' "$VERSION_FILE" | sed 's/.*"version": *"\([^"]*\)".*/\1/')

  if [ -z "$version" ]; then
    print_error "Could not extract version from $VERSION_FILE"
    return 1
  fi

  echo "$version"
}

# Check if a command exists
command_exists() {
  command -v "$1" &>/dev/null
}

# Check if node is installed and meets version requirement
check_node_version() {
  if ! command_exists node; then
    print_error "Node.js is not installed"
    print_info "Please install Node.js ${NODE_REQUIRED_VERSION} or higher"
    return 1
  fi

  local current_version=$(node --version | sed 's/v//')
  print_success "Node.js version: $current_version"

  return 0
}

# Verify build artifacts
verify_build_artifacts() {
  print_info "Verifying build artifacts..."

  # Check if dist directory exists
  if [ ! -d "$DIST_DIR" ]; then
    print_error "Build directory does not exist: $DIST_DIR"
    return 1
  fi

  # Check if CLI binary exists
  if [ ! -f "$CLI_BINARY" ]; then
    print_error "CLI binary not found: $CLI_BINARY"
    return 1
  fi

  local size=$(du -h "$CLI_BINARY" | cut -f1)
  print_success "Build artifacts verified: $BINARY_NAME ($size)"

  return 0
}
