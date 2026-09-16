import { test, expect } from '@playwright/test';
import { resetAppState } from './fixtures/test-helper';

test.describe('Feature 5: Weekly & Monthly Summary & Aging Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await resetAppState(page);
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
  });

  test('should display summary scorecards and switch between weekly and monthly timeframe', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Weekly & Monthly Summary & Aging/i })).toBeVisible();

    // Verify key metric cards
    await expect(page.locator('span', { hasText: 'Completed' }).first()).toBeVisible();
    await expect(page.locator('span', { hasText: 'In Flight' }).first()).toBeVisible();
    await expect(page.locator('span', { hasText: 'Long Pending' }).first()).toBeVisible();
    await expect(page.locator('span', { hasText: 'Stalled' }).first()).toBeVisible();

    // Switch to Monthly Summary
    await page.getByRole('button', { name: 'Monthly', exact: true }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText('Category Breakdown for This Month')).toBeVisible();

    // Switch back to Weekly Summary
    await page.getByRole('button', { name: 'Weekly', exact: true }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText('Category Breakdown for This Week')).toBeVisible();
  });

  test('should display Long Pending (>3 Days) items with aging and action buttons', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Long Pending Tasks/i })).toBeVisible();
    await expect(page.getByText(/overdue/i).first()).toBeVisible();

    // Verify inline Postpone & Log Work action buttons
    await expect(page.getByRole('button', { name: 'Postpone' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log Work' }).first()).toBeVisible();
  });

  test('should display Long Under Processing items with stalled badge', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Stalled in Processing/i })).toBeVisible();
    await expect(page.getByText(/Stuck/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Action Sign-off' }).first()).toBeVisible();
  });

  test('should display category breakdown completion progress bars', async ({ page }) => {
    await expect(page.getByText(/Category Breakdown/i)).toBeVisible();
    await expect(page.getByText('Candidate Sourcing').first()).toBeVisible();
    await expect(page.getByText('Reports').first()).toBeVisible();
    await expect(page.getByText('Statutory').first()).toBeVisible();
    await expect(page.getByText('Payroll').first()).toBeVisible();
    await expect(page.getByText('Engagement & Events').first()).toBeVisible();
  });
});
