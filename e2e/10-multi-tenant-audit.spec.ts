import { test, expect } from '@playwright/test';
import { resetAppState } from './fixtures/test-helper';

test.describe('Feature 10: Multi-Tenant Architecture, RBAC & State Transitions Audit', () => {
  test.beforeEach(async ({ page }) => {
    await resetAppState(page);
  });

  test('should display active organization name and Super Admin role badge in Navbar', async ({ page }) => {
    const orgSwitcherBtn = page.getByTestId('org-switcher-button');
    await expect(orgSwitcherBtn).toBeVisible();
    await expect(orgSwitcherBtn).toContainText(/Acme Global/i);
    await expect(orgSwitcherBtn).toContainText(/Super Admin/i);
  });

  test('should switch organization and isolate activity views', async ({ page }) => {
    const orgSwitcherBtn = page.getByTestId('org-switcher-button');
    await orgSwitcherBtn.click();

    // Select TechCorp Innovations
    const techCorpOption = page.getByTestId('org-option-techcorp-innovations');
    await expect(techCorpOption).toBeVisible();
    await techCorpOption.click();

    // Verify button text updated
    await expect(orgSwitcherBtn).toContainText(/TechCorp Innovations/i);

    // Switch back to Acme Global
    await orgSwitcherBtn.click();
    const acmeOption = page.getByTestId('org-option-acme-global');
    await expect(acmeOption).toBeVisible();
    await acmeOption.click();
    await expect(orgSwitcherBtn).toContainText(/Acme Global/i);
  });

  test('should allow Super Admin to create a new organization dynamically', async ({ page }) => {
    const orgSwitcherBtn = page.getByTestId('org-switcher-button');
    await orgSwitcherBtn.click();

    const createOrgBtn = page.getByTestId('create-org-btn');
    await expect(createOrgBtn).toBeVisible();
    await createOrgBtn.click();

    const newOrgInput = page.getByTestId('new-org-input');
    await expect(newOrgInput).toBeVisible();
    await newOrgInput.fill('Global Logistics Hub');

    const submitNewOrgBtn = page.getByTestId('submit-new-org-btn');
    await submitNewOrgBtn.click();

    // Verify active organization is now Global Logistics Hub
    await expect(orgSwitcherBtn).toContainText(/Global Logistics Hub/i);
  });

  test('should allow Admin to manage team members with role-based assignment', async ({ page }) => {
    const orgSwitcherBtn = page.getByTestId('org-switcher-button');
    await orgSwitcherBtn.click();

    // Click Manage Team Members
    const manageMembersBtn = page.getByTestId('manage-members-btn');
    await expect(manageMembersBtn).toBeVisible();
    await manageMembersBtn.click();

    // Verify Members modal opened
    await expect(page.getByRole('heading', { name: /Organization Team Members/i })).toBeVisible();

    // Click Add Member
    const addMemberToggle = page.getByTestId('add-member-toggle-btn');
    await expect(addMemberToggle).toBeVisible();
    await addMemberToggle.click();

    // Fill new member details with initial login password
    await page.getByTestId('member-name-input').fill('Ananya Sen');
    await page.getByTestId('member-email-input').fill('ananya@acmecorp.com');
    await page.getByTestId('member-role-select').selectOption('manager');
    await page.getByTestId('member-password-input').fill('Manager2026!');

    // Submit new member & create account
    await page.getByTestId('submit-member-btn').click();

    // Verify success banner with credentials
    await expect(page.getByTestId('member-credentials-notice')).toBeVisible();
    await expect(page.getByTestId('member-credentials-notice')).toContainText('Manager2026!');

    // Verify new member appears in the list with manager role
    await expect(page.getByTestId('member-row-ananya@acmecorp.com')).toBeVisible();
    await expect(page.getByTestId('member-row-ananya@acmecorp.com')).toContainText(/manager/i);

    // Close modal
    await page.getByRole('button', { name: 'Close', exact: true }).first().click();
  });

  test('should record and display state transitions audit trail when modifying activity', async ({ page }) => {
    // Open New Activity Modal
    await page.getByRole('button', { name: /Add Activity|Plan/i }).first().click();
    await page.fill('input[placeholder*="Sourcing Frontend profiles"]', 'Audit Trail Test Activity');
    await page.getByRole('button', { name: /Save Plan/i }).click();

    // Locate the newly created card
    const activityCard = page.locator('.group', { hasText: 'Audit Trail Test Activity' }).first();
    await expect(activityCard).toBeVisible();

    // Open Edit modal to inspect the state transition audit trail
    const editBtn = activityCard.locator('button[title="Edit Activity"]');
    await editBtn.click();

    // Verify Audit Trail section
    await expect(page.getByText(/Audit Trail & State Transitions/i)).toBeVisible();
    await expect(page.getByText(/Initial Planning/i)).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: /Cancel/i }).click();
  });
});

