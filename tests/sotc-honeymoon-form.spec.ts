import { expect, Page, test } from '@playwright/test';

import { SotcHoneymoonEnquiryPage } from '../pages/SotcHoneymoonEnquiryPage';
import { resolveSotcHoneymoonFormConfig } from '../utils/sotcHoneymoonFormData';

test.use({
  screenshot: 'on',
  trace: 'retain-on-failure',
});

interface LeadCaptureMock {
  getRequestBody(): Record<string, unknown> | null;
  getRequestCount(): number;
}

test.describe('SOTC honeymoon enquiry form', () => {
  test('should show the Manali honeymoon enquiry form', async ({ page }, testInfo) => {
    const config = resolveSotcHoneymoonFormConfig(process.env);
    const enquiryPage = new SotcHoneymoonEnquiryPage(page, config.urls.honeymoonFormUrl);

    await test.step('Open the live honeymoon package page and verify the enquiry form surface', async () => {
      await enquiryPage.goto();
      await enquiryPage.expectFormReady();
      await expect(enquiryPage.successMessage).toBeHidden();
      await page.screenshot({
        path: testInfo.outputPath('honeymoon-form-ready.png'),
        fullPage: true,
      });
    });
  });

  test('should submit the honeymoon enquiry form with valid details', async ({ page }, testInfo) => {
    const config = resolveSotcHoneymoonFormConfig(process.env);
    const enquiryPage = new SotcHoneymoonEnquiryPage(page, config.urls.honeymoonFormUrl);
    const leadCapture = await mockLeadCapture(page);

    await test.step('Open the live honeymoon form and enter valid enquiry details', async () => {
      await enquiryPage.goto();
      await enquiryPage.expectFormReady();
      await enquiryPage.fillForm(config.formData);
      await enquiryPage.applyLegacyFullNameCompatibility();
    });

    await test.step('Submit the valid enquiry and verify the success state', async () => {
      await enquiryPage.submit();

      await expect
        .poll(() => leadCapture.getRequestCount(), {
          message: 'Expected the honeymoon enquiry form to submit one CRM lead request.',
          timeout: 15_000,
        })
        .toBe(1);

      expect(leadCapture.getRequestBody()).toMatchObject({
        emailId: config.formData.email,
        mobileNo: config.formData.mobile,
        comments: config.formData.description,
        formType: 'CampaignLead',
        pageType: 'Campaign',
      });

      await enquiryPage.expectSuccessState();
      await page.screenshot({
        path: testInfo.outputPath('honeymoon-form-success.png'),
        fullPage: true,
      });
    });
  });

  test('should show required-field errors when key enquiry inputs are missing', async ({ page }, testInfo) => {
    const config = resolveSotcHoneymoonFormConfig(process.env);
    const enquiryPage = new SotcHoneymoonEnquiryPage(page, config.urls.honeymoonFormUrl);
    const leadCapture = await mockLeadCapture(page);

    await test.step('Leave the required contact fields blank and submit the form', async () => {
      await enquiryPage.goto();
      await enquiryPage.fillForm({
        ...config.formData,
        mobile: '',
        email: '',
        product: undefined,
        description: '',
      });
      await enquiryPage.applyLegacyFullNameCompatibility();
      await enquiryPage.submit();
    });

    await test.step('Verify the client-side required-field validation messages', async () => {
      await enquiryPage.expectProductError('You missed this');
      await enquiryPage.expectMobileError('You missed this');
      await enquiryPage.expectEmailError('You missed this');
      await enquiryPage.expectNoSuccessState();
      await page.waitForTimeout(500);
      expect(leadCapture.getRequestCount()).toBe(0);
      await page.screenshot({
        path: testInfo.outputPath('honeymoon-form-missing-required-fields.png'),
        fullPage: true,
      });
    });
  });

  test('should reject an invalid mobile number on the honeymoon enquiry form', async ({ page }, testInfo) => {
    const config = resolveSotcHoneymoonFormConfig(process.env);
    const enquiryPage = new SotcHoneymoonEnquiryPage(page, config.urls.honeymoonFormUrl);
    const leadCapture = await mockLeadCapture(page);

    await test.step('Enter an invalid mobile number with otherwise valid enquiry details', async () => {
      await enquiryPage.goto();
      await enquiryPage.fillForm({
        ...config.formData,
        mobile: '5123456789',
      });
      await enquiryPage.applyLegacyFullNameCompatibility();
      await enquiryPage.submit();
    });

    await test.step('Verify the invalid-mobile validation message', async () => {
      await enquiryPage.expectMobileError('Please enter valid contact number');
      await enquiryPage.expectNoSuccessState();
      await page.waitForTimeout(500);
      expect(leadCapture.getRequestCount()).toBe(0);
      await page.screenshot({
        path: testInfo.outputPath('honeymoon-form-invalid-mobile.png'),
        fullPage: true,
      });
    });
  });

  test('should reject an invalid email address on the honeymoon enquiry form', async ({ page }, testInfo) => {
    const config = resolveSotcHoneymoonFormConfig(process.env);
    const enquiryPage = new SotcHoneymoonEnquiryPage(page, config.urls.honeymoonFormUrl);
    const leadCapture = await mockLeadCapture(page);

    await test.step('Enter an invalid email address with otherwise valid enquiry details', async () => {
      await enquiryPage.goto();
      await enquiryPage.fillForm({
        ...config.formData,
        email: 'playwright.invalid',
      });
      await enquiryPage.applyLegacyFullNameCompatibility();
      await enquiryPage.submit();
    });

    await test.step('Verify the invalid-email validation message', async () => {
      await enquiryPage.expectEmailError('Please enter valid email');
      await enquiryPage.expectNoSuccessState();
      await page.waitForTimeout(500);
      expect(leadCapture.getRequestCount()).toBe(0);
      await page.screenshot({
        path: testInfo.outputPath('honeymoon-form-invalid-email.png'),
        fullPage: true,
      });
    });
  });

  test('should raise the privacy-policy alert when consent is cleared before submit', async ({ page }, testInfo) => {
    const config = resolveSotcHoneymoonFormConfig(process.env);
    const enquiryPage = new SotcHoneymoonEnquiryPage(page, config.urls.honeymoonFormUrl);
    const leadCapture = await mockLeadCapture(page);

    await test.step('Clear privacy consent and submit a valid-looking enquiry', async () => {
      await enquiryPage.goto();
      await enquiryPage.fillForm(config.formData);
      await enquiryPage.applyLegacyFullNameCompatibility();
      await enquiryPage.uncheckPrivacyPolicy();

      const dialogPromise = page.waitForEvent('dialog');
      const submitPromise = enquiryPage.submit();
      const dialog = await dialogPromise;

      expect(dialog.message()).toBe('Please accept the privacy policy');
      await dialog.accept();
      await submitPromise;
    });

    await test.step('Document the live privacy-alert behavior', async () => {
      await expect
        .poll(() => leadCapture.getRequestCount(), {
          message: 'Expected the live page to continue submission after the privacy alert.',
          timeout: 15_000,
        })
        .toBe(1);

      await enquiryPage.expectSuccessState();
      await page.screenshot({
        path: testInfo.outputPath('honeymoon-form-privacy-alert.png'),
        fullPage: true,
      });
    });
  });
});

async function mockLeadCapture(page: Page): Promise<LeadCaptureMock> {
  let requestCount = 0;
  let requestBody: Record<string, unknown> | null = null;

  await page.route('**/commonRS/crm/saveCrmLead', async (route) => {
    requestCount += 1;
    requestBody = (route.request().postDataJSON() as Record<string, unknown>) || null;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'PW-LEAD-0001' }),
    });
  });

  return {
    getRequestBody: () => requestBody,
    getRequestCount: () => requestCount,
  };
}
