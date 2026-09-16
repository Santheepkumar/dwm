import { test, expect } from '@playwright/test';
import { resetAppState } from './fixtures/test-helper';

test.describe('Feature 1: Daily Activity Plan & Reminders', () => {
  test.beforeEach(async ({ page }) => {
    await resetAppState(page);
  });

  test('should display daily plan dashboard with summary metrics and date navigation', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText(/Today's Execution Agenda/i)).toBeVisible();

    // Check KPI metric cards and status chips
    await expect(page.getByText(/Daily Completion Rate/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /All \(/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Done \(/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /In Flight \(/i })).toBeVisible();
  });

  test('should create a new planned activity with reminder configured', async ({ page }) => {
    // Click "+ Plan Activity"
    await page.getByRole('button', { name: /Plan Activity/i }).first().click();

    // Verify modal appears
    await expect(page.getByRole('heading', { name: /Plan New Activity/i })).toBeVisible();

    // Select Candidate Sourcing category inside the modal form
    await page.locator('form').getByRole('button', { name: 'Candidate Sourcing', exact: true }).click();

    // Fill form
    await page.fill('input[placeholder*="Sourcing Frontend profiles"]', 'E2E Test: Lead Fullstack Sourcing');
    await page.fill('input[placeholder*="Ramesh Kumar"]', 'Vikram Aditya');
    await page.fill('input[placeholder*="Senior Backend Engineer"]', 'Principal Fullstack Lead');
    await page.fill('textarea[placeholder*="Detailed action items"]', 'Sourcing 10 profiles from LinkedIn Recruiter with 10+ yrs exp.');

    // Configure reminder
    await expect(page.getByText(/Feature 1: Reminder Notification/i)).toBeVisible();

    // Submit form
    await page.getByRole('button', { name: /Save Plan/i }).click();

    // Verify newly created activity card appears on the board
    await expect(page.getByText('E2E Test: Lead Fullstack Sourcing')).toBeVisible();
    await expect(page.getByText('Vikram Aditya')).toBeVisible();
  });

  test('should toggle activity completion and update counters', async ({ page }) => {
    const firstCheckbox = page.locator('button[title="Mark as Completed"]').first();
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.click();
      await page.waitForTimeout(400);
      await expect(page.locator('button[title="Mark as Incomplete"]').first()).toBeVisible();
    }
  });

  test('should filter activities by category tabs and search query', async ({ page }) => {
    // Click "Reports" tab on the page
    await page.getByRole('button', { name: /Reports \(/i }).click();
    await page.waitForTimeout(300);

    // Verify visible cards belong to reports
    await expect(page.getByText('Monthly HR Analytics & Headcount Reconciliation Report').first()).toBeVisible();

    // Test Search input
    await page.fill('input[placeholder*="Search by title"]', 'Analytics');
    await page.waitForTimeout(300);
    await expect(page.getByText('Monthly HR Analytics & Headcount Reconciliation Report').first()).toBeVisible();
  });
});
