#!/bin/bash

# Startup script - handles environment variable parameters and updates .env file

# Next.js environment variable file paths (in priority order)
# Note: Next.js environment variable files should be in the project root directory
ENV_FILES=("/app/.env.local" "/app/.env.production" "/app/.env")

# Select the environment variable file to use
ENV_FILE=""
for file in "${ENV_FILES[@]}"; do
    if [ -f "$file" ]; then
        ENV_FILE="$file"
        echo "Using existing environment variable file: $file"
        break
    fi
done

# If no environment variable file is found, exit with error
if [ -z "$ENV_FILE" ]; then
    echo "Error: No environment variable file found (.env, .env.local, .env.production)"
    echo "Please ensure .env file exists in the project root directory"
    exit 1
fi

# Function: update or add environment variable
update_env_var() {
    local key="$1"
    local value="$2"
    
    # Check if key already exists
    if grep -q "^${key}=" "$ENV_FILE"; then
        # Update existing value
        sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
        echo "Updated environment variable: ${key}=${value}"
    else
        # Add new value
        echo "${key}=${value}" >> "$ENV_FILE"
        echo "Added environment variable: ${key}=${value}"
    fi
}

# Handle Docker environment variable overrides
echo "Processing Docker environment variable overrides..."
# Get all environment variables starting with specific prefixes and override values in .env file
for env_var in $(env | grep -E '^(NODE_ENV|NEXT_PUBLIC_|PORT|DATABASE_|API_)' | cut -d= -f1); do
    value="${!env_var}"
    if [ -n "$value" ]; then
        echo "Overriding from Docker environment variable: $env_var=$value"
        update_env_var "$env_var" "$value"
    fi
done

# Handle passed parameters
echo "Processing startup parameters..."

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env-*)
            # Extract key-value pair (--env-KEY=VALUE format)
            key_value="${1#--env-}"
            key="${key_value%%=*}"
            value="${key_value#*=}"
            update_env_var "$key" "$value"
            shift
            ;;
        --env)
            # Handle --env KEY=VALUE format
            if [[ $# -gt 1 ]]; then
                key_value="$2"
                key="${key_value%%=*}"
                value="${key_value#*=}"
                update_env_var "$key" "$value"
                shift 2
            else
                echo "Error: --env requires KEY=VALUE format parameter"
                exit 1
            fi
            ;;
        *)
            # Other parameters passed to original command
            break
            ;;
    esac
done

echo "Environment variable processing completed, current .env file content:"
echo "----------------------------------------"
cat "$ENV_FILE"
echo "----------------------------------------"

# Export environment variables to current shell environment to ensure Next.js can read them
echo "Exporting environment variables to shell environment..."
if [ -f "$ENV_FILE" ]; then
    set -a  # Automatically export all variables
    source "$ENV_FILE"
    set +a  # Turn off automatic export
    echo "Successfully exported environment variables"
else
    echo "Warning: Environment variable file does not exist: $ENV_FILE"
fi

# Start application
echo "Starting application..."
exec "$@"
