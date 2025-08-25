#!/bin/bash

# Test runner script for AI Product Explorer

set -e

echo "🧪 Running AI Product Explorer Test Suite"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if dependencies are installed
print_status "Checking dependencies..."

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Run different test suites based on argument
case "${1:-all}" in
    "unit")
        print_status "Running unit tests..."
        npm run test
        print_success "Unit tests completed!"
        ;;
    "unit:watch")
        print_status "Running unit tests in watch mode..."
        npm run test:watch
        ;;
    "unit:coverage")
        print_status "Running unit tests with coverage..."
        npm run test:coverage
        print_success "Unit tests with coverage completed!"
        ;;
    "e2e")
        print_status "Running e2e tests..."
        
        # Check if Playwright is installed
        if ! npx playwright --version &> /dev/null; then
            print_status "Installing Playwright..."
            npx playwright install
        fi
        
        # Kill any existing processes on port 3000
        print_status "Checking for existing processes on port 3000..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        
        # Start the development server in background
        print_status "Starting development server..."
        npm run dev &
        DEV_PID=$!
        
        # Wait for server to be ready with better port detection
        print_status "Waiting for server to be ready..."
        for i in {1..30}; do
            if curl -s http://localhost:3000 > /dev/null 2>&1; then
                print_success "Server is ready on port 3000"
                break
            elif curl -s http://localhost:3001 > /dev/null 2>&1; then
                print_warning "Server is running on port 3001, updating Playwright config..."
                # Update baseURL in playwright config temporarily
                sed -i.bak 's|baseURL: .*|baseURL: "http://localhost:3001",|' playwright.config.ts
                break
            fi
            sleep 1
        done
        
        # Run e2e tests
        npm run test:e2e
        
        # Kill the development server
        kill $DEV_PID 2>/dev/null || true
        
        # Restore playwright config if it was modified
        if [ -f "playwright.config.ts.bak" ]; then
            mv playwright.config.ts.bak playwright.config.ts
        fi
        
        print_success "E2E tests completed!"
        ;;
    "e2e:ui")
        print_status "Running e2e tests with UI..."
        
        # Start the development server in background
        npm run dev &
        DEV_PID=$!
        
        sleep 10
        npm run test:e2e:ui
        
        kill $DEV_PID 2>/dev/null || true
        ;;
    "e2e:headed")
        print_status "Running e2e tests in headed mode..."
        
        npm run dev &
        DEV_PID=$!
        
        sleep 10
        npm run test:e2e:headed
        
        kill $DEV_PID 2>/dev/null || true
        ;;
    "lint")
        print_status "Running linter..."
        npm run lint
        print_success "Linting completed!"
        ;;
    "all")
        print_status "Running all tests..."
        
        # Run unit tests
        print_status "1/3 Running unit tests..."
        npm run test
        print_success "Unit tests passed!"
        
        # Run linting
        print_status "2/3 Running linter..."
        npm run lint
        print_success "Linting passed!"
        
        # Run e2e tests
        print_status "3/3 Running e2e tests..."
        
        if ! npx playwright --version &> /dev/null; then
            print_status "Installing Playwright..."
            npx playwright install
        fi
        
        npm run dev &
        DEV_PID=$!
        
        sleep 10
        npm run test:e2e
        
        kill $DEV_PID 2>/dev/null || true
        
        print_success "All tests completed successfully! 🎉"
        ;;
    "ci")
        print_status "Running CI test suite..."
        
        # Set CI environment
        export CI=true
        
        # Run unit tests with coverage
        npm run test:coverage
        
        # Run linting
        npm run lint
        
        # Run e2e tests (CI mode)
        if ! npx playwright --version &> /dev/null; then
            npx playwright install --with-deps
        fi
        
        npm run dev &
        DEV_PID=$!
        
        sleep 15
        npm run test:e2e
        
        kill $DEV_PID 2>/dev/null || true
        
        print_success "CI test suite completed!"
        ;;
    "setup")
        print_status "Setting up test environment..."
        
        # Install dependencies
        npm install
        
        # Install Playwright
        npx playwright install
        
        # Generate Prisma client
        npm run prisma:generate
        
        print_success "Test environment setup completed!"
        ;;
    *)
        echo "Usage: $0 {unit|unit:watch|unit:coverage|e2e|e2e:ui|e2e:headed|lint|all|ci|setup}"
        echo ""
        echo "Commands:"
        echo "  unit          - Run unit tests"
        echo "  unit:watch    - Run unit tests in watch mode"
        echo "  unit:coverage - Run unit tests with coverage report"
        echo "  e2e           - Run end-to-end tests"
        echo "  e2e:ui        - Run e2e tests with Playwright UI"
        echo "  e2e:headed    - Run e2e tests in headed mode"
        echo "  lint          - Run ESLint"
        echo "  all           - Run all tests (default)"
        echo "  ci            - Run CI test suite"
        echo "  setup         - Setup test environment"
        exit 1
        ;;
esac