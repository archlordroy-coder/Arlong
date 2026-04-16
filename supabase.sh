#!/bin/bash

# =============================================================================
# Supabase Management Script for Mboa Drive
# =============================================================================
# This script allows direct database modifications using Supabase API keys.
#
# ENVIRONMENT VARIABLES REQUIRED:
#   - SUPABASE_URL: Your Supabase project URL (e.g., https://xxxx.supabase.co)
#   - SUPABASE_SERVICE_ROLE_KEY: Your service role key (keep secret!)
#
# USAGE:
#   ./supabase.sh [command] [options]
#
# COMMANDS:
#   migrate <file.sql>     Apply SQL migration file
#   seed                   Apply seed data
#   reset                  Reset database (DANGER!)
#   backup                 Create a backup
#   query <"SQL">          Execute raw SQL query
#   table <name>           Show table structure
#   update-versions        Update app versions
#
# EXAMPLES:
#   ./supabase.sh migrate modif.sql
#   ./supabase.sh query "SELECT * FROM User LIMIT 5"
#   ./supabase.sh table User
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
URL=${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-""}}
KEY=${SUPABASE_SERVICE_ROLE_KEY:-""}
API_VERSION="v1"

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check environment variables
check_env() {
    if [ -z "$URL" ]; then
        log_error "SUPABASE_URL is not set!"
        log_info "Set it with: export SUPABASE_URL=https://your-project.supabase.co"
        exit 1
    fi

    if [ -z "$KEY" ]; then
        log_error "SUPABASE_SERVICE_ROLE_KEY is not set!"
        log_info "Get it from: Supabase Dashboard → Project Settings → API → service_role key"
        exit 1
    fi

    log_success "Environment variables configured"
}

# Execute SQL query via Supabase REST API
execute_sql() {
    local query="$1"
    log_info "Executing SQL query..."

    curl -s -X POST "${URL}/rest/v1/rpc/execute_sql" \
        -H "apikey: ${KEY}" \
        -H "Authorization: Bearer ${KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"${query}\"}" | jq . 2>/dev/null || cat
}

# Apply SQL migration file
apply_migration() {
    local file="$1"

    if [ ! -f "$file" ]; then
        log_error "Migration file not found: $file"
        exit 1
    fi

    log_info "Applying migration: $file"

    # Read and execute SQL file
    local sql=$(cat "$file")

    curl -s -X POST "${URL}/rest/v1/rpc/execute_sql" \
        -H "apikey: ${KEY}" \
        -H "Authorization: Bearer ${KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"query\": $(echo "$sql" | jq -Rs .)}" | jq . 2>/dev/null || cat

    log_success "Migration applied: $file"
}

# Show help
show_help() {
    cat << EOF
${BLUE}Supabase Management Script for Mboa Drive${NC}

${GREEN}Environment Variables Required:${NC}
  SUPABASE_URL              Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY Your service role key (keep secret!)

${GREEN}Commands:${NC}
  migrate <file.sql>        Apply SQL migration file
  seed                      Apply database seed data
  reset                     Reset database (⚠️ DANGER!)
  backup                    Create SQL backup
  query <"SQL">             Execute raw SQL query
  table <name>              Show table information
  list-tables               List all tables
  update-versions           Update app version records
  test-connection           Test Supabase connection

${GREEN}Examples:${NC}
  ./supabase.sh migrate modif.sql
  ./supabase.sh query "SELECT * FROM User LIMIT 5"
  ./supabase.sh table User
  ./supabase.sh backup

${YELLOW}Note: Keep your SUPABASE_SERVICE_ROLE_KEY secret!${NC}
EOF
}

# Test connection
test_connection() {
    log_info "Testing Supabase connection..."

    local response=$(curl -s -o /dev/null -w "%{http_code}" \
        "${URL}/rest/v1/" \
        -H "apikey: ${KEY}")

    if [ "$response" = "200" ]; then
        log_success "Connection successful!"
    else
        log_error "Connection failed (HTTP $response)"
        log_info "Check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
        exit 1
    fi
}

