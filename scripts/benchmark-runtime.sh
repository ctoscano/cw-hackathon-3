#!/bin/bash

# Runtime Performance Comparison: Node.js vs Bun
# This script benchmarks build and dev server startup times

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
WEB_DIR="$PROJECT_ROOT/apps/web"

# Function to print header
print_header() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${BOLD}$1${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
}

# Function to print section
print_section() {
    echo ""
    echo -e "${YELLOW}--- $1 ---${NC}"
    echo ""
}

# Function to calculate speedup
calc_speedup() {
    local node_time=$1
    local bun_time=$2
    # Use bc for floating point division
    if command -v bc &> /dev/null; then
        echo "scale=2; $node_time / $bun_time" | bc
    else
        # Fallback to awk if bc not available
        awk "BEGIN {printf \"%.2f\", $node_time / $bun_time}"
    fi
}

# Function to get time in seconds
get_time_seconds() {
    local start=$1
    local end=$2
    echo "scale=3; $end - $start" | bc 2>/dev/null || awk "BEGIN {printf \"%.3f\", $end - $start}"
}

# Check for required tools
check_requirements() {
    print_section "Checking Requirements"

    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Node.js: $(node --version)"

    if ! command -v bun &> /dev/null; then
        echo -e "${RED}Error: Bun is not installed${NC}"
        echo "Install Bun: curl -fsSL https://bun.sh/install | bash"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Bun: $(bun --version)"

    if ! command -v pnpm &> /dev/null; then
        echo -e "${RED}Error: pnpm is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓${NC} pnpm: $(pnpm --version)"
}

# Benchmark build
benchmark_build() {
    print_section "Build Benchmark"

    cd "$WEB_DIR"

    # Clean previous builds
    rm -rf .next

    echo -e "${BLUE}Building with Node.js...${NC}"
    local node_start=$(date +%s.%N)
    pnpm build > /dev/null 2>&1
    local node_end=$(date +%s.%N)
    local node_time=$(get_time_seconds $node_start $node_end)
    echo -e "${GREEN}✓${NC} Node.js build: ${BOLD}${node_time}s${NC}"

    # Clean for Bun build
    rm -rf .next

    echo -e "${BLUE}Building with Bun...${NC}"
    local bun_start=$(date +%s.%N)
    pnpm build:bun > /dev/null 2>&1
    local bun_end=$(date +%s.%N)
    local bun_time=$(get_time_seconds $bun_start $bun_end)
    echo -e "${GREEN}✓${NC} Bun build: ${BOLD}${bun_time}s${NC}"

    local speedup=$(calc_speedup $node_time $bun_time)

    echo ""
    echo -e "${CYAN}Build Results:${NC}"
    echo -e "  Node.js: ${node_time}s"
    echo -e "  Bun:     ${bun_time}s"
    if (( $(echo "$speedup > 1" | bc -l 2>/dev/null || awk "BEGIN {print ($speedup > 1)}") )); then
        echo -e "  ${GREEN}Speedup: ${speedup}x faster with Bun${NC}"
    else
        local inverse=$(calc_speedup $bun_time $node_time)
        echo -e "  ${YELLOW}Node.js was ${inverse}x faster${NC}"
    fi

    # Store results for summary
    BUILD_NODE_TIME=$node_time
    BUILD_BUN_TIME=$bun_time
    BUILD_SPEEDUP=$speedup
}

