import { expect, test } from '@playwright/test';

/**
 * The preview harness (T-037): fill the app with obviously fictional data,
 * look at it, and be able to remove it again completely.
 *
 * The wipe half is the important half. Demo moods left stranded in a real
 * timeline would be worse than having no demo data at all, so this asserts
 * the entries are actually gone from the screen rather than trusting the
 * button to have worked.
 */

const FIRST_LOAD_MS = 45_000;

test.describe.configure({ mode: 'serial' });

test('seeding fills the app, and wiping empties it again', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await expect(page.getByText(/Welcome|Hi,/)).toBeVisible({ timeout: FIRST_LOAD_MS });

  // The banner is not optional. This build is unencrypted by design, and it
  // has to keep saying so however much demo data is in it.
  await expect(page.getByText(/Web preview — not secure/i)).toBeVisible();

  const nameField = page.getByPlaceholder('What should we call you?');
  if (await nameField.count()) {
    await nameField.fill('E2E');
    await page.getByText('Begin', { exact: true }).click();
  }
  await expect(page.getByText(/Hi, /)).toBeVisible();

  // --- seed -------------------------------------------------------------
  await page.getByText('Settings', { exact: true }).first().click();
  await expect(page.getByText('Demo data', { exact: true })).toBeVisible();
  await page.getByText('Fill with demo data', { exact: true }).click();
  await expect(page.getByText(/Filled with demo data/i)).toBeVisible();

  // --- it is visible, and unmistakable ----------------------------------
  await page.getByText('Timeline', { exact: true }).first().click();
  await expect(page.getByText(/DEMO/).first()).toBeVisible();

  // Still saying it is not secure, with content in it.
  await page.getByText('Settings', { exact: true }).first().click();
  await expect(page.getByText(/Web preview — not secure/i)).toBeVisible();

  // --- wipe -------------------------------------------------------------
  page.once('dialog', (d) => d.accept());
  await page.getByText('Wipe everything', { exact: true }).click();

  // Wiping removes the profile too, so the app returns to onboarding. That is
  // the proof it emptied rather than merely hid: there is nothing left to
  // render a name from.
  await expect(page.getByPlaceholder('What should we call you?')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/DEMO/)).toHaveCount(0);

  expect(errors).toEqual([]);
});
