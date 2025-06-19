#!/bin/bash

# Usage: ./scripts/run-with-env.sh <environment> <command>
# Example: ./scripts/run-with-env.sh production "tsx scripts/seed-rbac.ts"

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <environment> <command>"
    echo "Example: $0 production \"tsx scripts/seed-rbac.ts\""
    exit 1
fi

ENV=$1
COMMAND=$2
ENV_FILE=".env.$ENV"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Environment file $ENV_FILE not found"
    exit 1
fi

echo "🔧 Running with environment: $ENV"
echo "📁 Environment file: $ENV_FILE"

npx dotenv -e "$ENV_FILE" -- $COMMAND 