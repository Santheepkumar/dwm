import { test, expect } from '@playwright/test';
import { resetAppState } from './fixtures/test-helper';

test.describe('Feature 2: Activity Plan vs Actual Work Done', () => {
  test.beforeEach(async ({ page }) => {
    await resetAppState(page);
    await page.goto('/plan-vs-actual');
    await page.waitForLoadState('networkidle');
  });

  test('should display plan vs actual scorecards and table ledger', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Plan vs Actual Work Done/i })).toBeVisible();
    await expect(page.getByText('Planned Effort').first()).toBeVisible();
    await expect(page.getByText('Actual Time Spent').first()).toBeVisible();
    await expect(page.getByText('Net Variance').first()).toBeVisible();

    // Table headers
    await expect(page.getByRole('columnheader', { name: /Activity & Details/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Planned Hours/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Actual Hours/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Variance/i })).toBeVisible();
  });

  test('should log actual work hours and calculate variance dynamically', async ({ page }) => {
    // Click "Log" on first item
    await page.getByRole('button', { name: 'Log', exact: true }).first().click();

    // Verify modal appears
    await expect(page.getByRole('heading', { name: /Log Actual Work Done/i })).toBeVisible();

    // Update actual hours to 3.5
    const actualInput = page.locator('input[type="number"][min="0"]');
    await actualInput.fill('3.5');

    // Verify calculated variance displays in modal
    await expect(page.getByText(/Variance Analysis:/i)).toBeVisible();

    // Add remarks
    await page.fill('textarea[placeholder*="What was completed"]', 'Encountered delays reviewing additional candidate portfolios.');

    // Save
    await page.getByRole('button', { name: /Save Actual Work/i }).click();

    // Verify updated actual hours in table
    await expect(page.getByText('3.5 hrs').first()).toBeVisible();
  });

  test('should export plan vs actual report to CSV', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Export CSV/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('dwm_plan_vs_actual');
  });
});
