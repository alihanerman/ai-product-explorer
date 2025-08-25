# Testing Guide for AI Product Explorer

This document provides comprehensive information about the testing setup and how to run tests for the AI Product Explorer application.

## 🧪 Testing Stack

### Unit Testing
- **Jest** - JavaScript testing framework
- **React Testing Library** - Testing utilities for React components
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - Custom Jest matchers for DOM elements

### End-to-End Testing
- **Playwright** - Modern e2e testing framework
- **Multi-browser support** - Chrome, Firefox, Safari, Mobile browsers
- **Visual testing** - Screenshot comparison capabilities
- **Network interception** - Mock API responses

## 📁 Test Structure

```
├── src/
│   ├── lib/
│   │   ├── __tests__/           # Unit tests for utilities
│   │   ├── stores/__tests__/    # Zustand store tests
│   │   └── hooks/__tests__/     # Custom hooks tests
│   └── components/
│       └── __tests__/           # Component tests
├── e2e/                         # End-to-end tests
├── jest.config.js               # Jest configuration
├── jest.setup.js                # Jest setup file
├── playwright.config.ts         # Playwright configuration
└── scripts/test.sh              # Test runner script
```

## 🚀 Quick Start

### Setup Test Environment
```bash
# Install dependencies and setup test environment
./scripts/test.sh setup
```

### Run All Tests
```bash
# Run complete test suite
./scripts/test.sh all
```

## 📋 Available Test Commands

### Unit Tests
```bash
# Run unit tests once
npm run test
./scripts/test.sh unit

# Run unit tests in watch mode
npm run test:watch
./scripts/test.sh unit:watch

# Run unit tests with coverage
npm run test:coverage
./scripts/test.sh unit:coverage
```

### End-to-End Tests
```bash
# Run e2e tests headless
npm run test:e2e
./scripts/test.sh e2e

# Run e2e tests with UI
npm run test:e2e:ui
./scripts/test.sh e2e:ui

# Run e2e tests in headed mode (visible browser)
npm run test:e2e:headed
./scripts/test.sh e2e:headed
```

### Other Commands
```bash
# Run linting
npm run lint
./scripts/test.sh lint

# Run CI test suite
./scripts/test.sh ci
```

## 🧩 Test Coverage

### Unit Tests Cover:

#### Utility Functions (`src/lib/utils.ts`)
- ✅ `cn()` function for class name merging
- ✅ Tailwind CSS class merging
- ✅ Conditional class handling

#### Authentication (`src/lib/auth.ts`)
- ✅ JWT token signing and verification
- ✅ Cookie-based authentication
- ✅ Error handling for invalid tokens

#### Validation Schemas (`src/lib/validations.ts`)
- ✅ Product filter validation
- ✅ Authentication data validation
- ✅ API request/response validation
- ✅ Type coercion and defaults

#### Zustand Stores
**Auth Store (`src/lib/stores/authStore.ts`)**
- ✅ Login/logout functionality
- ✅ Authentication state management
- ✅ Error handling
- ✅ API integration

**Product Store (`src/lib/stores/productStore.ts`)**
- ✅ Product fetching and filtering
- ✅ Search functionality
- ✅ Comparison feature
- ✅ Favorites management
- ✅ URL state synchronization

#### Custom Hooks (`src/lib/hooks/useDebounce.ts`)
- ✅ Value debouncing
- ✅ Function debouncing
- ✅ Cleanup on unmount
- ✅ Timer management

#### React Components
**SearchBar Component**
- ✅ Search input handling
- ✅ AI-powered query parsing
- ✅ Search suggestions
- ✅ Keyboard navigation

**ProductCard Component**
- ✅ Product information display
- ✅ Favorite functionality
- ✅ Comparison integration
- ✅ Responsive behavior

### E2E Tests Cover:

#### Authentication Flow (`e2e/auth.spec.ts`)
- ✅ Login with valid credentials
- ✅ Login error handling
- ✅ Logout functionality
- ✅ Session persistence
- ✅ Authentication redirects

#### Product Search & Filtering (`e2e/product-search.spec.ts`)
- ✅ Basic product search
- ✅ AI-powered natural language search
- ✅ Category filtering
- ✅ Price range filtering
- ✅ Product sorting
- ✅ Search suggestions
- ✅ Filter clearing
- ✅ Pagination

