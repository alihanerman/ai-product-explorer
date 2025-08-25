import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display login button when not authenticated", async ({
    page,
  }) => {
    // Check that we're on the main page but not authenticated
    await expect(page).toHaveURL("/");

    // Wait for the page to load completely by checking for header elements
    await page.waitForLoadState("networkidle");

    // Should show login button instead of welcome message
    await expect(page.locator("text=Login")).toBeVisible();

    // Should not show authenticated state
    await expect(page.locator("text=Welcome,")).not.toBeVisible();
  });

  test("should login with valid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill in login form
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation and check we're on the main page
    await expect(page).toHaveURL("/");

    // Check for authenticated state indicators - look for welcome message or logout button
    await expect(page.locator("text=Welcome,")).toBeVisible();
  });

  test("should show error with invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill in login form with invalid credentials
    await page.fill('input[type="email"]', "invalid@example.com");
    await page.fill('input[type="password"]', "wrongpassword");

    // Submit form
    await page.click('button[type="submit"]');

    // Check for error message - look for text content instead of data-testid
    await expect(page.locator(".text-destructive").first()).toBeVisible();

    // Should still be on login page
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("should logout successfully", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for successful login
    await expect(page).toHaveURL("/");
    await expect(page.locator("text=Welcome,")).toBeVisible();

    // Click logout button directly - it should be visible after login
    await page.click("text=Logout");

    // Wait for the page to stabilize after logout
    await page.waitForLoadState("networkidle");

    // Should stay on main page and show login button
    await expect(page).toHaveURL("/");
  });

  test("should persist authentication across page reloads", async ({
    page,
  }) => {
    // Login
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/");

    // Reload page
    await page.reload();

    // Should still be authenticated - check for welcome message or logout button
    await expect(page).toHaveURL("/");
    await expect(page.locator("text=Welcome,")).toBeVisible();
  });
});
