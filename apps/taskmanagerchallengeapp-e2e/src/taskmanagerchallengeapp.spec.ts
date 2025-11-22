import { test, expect } from '@playwright/test';

// Test Data
const EDITOR_EMAIL = 'user1@faketest.com';
const EDITOR_PASS = 'MK2~DT?8R^=G~5oaM6Gw+8';

test.describe('Task Manager App', () => {

  test.beforeEach(async ({ page }) => {
    // Go to login page before each test
    await page.goto('/login');
  });

  test('should login successfully and redirect to dashboard', async ({ page }) => {
    // 1. Check Login Page Elements
    await expect(page.locator('h2')).toContainText('Task Login');
    
    // 2. Fill Credentials
    await page.fill('input[name="email"]', EDITOR_EMAIL);
    await page.fill('input[name="password"]', EDITOR_PASS);

    // 3. Submit
    await page.click('button[type="submit"]');

    // 4. Verify Redirect to Dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // 5. Verify Dashboard Content
    await expect(page.locator('h2')).toContainText('Task Dashboard');
    await expect(page.locator('.navbar')).toContainText(EDITOR_EMAIL);
  });

  test('should show error on invalid login', async ({ page }) => {
    await page.fill('input[name="email"]', EDITOR_EMAIL);
    await page.fill('input[name="password"]', 'WRONG_PASS');
    await page.click('button[type="submit"]');

    // Expect Error Message
    await expect(page.locator('.alert-danger')).toBeVisible();
    await expect(page.locator('.alert-danger')).toContainText('Login failed');
  });

  test('should allow creating a task (Editor Role)', async ({ page }) => {
    // Login
    await page.fill('input[name="email"]', EDITOR_EMAIL);
    await page.fill('input[name="password"]', EDITOR_PASS);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Click "Create Task"
    await page.click('a[href="/tasks/add"]'); // Or button selector
    await expect(page).toHaveURL('/tasks/add');

    // Fill Task Form
    const taskTitle = `E2E Task ${Date.now()}`;
    await page.fill('input[name="title"]', taskTitle);
    await page.fill('textarea[name="description"]', 'Created via Playwright');
    
    // Submit
    await page.click('button[type="submit"]');

    // Verify Redirect back to Dashboard
    await expect(page).toHaveURL('/dashboard');

    // Verify Task appears in list
    // Note: Assuming the new task appears at the top or we can filter for it
    await expect(page.locator('body')).toContainText(taskTitle);
  });

  test('should logout successfully', async ({ page }) => {
    // Login
    await page.fill('input[name="email"]', EDITOR_EMAIL);
    await page.fill('input[name="password"]', EDITOR_PASS);
    await page.click('button[type="submit"]');

    // Open User Dropdown
    await page.click('#navbarDropdown');

    // Click Logout
    await page.click('button:has-text("Logout")');

    // Verify Redirect to Login
    await expect(page).toHaveURL('/login');
  });

});
