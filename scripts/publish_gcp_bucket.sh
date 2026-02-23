#!/bin/bash

# Script to publish Qwen Code CLI binary to GCP bucket
# Usage: ./publish_gcp_bucket.sh [version]

set -e # Exit script if any command fails

# Source utility scripts with absolute paths
# Get script directory before sourcing constants
_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UTILS_DIR="${_SCRIPT_DIR}/utils"

source "${UTILS_DIR}/constants.sh"
source "${UTILS_DIR}/utils.sh"

# Function to check if gcloud is installed
check_gcloud_installed() {
  if ! command_exists gcloud; then
    print_error "Google Cloud SDK (gcloud) is not installed."
    print_info "Please install it following the instructions at: https://cloud.google.com/sdk/docs/install"
    return 1
  fi

  print_success "Google Cloud SDK is installed."
  return 0
}

# Function to check gcloud authentication
check_gcloud_auth() {
  if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &>/dev/null; then
    print_error "Not authenticated with gcloud."
    print_info "Please run 'gcloud auth login' to authenticate."
    return 1
  fi

  local active_account=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
  print_success "Authenticated to gcloud as: $active_account"
  return 0
}

# Function to check/set GCP project
check_gcp_project() {
  local current_project=$(gcloud config get-value project 2>/dev/null)

  if [ "$current_project" != "$GCP_PROJECT_ID" ]; then
    print_info "Setting GCP project to: $GCP_PROJECT_ID"
    gcloud config set project "$GCP_PROJECT_ID"
    print_success "GCP project set successfully"
  else
    print_success "Using GCP project: $current_project"
  fi
}

# Function to upload CLI binary to GCP bucket
upload_binary_to_gcp() {
  local version="$1"
  local bucket_path="${GCP_BUCKET_CLI_PATH}"

  print_info "Uploading CLI binary to GCP bucket..."

  # Verify binary exists
  if [ ! -f "$CLI_BINARY" ]; then
    print_error "CLI binary not found: $CLI_BINARY"
    return 1
  fi

  # Check if bucket exists
  print_info "Checking GCP bucket access..."
  if ! gcloud storage ls "gs://$GCP_BUCKET_NAME" &>/dev/null; then
    print_error "Cannot access bucket gs://$GCP_BUCKET_NAME or bucket does not exist"
    return 1
  fi
  print_success "GCP bucket access confirmed"

  # Create versioned filename
  local filename="${BINARY_NAME}"
  local versioned_filename="cli-${version}.js"
  local destination="${bucket_path}/${filename}"
  local versioned_destination="${bucket_path}/${versioned_filename}"

  # Upload the main binary
  print_info "Uploading ${filename} to ${destination}..."
  if ! gcloud storage cp "$CLI_BINARY" "$destination"; then
    print_error "Failed to upload ${filename}"
    return 1
  fi
  print_success "Uploaded ${filename} successfully"

  # Upload versioned binary
  print_info "Uploading versioned binary ${versioned_filename}..."
  if ! gcloud storage cp "$CLI_BINARY" "$versioned_destination"; then
    print_error "Failed to upload ${versioned_filename}"
    return 1
  fi
  print_success "Uploaded ${versioned_filename} successfully"

  # Upload sandbox files if they exist
  if [ -d "$DIST_DIR" ]; then
    print_info "Uploading sandbox configuration files..."
    for sandbox_file in "$DIST_DIR"/sandbox-*.sb; do
      if [ -f "$sandbox_file" ]; then
        local sandbox_filename=$(basename "$sandbox_file")
        print_info "Uploading ${sandbox_filename}..."
        if ! gcloud storage cp "$sandbox_file" "${bucket_path}/${sandbox_filename}"; then
          print_alert "Failed to upload ${sandbox_filename} (non-critical)"
        else
          print_success "Uploaded ${sandbox_filename}"
        fi
      fi
    done
  fi

  return 0
}

# Function to update version file in bucket
update_version_info() {
  local version="$1"
  local temp_file=$(mktemp)
  local version_file="${bucket_path}/version.txt"

  print_info "Creating version info file..."

  # Create version info
  cat > "$temp_file" <<EOF
{
  "version": "${version}",
  "updated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "binary": "cli.js",
  "versioned_binary": "cli-${version}.js"
}
EOF

  # Upload version info
  print_info "Uploading version info to ${GCP_BUCKET_CLI_PATH}/version.json..."
  if ! gcloud storage cp "$temp_file" "${GCP_BUCKET_CLI_PATH}/version.json"; then
    print_alert "Failed to upload version info (non-critical)"
  else
    print_success "Uploaded version info"
  fi

  rm -f "$temp_file"
}

# Main publish function
publish_gcp_bucket() {
  local version="$1"

  print_header_info "Qwen Code CLI GCP Publishing Process"

  # Get version if not provided
  if [ -z "$version" ]; then
    version=$(get_current_version)
    if [ $? -ne 0 ]; then
      print_error "Could not determine version"
      exit 1
    fi
  fi

  print_info "Publishing version: ${version}"
  print_info "Target bucket: ${GCP_BUCKET_NAME}/flow_coder_cli"
  print_info "GCP Project: ${GCP_PROJECT_ID}"

  # Verify build artifacts
  verify_build_artifacts || exit 1

  # Check gcloud installation and authentication
  check_gcloud_installed || exit 1
  check_gcloud_auth || exit 1
  check_gcp_project || exit 1

  # Upload binary to GCP bucket
  upload_binary_to_gcp "$version" || exit 1

  # Update version info
  update_version_info "$version"

  print_success "Publishing completed successfully!"
  print_info ""
  print_info "Access URLs:"
  print_info "  Latest: https://storage.googleapis.com/${GCP_BUCKET_NAME}/flow_coder_cli/cli.js"
  print_info "  Versioned: https://storage.googleapis.com/${GCP_BUCKET_NAME}/flow_coder_cli/cli-${version}.js"
  print_info "  Version info: https://storage.googleapis.com/${GCP_BUCKET_NAME}/flow_coder_cli/version.json"

  return 0
}

# Execute function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  publish_gcp_bucket "$@"
fi
