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
});
