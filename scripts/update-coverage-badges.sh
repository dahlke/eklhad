#!/bin/bash

# Script to extract coverage percentages and update README badges
# This script extracts coverage from Go and JS test outputs and updates the README

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
README_PATH="$PROJECT_ROOT/README.md"
WEB_DIR="$PROJECT_ROOT/web"
FRONTEND_DIR="$PROJECT_ROOT/web/frontend"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Extracting coverage percentages..."

# Extract Go coverage
GO_COVERAGE="0%"
if [ -f "$WEB_DIR/coverage.out" ]; then
    # Run go tool cover to get coverage percentage
    GO_COVERAGE_OUTPUT=$(cd "$WEB_DIR" && go tool cover -func=coverage.out 2>/dev/null | tail -1 | awk '{print $3}')
    if [ -n "$GO_COVERAGE_OUTPUT" ]; then
        GO_COVERAGE="$GO_COVERAGE_OUTPUT"
    fi
else
    echo -e "${YELLOW}Warning: Go coverage file not found. Running tests to generate it...${NC}"
    cd "$WEB_DIR" && go test -v ./... -coverprofile=coverage.out > /dev/null 2>&1
    GO_COVERAGE_OUTPUT=$(cd "$WEB_DIR" && go tool cover -func=coverage.out 2>/dev/null | tail -1 | awk '{print $3}')
    if [ -n "$GO_COVERAGE_OUTPUT" ]; then
        GO_COVERAGE="$GO_COVERAGE_OUTPUT"
    fi
fi

# Extract JS coverage
JS_COVERAGE="0%"
if [ -d "$FRONTEND_DIR/node_modules" ]; then
    # Run JS tests with coverage and extract percentage
    cd "$FRONTEND_DIR"
    JS_TEST_OUTPUT=$(npm run test:coverage 2>&1 || true)
    # Try to extract coverage from various formats
    # Format 1: "frontend/src | 37.39 | 25 | 33.33 | 37.39" - get the first percentage (Statements)
    JS_COVERAGE_OUTPUT=$(echo "$JS_TEST_OUTPUT" | grep -E "frontend/src\s+\|" | awk '{print $3}' || echo "")
    if [ -n "$JS_COVERAGE_OUTPUT" ]; then
        # Add % sign if not present
        if [[ ! "$JS_COVERAGE_OUTPUT" =~ % ]]; then
            JS_COVERAGE_OUTPUT="${JS_COVERAGE_OUTPUT}%"
        fi
    fi
    if [ -z "$JS_COVERAGE_OUTPUT" ]; then
        # Format 2: "All files | 6.99 | 34.14 | 35.89 | 6.99" - get the first percentage
        JS_COVERAGE_OUTPUT=$(echo "$JS_TEST_OUTPUT" | grep -E "All files\s+\|" | awk '{print $3}' || echo "")
        if [ -n "$JS_COVERAGE_OUTPUT" ]; then
            # Add % sign if not present
            if [[ ! "$JS_COVERAGE_OUTPUT" =~ % ]]; then
                JS_COVERAGE_OUTPUT="${JS_COVERAGE_OUTPUT}%"
            fi
        fi
    fi
    if [ -z "$JS_COVERAGE_OUTPUT" ]; then
        # Format 3: Look for percentage pattern in coverage summary
        JS_COVERAGE_OUTPUT=$(echo "$JS_TEST_OUTPUT" | grep -E "[0-9]+\.[0-9]+%" | tail -1 | grep -oE "[0-9]+\.[0-9]+%" || echo "")
    fi
    if [ -n "$JS_COVERAGE_OUTPUT" ]; then
        JS_COVERAGE="$JS_COVERAGE_OUTPUT"
    fi
else
    echo -e "${YELLOW}Warning: node_modules not found. Skipping JS coverage extraction.${NC}"
fi

# Determine badge colors based on coverage
get_badge_color() {
    local coverage=$1
    # Remove % sign and convert to number
    local num=$(echo "$coverage" | sed 's/%//' | awk '{print int($1)}')
    if [ "$num" -ge 80 ]; then
        echo "brightgreen"
    elif [ "$num" -ge 60 ]; then
        echo "green"
    elif [ "$num" -ge 40 ]; then
        echo "yellow"
    elif [ "$num" -ge 20 ]; then
        echo "orange"
    else
        echo "red"
    fi
}

GO_COLOR=$(get_badge_color "$GO_COVERAGE")
JS_COLOR=$(get_badge_color "$JS_COVERAGE")

# URL encode the coverage percentage for shields.io
GO_COVERAGE_ENCODED=$(echo "$GO_COVERAGE" | sed 's/%/%25/g')
JS_COVERAGE_ENCODED=$(echo "$JS_COVERAGE" | sed 's/%/%25/g')

# Generate badge URLs
GO_BADGE="https://img.shields.io/badge/coverage-${GO_COVERAGE_ENCODED}-${GO_COLOR}?logo=go&logoColor=white"
JS_BADGE="https://img.shields.io/badge/coverage-${JS_COVERAGE_ENCODED}-${JS_COLOR}?logo=javascript&logoColor=white"

# Update README with badges
if [ -f "$README_PATH" ]; then
    # Check if badges already exist
    if grep -q "Go Coverage\|JavaScript Coverage" "$README_PATH" 2>/dev/null; then
        # Update existing badges - use a temporary file for cross-platform compatibility
        TEMP_FILE=$(mktemp)
        # Read the README and replace badge lines
        while IFS= read -r line; do
            if [[ "$line" =~ "Go Coverage" ]]; then
                echo "![Go Coverage]($GO_BADGE)" >> "$TEMP_FILE"
            elif [[ "$line" =~ "JavaScript Coverage" ]]; then
                echo "![JavaScript Coverage]($JS_BADGE)" >> "$TEMP_FILE"
            else
                echo "$line" >> "$TEMP_FILE"
            fi
        done < "$README_PATH"
        mv "$TEMP_FILE" "$README_PATH"
    else
        # Add badges at the top after the title
        if grep -q "^# Eklhad" "$README_PATH"; then
            # Create a temporary file with the badges
            TEMP_FILE=$(mktemp)
            # Write title
            echo "# Eklhad" > "$TEMP_FILE"
            echo "" >> "$TEMP_FILE"
            echo "![Go Coverage]($GO_BADGE)" >> "$TEMP_FILE"
            echo "![JavaScript Coverage]($JS_BADGE)" >> "$TEMP_FILE"
            echo "" >> "$TEMP_FILE"
            # Append rest of README (skip first line which is the title)
            tail -n +2 "$README_PATH" >> "$TEMP_FILE"
            mv "$TEMP_FILE" "$README_PATH"
        fi
    fi
    echo -e "${GREEN}✓ Coverage badges updated in README${NC}"
    echo "  Go: $GO_COVERAGE"
    echo "  JavaScript: $JS_COVERAGE"
else
    echo -e "${YELLOW}Warning: README.md not found at $README_PATH${NC}"
fi

