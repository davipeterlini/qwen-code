#!/bin/bash

# Check if constants are already loaded to avoid redefining readonly variables
if [ -z "${QWEN_CONSTANTS_LOADED}" ]; then
  # Mark constants as loaded
  QWEN_CONSTANTS_LOADED=true

  # Get the absolute directory of the current script
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  # Get the project root directory (assuming utils is one level below scripts)
  ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
  readonly ROOT_DIR

  # Constants file for Qwen Code project
  # This file contains shared constants used across multiple scripts

  ###########################################
  # ENVIRONMENT AND VERSION REQUIREMENTS
  ###########################################

  # Node.js requirements
  readonly NODE_REQUIRED_VERSION="20.0.0"

  ###########################################
  # PROJECT DIRECTORIES
  ###########################################

  # Main project directories
  readonly DIST_DIR="${ROOT_DIR}/dist"
  readonly PACKAGES_DIR="${ROOT_DIR}/packages"
  readonly SCRIPTS_DIR="${ROOT_DIR}/scripts"

  ###########################################
  # BUILD ARTIFACTS
  ###########################################

  # Binary files
  readonly CLI_BINARY="${DIST_DIR}/cli.js"
  readonly BINARY_NAME="cli.js"

  # Version file
  readonly VERSION_FILE="${ROOT_DIR}/package.json"

  ###########################################
  # GCP PUBLISHING CONSTANTS
  ###########################################

  # GCP project and bucket settings
  readonly GCP_PROJECT_ID="ciandt-flow-plataform"
  readonly GCP_BUCKET_NAME="flow_coder_dev"
  readonly GCP_BUCKET_CLI_PATH="gs://${GCP_BUCKET_NAME}/flow_coder_cli"

  ###########################################
  # UTILITY FUNCTIONS
  ###########################################

  # Export a function to verify if the constants were loaded correctly
  constants_loaded() {
    echo "Constants loaded successfully from $(basename "${BASH_SOURCE[0]}")"
  }
fi