#### Product Comparison (`e2e/product-comparison.spec.ts`)
- ✅ Adding products to comparison
- ✅ Removing products from comparison
- ✅ Maximum comparison limit (4 products)
- ✅ AI comparison summary generation
- ✅ User preference customization
- ✅ Comparison persistence across navigation

#### Favorites Management (`e2e/favorites.spec.ts`)
- ✅ Adding/removing favorites
- ✅ Favorites page navigation
- ✅ Empty state handling
- ✅ Favorites persistence
- ✅ Favorite count display

#### Responsive Design (`e2e/responsive.spec.ts`)
- ✅ Mobile navigation
- ✅ Responsive product grid
- ✅ Mobile filter handling
- ✅ Touch interactions
- ✅ Cross-breakpoint functionality

## 🎯 Test Data & Mocking

### Unit Test Mocking
- **Next.js Router** - Mocked for navigation testing
- **Fetch API** - Global fetch mock for API calls
- **Window History** - Mocked for URL state testing
- **JWT Secret** - Test environment variable

### E2E Test Data
- **Test User**: `test@example.com` / `password`
- **Seeded Products** - Database contains test products
- **API Responses** - Real API endpoints used

## 🔧 Configuration

### Jest Configuration (`jest.config.js`)
```javascript
// Key configurations:
- testEnvironment: 'jsdom'
- setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
- moduleNameMapping: '^@/(.*)$': '<rootDir>/src/$1'
- collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}']
```

### Playwright Configuration (`playwright.config.ts`)
```typescript
// Key configurations:
- Multiple browser support (Chrome, Firefox, Safari)
- Mobile device testing
- Automatic dev server startup
- Trace collection on retry
- HTML reporting
```

## 📊 Coverage Reports

### Unit Test Coverage
```bash
npm run test:coverage
```
- Generates HTML coverage report in `coverage/` directory
- Includes line, branch, function, and statement coverage
- Excludes non-testable files (layout, CSS, etc.)

### E2E Test Reports
```bash
npm run test:e2e
```
- Generates HTML report in `playwright-report/` directory
- Includes test results, screenshots, and traces
- Available after test completion

## 🚨 Troubleshooting

### Common Issues

#### Unit Tests
1. **Module resolution errors**
   - Ensure `moduleNameMapping` in Jest config is correct
   - Check import paths use `@/` alias

2. **React Testing Library errors**
   - Wrap components in proper test environment
   - Use `screen` queries for better debugging

#### E2E Tests
1. **Server startup issues**
   - Ensure development server starts successfully
   - Check port 3000 is available
   - Increase timeout in `webServer.timeout`

2. **Browser installation**
   - Run `npx playwright install` to install browsers
   - Use `npx playwright install --with-deps` for CI

3. **Test timeouts**
   - Increase timeout for slow operations
   - Use `page.waitForLoadState('networkidle')` for API calls

### Debug Commands
```bash
# Debug unit tests
npm run test -- --verbose

# Debug e2e tests with UI
npm run test:e2e:ui

# Debug specific test file
npm run test -- SearchBar.test.tsx

# Debug e2e test with headed browser
npm run test:e2e:headed
```

## 🔄 Continuous Integration

### CI Configuration
The `./scripts/test.sh ci` command runs:
1. Unit tests with coverage
2. Linting
3. E2E tests in CI mode
4. Automatic browser installation

### GitHub Actions Example
```yaml
- name: Run tests
  run: ./scripts/test.sh ci
  env:
    CI: true
```

## 📝 Writing New Tests

### Unit Test Example
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  it('should handle user interaction', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(screen.getByText('Clicked')).toBeInTheDocument()
  })
})
```

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test'

test('should perform user flow', async ({ page }) => {
  await page.goto('/')
  
  await page.fill('[data-testid="input"]', 'test value')
  await page.click('[data-testid="submit"]')
  
  await expect(page.locator('[data-testid="result"]')).toBeVisible()
})
```

## 🎉 Best Practices

### Unit Testing
- Use `data-testid` attributes for reliable element selection
- Mock external dependencies (APIs, routers, etc.)
- Test user interactions, not implementation details
- Aim for high coverage of critical business logic

### E2E Testing
- Use `data-testid` attributes consistently
- Wait for network requests to complete
- Test complete user workflows
- Include error scenarios and edge cases
- Test responsive behavior across devices

### General
- Keep tests focused and independent
- Use descriptive test names
- Group related tests with `describe` blocks
- Clean up after tests (mocks, state, etc.)
- Run tests frequently during development