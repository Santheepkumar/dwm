import { test, expect } from '@playwright/test';
import { resetAppState } from './fixtures/test-helper';

test.describe('Feature 3: Postpone Activity & Advance Reminders', () => {
  test.beforeEach(async ({ page }) => {
    await resetAppState(page);
  });

  test('should postpone an activity to tomorrow with advance earlier reminder', async ({ page }) => {
    // Find first Postpone button on card
    const postponeButton = page.locator('button[title="Reschedule activity"]').first();
    await postponeButton.click();

    // Verify modal appears
    await expect(page.getByRole('heading', { name: /Postpone Activity/i })).toBeVisible();

    // Select "Tomorrow" preset
    await page.getByRole('button', { name: 'Tomorrow' }).click();

    // Verify Advance Earlier Reminder section is present
    await expect(page.getByText(/Advance Earlier Reminder/i)).toBeVisible();
    await page.locator('input[value="morning_of"]').check();

    // Fill audit reason
    await page.fill('textarea[placeholder*="Waiting for candidate response"]', 'Client requested rescheduling technical discussion to tomorrow.');

    // Confirm postpone
    await page.getByRole('button', { name: /Confirm Postpone/i }).click();

    // Navigate to Tomorrow to verify the postponed card on the new date
    await page.locator('button[aria-label="Next Day"]').click();

    // Verify postpone badge shows on card
    await expect(page.getByText(/Postponed \(1x\)/i).first()).toBeVisible();
  });

  test('should support rescheduling to custom date and verify in future plan', async ({ page }) => {
    const postponeButton = page.locator('button[title="Reschedule activity"]').first();
    await postponeButton.click();

    await page.getByRole('button', { name: 'In 2 Days' }).click();
    await page.locator('input[value="day_before"]').check();
    await page.fill('textarea[placeholder*="Waiting for candidate response"]', 'Awaiting executive approval from CFO.');

    await page.getByRole('button', { name: /Confirm Postpone/i }).click();

    // Visit /schedule to verify in 7-day rolling plan
    await page.goto('/schedule');
    await page.waitForLoadState('networkidle');

    // Verify postpone badge
    await expect(page.getByText(/Postponed \(/i).first()).toBeVisible();
  });
});
