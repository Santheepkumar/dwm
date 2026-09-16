import { test, expect } from '@playwright/test';
import { resetAppState } from './fixtures/test-helper';

test.describe('Feature 6: Upcoming Days Forward Scheduling', () => {
  test.beforeEach(async ({ page }) => {
    await resetAppState(page);
    await page.goto('/schedule');
    await page.waitForLoadState('networkidle');
  });

  test('should display 7-day rolling agenda with multi-day cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Upcoming 7-Day Schedule/i })).toBeVisible();

    // Verify day headers
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tomorrow' })).toBeVisible();

    // Verify schedule ahead button
    await expect(page.getByRole('button', { name: /Schedule Ahead/i })).toBeVisible();
  });

  test('should schedule an upcoming activity for tomorrow', async ({ page }) => {
    // Click "+ Plan For Tomorrow"
    await page.getByRole('button', { name: /Plan For Tomorrow/i }).click();

    // Verify modal appears
    await expect(page.getByRole('heading', { name: /Plan New Activity/i })).toBeVisible();

    // Select Statutory category in the modal form
    await page.locator('form').getByRole('button', { name: 'Statutory', exact: true }).click();
    await page.fill('input[placeholder*="Sourcing Frontend profiles"]', 'Statutory Return Filing (Tomorrow)');
    await page.fill('textarea[placeholder*="Detailed action items"]', 'Filing ESI monthly return on portal ahead of weekend.');

    // Save
    await page.getByRole('button', { name: /Save Plan/i }).click();
    await page.waitForTimeout(400);

    // Verify card is visible on the schedule page
    await expect(page.getByText('Statutory Return Filing (Tomorrow)')).toBeVisible();
  });
});
