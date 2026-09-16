import { test, expect } from '@playwright/test';
import { resetAppState } from './fixtures/test-helper';

test.describe('Feature 4: Processing Pipeline & Top-Level Approvals', () => {
  test.beforeEach(async ({ page }) => {
    await resetAppState(page);
    await page.goto('/approvals');
    await page.waitForLoadState('networkidle');
  });

  test('should display approval queue tabs and approver filter', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Processing & Top-Level Approvals/i })).toBeVisible();

    // Check tabs
    await expect(page.getByRole('button', { name: /Waiting Approval/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /In Processing/i })).toBeVisible();

    // Check top-level approver selector
    const approverSelect = page.locator('select');
    await expect(approverSelect.first()).toBeVisible();
  });

  test('should filter approval items by Top-Level Approver', async ({ page }) => {
    const approverSelect = page.locator('select').first();
    await approverSelect.selectOption({ value: 'Meera Nambiar' });
    await page.waitForTimeout(400);

    // Verify list updates
    await expect(page.locator('strong:has-text("Meera Nambiar")').first()).toBeVisible();
  });

  test('should approve a pending task through top-level review desk', async ({ page }) => {
    // Click Review & Sign on first item
    await page.getByRole('button', { name: /Review & Sign/i }).first().click();

    // Verify modal appears
    await expect(page.getByRole('heading', { name: /Top-Level Approval Desk/i })).toBeVisible();

    // Add approver notes
    await page.fill('textarea[placeholder*="Approved"]', 'Reviewed and approved by VP HR.');

    // Click Approve button in the modal
    await page.getByRole('button', { name: 'Approve', exact: true }).click();
    await page.waitForTimeout(400);

    // Modal closes
    await expect(page.getByRole('heading', { name: /Top-Level Approval Desk/i })).not.toBeVisible();
  });

  test('should request changes on a workflow item', async ({ page }) => {
    await page.getByRole('button', { name: /Review & Sign/i }).first().click();
    await expect(page.getByRole('heading', { name: /Top-Level Approval Desk/i })).toBeVisible();

    await page.fill('textarea[placeholder*="Approved"]', 'Please recalculate shift overtime allowances before final sign-off.');

    // Click Changes
    await page.getByRole('button', { name: 'Changes', exact: true }).click();
    await page.waitForTimeout(400);

    await expect(page.getByRole('heading', { name: /Top-Level Approval Desk/i })).not.toBeVisible();
  });
});
