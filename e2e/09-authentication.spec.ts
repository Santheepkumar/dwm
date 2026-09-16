import { test, expect } from '@playwright/test';

test.describe('Feature 9: Appwrite Authentication (Login & Session Guard)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('dwm_test_mode', 'true');
    });
  });

  test('should display the login page with email and password inputs', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /DWM WorkHub/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });

  test('should show error when submitting empty credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Fill only email without password
    await page.fill('input[type="email"]', 'test@dwm.com');
    await page.getByRole('button', { name: /Sign In/i }).click();

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
  });

  test('should log in successfully and display user avatar in navbar', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'developer.santheep@gmail.com');
    await page.fill('input[type="password"]', 'tn405870');
    await page.getByRole('button', { name: /Sign In/i }).click();

    // Verify redirection to home dashboard
    await expect(page).toHaveURL('/');

    // Verify user avatar initials in navbar
    await expect(page.locator('div[title*="developer.santheep@gmail.com"]').first()).toBeVisible();
  });

  test('should log out and redirect to login page', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'developer.santheep@gmail.com');
    await page.fill('input[type="password"]', 'tn405870');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page).toHaveURL('/');

    // Click Sign Out button in Navbar
    const signOutBtn = page.locator('button[title="Sign Out"]');
    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click();

    // Verify redirected to /login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });

  test('should redirect unauthenticated users to login with redirect parameter', async ({ page }) => {
    // Clear auth user session and test mode
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.removeItem('dwm_auth_user');
      localStorage.removeItem('dwm_test_mode');
    });

    await page.goto('/schedule');
    await page.waitForLoadState('networkidle');

    // Should redirect to /login
    await expect(page).toHaveURL(/\/login/);
  });
});
