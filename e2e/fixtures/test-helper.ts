import { Page } from '@playwright/test';

/**
 * Resets local storage and application state to clean seed data instantly with super_admin credentials
 */
export async function resetAppState(page: Page) {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('dwm_test_mode', 'true');
    localStorage.setItem(
      'dwm_auth_user',
      JSON.stringify({
        id: '6aaa603d00369d16e0a0',
        name: 'Santheep',
        email: 'developer.santheep@gmail.com',
        status: true,
      })
    );
    localStorage.setItem('dwm_active_tenant_id', 'org_default');
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