# List all tables
list_tables() {
    log_info "Listing all tables..."

    curl -s "${URL}/rest/v1/" \
        -H "apikey: ${KEY}" \
        -H "Authorization: Bearer ${KEY}" | jq '.definitions | keys' 2>/dev/null || cat
}

# Show table info
show_table() {
    local table="$1"
    log_info "Showing table: $table"

    curl -s "${URL}/rest/v1/${table}?limit=5" \
        -H "apikey: ${KEY}" \
        -H "Authorization: Bearer ${KEY}" | jq . 2>/dev/null || cat
}

# Backup database
backup_database() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="backup_${timestamp}.sql"

    log_info "Creating backup: $backup_file"
    log_warning "Note: Full SQL backup requires pg_dump. Using table export instead."

    # Export main tables
    for table in User Espace Dossier Document Historique AppVersion; do
        log_info "Exporting $table..."
        curl -s "${URL}/rest/v1/${table}?select=*" \
            -H "apikey: ${KEY}" \
            -H "Authorization: Bearer ${KEY}" \
            -H "Accept: text/csv" >> "${backup_file}.csv" 2>/dev/null || true
    done

    log_success "Backup saved to: ${backup_file}.csv"
}

# Apply seed data
apply_seed() {
    log_info "Applying seed data..."

    # Create admin users if they don't exist
    local seed_sql="
    INSERT INTO \"User\" (name, email, password) VALUES
    ('Ravel Admin', 'ravel@mboa.com', '\$2a\$10\$YourHashedPasswordHere'),
    ('Tchinda Admin', 'tchinda@mboa.com', '\$2a\$10\$YourHashedPasswordHere'),
    ('William Admin', 'william@mboa.com', '\$2a\$10\$YourHashedPasswordHere')
    ON CONFLICT (email) DO NOTHING;
    "

    log_warning "Seed SQL prepared. Use 'query' command to execute manually for safety."
    echo "$seed_sql"
}

# Update app versions
update_versions() {
    log_info "Updating app versions..."

    local version_sql="
    INSERT INTO \"AppVersion\" (version_name, version_code, platform, download_url, notes, is_valid)
    VALUES
    ('2.0.0', 200, 'desktop', 'https://arlong-gamma.vercel.app/downloads/mboa-drive-2.0.0.AppImage', 'Version initiale avec auto-update', true),
    ('2.0.0', 200, 'web', 'https://arlong-gamma.vercel.app', 'Version web', true)
    ON CONFLICT DO NOTHING;
    "

    log_warning "Version SQL prepared. Use 'query' command to execute manually for safety."
    echo "$version_sql"
}

# =============================================================================
# Main Script
# =============================================================================

main() {
    # Check if running without command
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi

    # Check environment
    check_env

    # Parse command
    case "$1" in
        migrate)
            if [ -z "$2" ]; then
                log_error "Please provide a migration file"
                log_info "Usage: ./supabase.sh migrate <file.sql>"
                exit 1
            fi
            apply_migration "$2"
            ;;
        query)
            if [ -z "$2" ]; then
                log_error "Please provide a SQL query"
                log_info "Usage: ./supabase.sh query \"SELECT * FROM User\""
                exit 1
            fi
            execute_sql "$2"
            ;;
        table)
            if [ -z "$2" ]; then
                log_error "Please provide a table name"
                log_info "Usage: ./supabase.sh table User"
                exit 1
            fi
            show_table "$2"
            ;;
        list-tables)
            list_tables
            ;;
        backup)
            backup_database
            ;;
        seed)
            apply_seed
            ;;
        update-versions)
            update_versions
            ;;
        test-connection)
            test_connection
            ;;
        reset)
            log_error "Database reset is dangerous and disabled by default."
            log_info "To reset, use the Supabase Dashboard directly."
            exit 1
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
