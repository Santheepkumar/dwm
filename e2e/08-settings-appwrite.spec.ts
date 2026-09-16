import { test, expect } from '@playwright/test';
import { resetAppState } from './fixtures/test-helper';

test.describe('Feature 8: Settings & Appwrite Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await resetAppState(page);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display Appwrite credentials form and test connection button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Settings & Appwrite Backend/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Appwrite Credentials/i })).toBeVisible();

    // Verify fields
    await expect(page.locator('input[placeholder*="https://cloud.appwrite.io/v1"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Save Credentials/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Test Connection/i })).toBeVisible();
  });

  test('should display 1-Click Auto-Provision schema section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /1-Click Auto-Provision/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Auto-Create All 25 Columns & Database/i })).toBeVisible();
  });

  test('should reset demo data and trigger success notification', async ({ page }) => {
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.getByRole('button', { name: /Reset to Sample Data/i }).click();
    await expect(page.getByText(/All 5 example workflows .* have been restored/i)).toBeVisible();
  });

  test('should block non-super-admin users from accessing /settings and hide settings nav button', async ({ page }) => {
    // Override auth with a standard member user
    await page.addInitScript(() => {
      localStorage.setItem(
        'dwm_auth_user',
        JSON.stringify({
          id: 'user_regular_001',
          name: 'Regular Member',
          email: 'member@acmecorp.com',
          status: true,
        })
      );
      localStorage.setItem(
        'dwm_memberships_data',
        JSON.stringify([
          {
            id: 'mem_reg_01',
            tenantId: 'org_default',
            userId: 'user_regular_001',
            userName: 'Regular Member',
            userEmail: 'member@acmecorp.com',
            role: 'member',
            department: 'Operations',
            isActive: true,
          },
        ])
      );
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify Settings button is NOT visible in Navbar
    await expect(page.getByTestId('settings-nav-btn')).not.toBeVisible();

    // Directly navigate to /settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Verify Restricted Access gate is shown
    await expect(page.getByTestId('settings-access-denied')).toBeVisible();
    await expect(page.getByText(/Restricted Access/i)).toBeVisible();
    await expect(page.getByText(/Only Super Administrators are authorized/i)).toBeVisible();

    // Verify sensitive configuration form is NOT accessible
    await expect(page.getByRole('button', { name: /Save Credentials/i })).not.toBeVisible();
  });
});
