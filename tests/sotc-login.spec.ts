import { expect, test } from '@playwright/test';

import { SotcAccountPage } from '../pages/SotcAccountPage';
import { resolveSotcAccountTestConfig } from '../utils/sotcAccountTestData';

test.use({
  screenshot: 'on',
  trace: 'retain-on-failure',
});

test('should allow an existing user to start the live OTP login journey', async ({ page }, testInfo) => {
  const hasSeededEmail = Boolean(process.env.SOTC_TEST_EMAIL?.trim());
  const config = resolveSotcAccountTestConfig(process.env, {
    forceUniqueEmail: !hasSeededEmail,
    requireSeededEmail: hasSeededEmail,
  });
  const accountPage = new SotcAccountPage(page, config.urls.accountUrl);

  if (!config.user.isSeededEmail) {
    await test.step('Create an existing customer account to use for login validation', async () => {
      await accountPage.goto();
      await accountPage.logoutIfAuthenticated();
      await accountPage.openSignUpForm();
      await accountPage.expectSignUpFormReady();
      await accountPage.fillSignUpForm(config.user);

      const registrationOutcome = await accountPage.submitRegistration();

      if (registrationOutcome === 'duplicate-email') {
        throw new Error(
          `SOTC reported duplicate-email behavior for generated address ${config.user.email}.`,
        );
      }

      await accountPage.expectAuthenticated();
      await page.screenshot({
        path: testInfo.outputPath('login-prep-account-created.png'),
        fullPage: true,
      });
      await accountPage.logoutIfAuthenticated();
    });
  }

  await test.step('Open the SOTC account page and verify the login surface', async () => {
    await accountPage.goto();
    await accountPage.logoutIfAuthenticated();
    await accountPage.openAuthModal();
    await expect(accountPage.loginEmailInput).toBeVisible();
    await expect(accountPage.loginButton).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath('login-surface-ready.png'),
      fullPage: true,
    });
  });

  await test.step('Start OTP login for the existing customer account', async () => {
    await accountPage.startOtpLogin(config.user.email);
    await expect(accountPage.otpModeContainer).toBeVisible();
    await expect(accountPage.passwordModeContainer).toBeHidden();
    await expect(accountPage.otpInput).toBeVisible();
    await expect(accountPage.resendOtpLink).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath('login-otp-requested.png'),
      fullPage: true,
    });
  });
});
