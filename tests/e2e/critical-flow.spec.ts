import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * The one flow that must never break: onboard, create a habit, tick it,
 * export an encrypted backup, and restore it.
 *
 * This runs against the web preview, which is not the shipping platform, but
 * it exercises the real domain logic, the real schema and the real backup
 * encryption — so a break here is almost always a real break on Android too.
 *
 * Metro's first bundle is slow; the generous timeouts in playwright.config.ts
 * exist for that, not to paper over flakiness.
 */

const FIRST_LOAD_MS = 45_000;

test.describe.configure({ mode: 'serial' });

test('onboarding, habits, and an encrypted backup round trip', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  // Wait for the app itself, not just the document.
  await expect(page.getByText(/Welcome|Hi,/)).toBeVisible({ timeout: FIRST_LOAD_MS });

  // The preview must always say it is not a safe place for real data.
  await expect(page.getByText(/Web preview — not secure/i)).toBeVisible();

  // --- onboarding -------------------------------------------------------
  const nameField = page.getByPlaceholder('What should we call you?');
  if (await nameField.count()) {
    await nameField.fill('E2E');
    await page.getByText('Begin', { exact: true }).click();
  }
  await expect(page.getByText(/Hi, /)).toBeVisible();

  // --- create a habit ---------------------------------------------------
  await page.getByText('Habits', { exact: true }).first().click();
  await page.getByText('Add a habit', { exact: true }).click();
  await page.getByPlaceholder('What would you like to return to?').fill('Ten minutes outside');
  await page.getByText('Keep it', { exact: true }).click();
  await expect(page.getByText('Ten minutes outside')).toBeVisible();

  // --- tick it, and see the gentle streak begin -------------------------
  await page.getByLabel('Ten minutes outside').click();
  await expect(page.getByText('1d')).toBeVisible();

  // --- export -----------------------------------------------------------
  await page.getByText('Settings', { exact: true }).first().click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByText('Export an encrypted backup', { exact: true }).click();
  const download = await downloadPromise;

  const backupPath = path.join(testInfo.outputDir, 'backup.bin');
  fs.mkdirSync(testInfo.outputDir, { recursive: true });
  await download.saveAs(backupPath);
  expect(fs.statSync(backupPath).size).toBeGreaterThan(0);
  expect(download.suggestedFilename()).toMatch(/^reorglife-\d{4}-\d{2}-\d{2}\.backup$/);

  // The recovery key is shown exactly once, in a read-only field.
  const recoveryKey = await page.evaluate(() => {
    const fields = Array.from(document.querySelectorAll('textarea, input')) as HTMLInputElement[];
    return fields.find((f) => f.readOnly && f.value && f.value.length > 30)?.value ?? null;
  });
  expect(recoveryKey, 'a recovery key should be shown after export').toBeTruthy();

  // The file on disk must not contain anything readable.
  const raw = fs.readFileSync(backupPath, 'utf8');
  expect(Buffer.from(raw, 'base64').toString('utf8')).not.toContain('Ten minutes outside');

  await page.getByText('I have saved it', { exact: true }).click();

  // --- change something, so a restore is observable ---------------------
  await page.getByText('Habits', { exact: true }).first().click();
  await page.getByText('Add a habit', { exact: true }).click();
  await page.getByPlaceholder('What would you like to return to?').fill('Should not survive');
  await page.getByText('Keep it', { exact: true }).click();
  await expect(page.getByText('Should not survive')).toBeVisible();

  // --- a wrong key must be refused, and must change nothing -------------
  await page.getByText('Settings', { exact: true }).first().click();
  page.once('dialog', (d) => d.accept());
  await page
    .getByPlaceholder('Recovery key of the backup you want to restore')
    .fill('bm90LWEtcmVhbC1rZXktYXQtYWxsLW5vcGUtbm9wZS1ubw==');
  const wrongChooser = page.waitForEvent('filechooser');
  await page.getByText('Restore from a backup', { exact: true }).click();
  (await wrongChooser).setFiles(backupPath);
  await expect(page.getByText(/Could not open this backup|does not match|right shape/i)).toBeVisible();

  await page.getByText('Habits', { exact: true }).first().click();
  await expect(page.getByText('Should not survive')).toBeVisible();

  // --- the right key restores -------------------------------------------
  await page.getByText('Settings', { exact: true }).first().click();
  page.once('dialog', (d) => d.accept());
  const keyField = page.getByPlaceholder('Recovery key of the backup you want to restore');
  await keyField.fill('');
  await keyField.fill(recoveryKey!);
  const rightChooser = page.waitForEvent('filechooser');
  await page.getByText('Restore from a backup', { exact: true }).click();
  (await rightChooser).setFiles(backupPath);
  await expect(page.getByText(/Restored .*habit/i)).toBeVisible();

  await page.getByText('Habits', { exact: true }).first().click();
  await expect(page.getByText('Ten minutes outside')).toBeVisible();
  await expect(page.getByText('Should not survive')).toHaveCount(0);

  expect(errors, `unexpected page errors:\n${errors.join('\n')}`).toEqual([]);
});
