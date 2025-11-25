import { test, expect } from '@playwright/test';

const EDITOR_EMAIL = 'user1@faketest.com';
const EDITOR_PASS = 'MK2~DT?8R^=G~5oaM6Gw+8';
const VIEWER_EMAIL = 'user2@faketest.com';
const VIEWER_PASS = '4V+726=mk>esc9DjH4=5r8';

test.describe('Task Manager Frontend E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should execute full Task Lifecycle (Login -> Create -> Edit -> Delete)', async ({ page }) => {
    await expect(page).toHaveURL(/\/login/);

    const loginBtn = page.locator('#login');
    await expect(loginBtn).toBeVisible();

    await page.locator('#email').fill(EDITOR_EMAIL);
    await page.locator('#password').fill(EDITOR_PASS);

    await loginBtn.click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h2')).toContainText('Task Dashboard');

    await expect(page.locator('#navbarDropdown')).toContainText(EDITOR_EMAIL);

    const createTaskBtn = page.locator('#createTask');
    await expect(createTaskBtn).toBeVisible();
    await createTaskBtn.click();

    await expect(page).toHaveURL('/tasks/add');

    const taskTitle = `E2E FE Task ${Date.now()}`;
    await page.locator('#title').fill(taskTitle);
    await page.locator('#description').fill('Created via Angular E2E Test');

    await page.locator('#assignToUser').selectOption({ label: EDITOR_EMAIL });

    await page.locator('#createTask').click();

    await expect(page).toHaveURL('/dashboard');

    const taskRow = page.locator('tr', { hasText: taskTitle });
    await expect(taskRow).toBeVisible();

    await taskRow.locator('button', { hasText: 'Edit' }).click();

    await expect(page).toHaveURL(/\/tasks\/update\/\d+/);

    const updatedTitle = `${taskTitle} - UPDATED`;
    await page.locator('#title').fill(updatedTitle);

    await page.locator('#isCompletedSwitch').click();

    await page.locator('#updateTask').click();

    await expect(page).toHaveURL('/dashboard');

    const updatedRow = page.locator('tr', { hasText: updatedTitle });
    await expect(updatedRow).toBeVisible();

    await expect(updatedRow).toHaveClass(/table-primary/);

    page.once('dialog', async dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });

    await updatedRow.locator('button', { hasText: 'Delete' }).click();

    await expect(page.locator('tr', { hasText: updatedTitle })).not.toBeVisible();
  });

  test('should enforce RBAC for Viewer (No Create Button)', async ({ page }) => {
    await page.locator('#email').fill(VIEWER_EMAIL);
    await page.locator('#password').fill(VIEWER_PASS);
    await page.locator('#login').click();

    await expect(page).toHaveURL('/dashboard');

    const createTaskBtn = page.locator('#createTask');
    await expect(createTaskBtn).not.toBeVisible();

    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.count() > 0) {
      const editBtn = firstRow.locator('button', { hasText: 'Edit' });
      await expect(editBtn).toHaveClass(/disabled/);
    }
  });
});