# Benchmark dev server startup
benchmark_dev_startup() {
    print_section "Dev Server Startup Benchmark"

    cd "$WEB_DIR"

    # We measure time to first "Ready" message
    echo -e "${BLUE}Testing Node.js dev server startup...${NC}"
    local node_start=$(date +%s.%N)
    timeout 30 sh -c 'pnpm dev 2>&1 | while read line; do
        echo "$line"
        if echo "$line" | grep -q "Ready in"; then
            pkill -f "next dev" 2>/dev/null || true
            exit 0
        fi
    done' 2>/dev/null || true
    local node_end=$(date +%s.%N)
    local node_time=$(get_time_seconds $node_start $node_end)

    # Kill any remaining processes
    pkill -f "next dev" 2>/dev/null || true
    sleep 1

    echo -e "${GREEN}✓${NC} Node.js startup: ${BOLD}${node_time}s${NC}"

    echo -e "${BLUE}Testing Bun dev server startup...${NC}"
    local bun_start=$(date +%s.%N)
    timeout 30 sh -c 'pnpm dev:bun 2>&1 | while read line; do
        echo "$line"
        if echo "$line" | grep -q "Ready in"; then
            pkill -f "bun.*next dev" 2>/dev/null || true
            pkill -f "next dev" 2>/dev/null || true
            exit 0
        fi
    done' 2>/dev/null || true
    local bun_end=$(date +%s.%N)
    local bun_time=$(get_time_seconds $bun_start $bun_end)

    # Kill any remaining processes
    pkill -f "bun.*next dev" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true

    echo -e "${GREEN}✓${NC} Bun startup: ${BOLD}${bun_time}s${NC}"

    local speedup=$(calc_speedup $node_time $bun_time)

    echo ""
    echo -e "${CYAN}Dev Server Startup Results:${NC}"
    echo -e "  Node.js: ${node_time}s"
    echo -e "  Bun:     ${bun_time}s"
    if (( $(echo "$speedup > 1" | bc -l 2>/dev/null || awk "BEGIN {print ($speedup > 1)}") )); then
        echo -e "  ${GREEN}Speedup: ${speedup}x faster with Bun${NC}"
    else
        local inverse=$(calc_speedup $bun_time $node_time)
        echo -e "  ${YELLOW}Node.js was ${inverse}x faster${NC}"
    fi

    # Store results for summary
    DEV_NODE_TIME=$node_time
    DEV_BUN_TIME=$bun_time
    DEV_SPEEDUP=$speedup
}

# Print final summary
print_summary() {
    print_header "Performance Summary"

    echo -e "${BOLD}BUILD COMPARISON:${NC}"
    echo -e "  Node.js build: ${BUILD_NODE_TIME}s"
    echo -e "  Bun build:     ${BUILD_BUN_TIME}s"
    echo -e "  Speedup:       ${BUILD_SPEEDUP}x"
    echo ""
    echo -e "${BOLD}DEV SERVER STARTUP:${NC}"
    echo -e "  Node.js startup: ${DEV_NODE_TIME}s"
    echo -e "  Bun startup:     ${DEV_BUN_TIME}s"
    echo -e "  Speedup:         ${DEV_SPEEDUP}x"
    echo ""

    # Overall verdict
    if (( $(echo "$BUILD_SPEEDUP > 1" | bc -l 2>/dev/null || awk "BEGIN {print ($BUILD_SPEEDUP > 1)}") )) && \
       (( $(echo "$DEV_SPEEDUP > 1" | bc -l 2>/dev/null || awk "BEGIN {print ($DEV_SPEEDUP > 1)}") )); then
        echo -e "${GREEN}${BOLD}Verdict: Bun is faster for both build and dev server!${NC}"
    elif (( $(echo "$BUILD_SPEEDUP > 1" | bc -l 2>/dev/null || awk "BEGIN {print ($BUILD_SPEEDUP > 1)}") )); then
        echo -e "${YELLOW}${BOLD}Verdict: Bun is faster for builds, Node.js for dev server${NC}"
    elif (( $(echo "$DEV_SPEEDUP > 1" | bc -l 2>/dev/null || awk "BEGIN {print ($DEV_SPEEDUP > 1)}") )); then
        echo -e "${YELLOW}${BOLD}Verdict: Bun is faster for dev server, Node.js for builds${NC}"
    else
        echo -e "${YELLOW}${BOLD}Verdict: Node.js was faster in these tests${NC}"
    fi
}

# Main execution
main() {
    print_header "Runtime Performance Comparison: Node.js vs Bun"

    check_requirements
    benchmark_build
    benchmark_dev_startup
    print_summary

    cd "$PROJECT_ROOT"
}

main "$@"
