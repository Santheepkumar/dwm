import { test, expect } from '@playwright/test';
import { resetAppState } from './fixtures/test-helper';

test.describe('Specialized 5 Activity Pipelines', () => {
  test.beforeEach(async ({ page }) => {
    await resetAppState(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Pipeline 1: Candidate Sourcing pipeline with candidate fields', async ({ page }) => {
    await page.getByRole('button', { name: /Plan Activity/i }).first().click();
    await page.locator('form').getByRole('button', { name: 'Candidate Sourcing', exact: true }).click();

    await page.fill('input[placeholder*="Sourcing Frontend profiles"]', 'DevOps Lead Candidate Pipeline');
    await page.fill('input[placeholder*="Ramesh Kumar"]', 'Siddharth Roy');
    await page.fill('input[placeholder*="Senior Backend Engineer"]', 'Principal DevOps Architect');

    await page.getByRole('button', { name: /Save Plan/i }).click();

    await expect(page.getByText('DevOps Lead Candidate Pipeline')).toBeVisible();
    await expect(page.getByText('Siddharth Roy')).toBeVisible();
  });

  test('Pipeline 2: Reports pipeline with frequency and approval submission', async ({ page }) => {
    await page.getByRole('button', { name: /Plan Activity/i }).first().click();
    await page.locator('form').getByRole('button', { name: 'Reports', exact: true }).click();

    await page.fill('input[placeholder*="Sourcing Frontend profiles"]', 'Monthly Labor Law Compliance Audit');
    await page.fill('input[placeholder*="Monthly Attrition"]', 'Monthly Internal HR Audit');

    await page.getByRole('button', { name: /Save Plan/i }).click();

    await expect(page.getByText('Monthly Labor Law Compliance Audit')).toBeVisible();
  });

  test('Pipeline 3: Statutory Compliance with statutory act types', async ({ page }) => {
    await page.getByRole('button', { name: /Plan Activity/i }).first().click();
    await page.locator('form').getByRole('button', { name: 'Statutory', exact: true }).click();

    await page.fill('input[placeholder*="Sourcing Frontend profiles"]', 'Quarterly TDS 24Q Filing');

    await page.getByRole('button', { name: /Save Plan/i }).click();

    await expect(page.getByText('Quarterly TDS 24Q Filing')).toBeVisible();
  });

  test('Pipeline 4: Payroll pipeline supporting Addition, Deletion, Separation, Transfer', async ({ page }) => {
    await page.getByRole('button', { name: /Plan Activity/i }).first().click();
    await page.locator('form').getByRole('button', { name: 'Payroll', exact: true }).click();

    // Click SEPARATION subtype button
    await page.getByRole('button', { name: 'SEPARATION' }).click();
    await page.fill('input[placeholder*="Sourcing Frontend profiles"]', 'FnF Settlement: Regional Sales Lead');

    await page.getByRole('button', { name: /Save Plan/i }).click();

    await expect(page.getByText('FnF Settlement: Regional Sales Lead')).toBeVisible();
    await expect(page.getByText('SEPARATION').first()).toBeVisible();
  });

  test('Pipeline 5: Engagement Activities with budget and venue', async ({ page }) => {
    await page.getByRole('button', { name: /Plan Activity/i }).first().click();
    await page.locator('form').getByRole('button', { name: 'Engagement & Events', exact: true }).click();

    await page.fill('input[placeholder*="Sourcing Frontend profiles"]', 'Annual Sports Day & Team Carnival');
    await page.fill('input[type="number"][value="0"]', '75000');
    await page.fill('input[placeholder*="Auditorium"]', 'Sports Ground & Arena');

    await page.getByRole('button', { name: /Save Plan/i }).click();

    await expect(page.getByText('Annual Sports Day & Team Carnival')).toBeVisible();
    await expect(page.getByText('₹75,000')).toBeVisible();
  });
});
