import { expect, test } from '@playwright/test';

import { SotcAccountPage } from '../pages/SotcAccountPage';
import { resolveSotcAccountTestConfig } from '../utils/sotcAccountTestData';

test.use({
  screenshot: 'on',
  trace: 'retain-on-failure',
});

test('should allow a new user to sign up', async ({ page }, testInfo) => {
  const config = resolveSotcAccountTestConfig(process.env, {
    forceUniqueEmail: true,
  });
  const accountPage = new SotcAccountPage(page, config.urls.accountUrl);

  await test.step('Open the SOTC account page and verify the signup surface', async () => {
    await accountPage.goto();
    await accountPage.logoutIfAuthenticated();
    await accountPage.openSignUpForm();
    await accountPage.expectSignUpFormReady();
    await expect(accountPage.registerButton).toBeEnabled();
    await page.screenshot({
      path: testInfo.outputPath('signup-form-ready.png'),
      fullPage: true,
    });
  });

  await test.step('Create a new customer account', async () => {
    await accountPage.fillSignUpForm(config.user);
    const registrationOutcome = await accountPage.submitRegistration();

    if (registrationOutcome === 'duplicate-email') {
      throw new Error(
        `SOTC reported duplicate-email behavior for generated address ${config.user.email}.`,
      );
    }

    await accountPage.expectAuthenticated();
    await page.screenshot({
      path: testInfo.outputPath('signup-authenticated.png'),
      fullPage: true,
    });
  });

  await test.step('Return the new account to a logged-out state', async () => {
    await accountPage.logoutIfAuthenticated();
  });
});
