#!/bin/bash

# Script to automate the Qwen Code CLI build and publish process
# This script builds the CLI binary and publishes it to the GCP dev bucket
# Usage: ./build_and_publish.sh [version] [--skip-install]

set -e # Exit script if any command fails

# Source utility scripts with absolute paths
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UTILS_DIR="${SCRIPTS_DIR}/utils"

source "${UTILS_DIR}/constants.sh"
source "${UTILS_DIR}/utils.sh"
source "${SCRIPTS_DIR}/build_binary.sh"
source "${SCRIPTS_DIR}/publish_gcp_bucket.sh"

# Function to display usage
display_usage() {
  print_info "Usage: ./build_and_publish.sh [version] [--skip-install]"
  print ""
  print "Arguments:"
  print "  version         Version to publish (optional, reads from package.json if not provided)"
  print "  --skip-install  Skip npm install step (optional)"
  print ""
  print "Examples:"
  print "  ./build_and_publish.sh                    # Build and publish current version"
  print "  ./build_and_publish.sh 0.10.2             # Build and publish specific version"
  print "  ./build_and_publish.sh --skip-install     # Build without installing dependencies"
  print "  ./build_and_publish.sh 0.10.2 --skip-install"
  print ""
}

# Function to validate version format (optional)
validate_version() {
  local version="$1"

  if [ -z "$version" ]; then
    return 0
  fi

  # Basic semver validation (x.y.z)
  if ! [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
    print_error "Invalid version format: $version"
    print_info "Version should follow semver format (e.g., 0.10.2 or 0.10.2-beta.1)"
    return 1
  fi

  return 0
}

# Main function
build_and_publish() {
  local version=""
  local skip_install=""

  # Parse arguments
  for arg in "$@"; do
    if [ "$arg" == "--skip-install" ]; then
      skip_install="--skip-install"
    elif [ "$arg" == "--help" ] || [ "$arg" == "-h" ]; then
      display_usage
      exit 0
    else
      version="$arg"
    fi
  done

  print_header_info "Qwen Code CLI Build & Publish Process"

  # Get version from package.json if not provided
  if [ -z "$version" ]; then
    version=$(get_current_version)
    if [ $? -ne 0 ]; then
      print_error "Could not determine version from package.json"
      exit 1
    fi
    print_info "Using version from package.json: ${version}"
  else
    validate_version "$version" || exit 1
    print_info "Using provided version: ${version}"
  fi

  print_header_info "STEP 1: Build CLI Binary"
  build_binary "$skip_install" || {
    print_error "Failed to build CLI binary"
    exit 1
  }

  print_header_info "STEP 2: Publish to GCP Bucket"
  publish_gcp_bucket "$version" || {
    print_error "Failed to publish to GCP bucket"
    exit 1
  }

  print_success "Build and publish process completed successfully!"
  print ""
  print_info "Summary:"
  print "  Version: ${version}"
  print "  Binary: ${CLI_BINARY}"
  print "  Bucket: ${GCP_BUCKET_NAME}/flow_coder_cli"
  print ""
  print_info "The CLI binary is now available at:"
  print "  https://storage.googleapis.com/${GCP_BUCKET_NAME}/flow_coder_cli/cli.js"
}

# Execute function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  # Show usage if no arguments and --help not specified
  if [ $# -eq 0 ]; then
    print_alert "No arguments provided. Using defaults..."
    print ""
  fi

  build_and_publish "$@"
fi
