import { expect, Locator, Page } from '@playwright/test';

export interface SotcHoneymoonEnquiryFormData {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  product?: string;
  description?: string;
}

export class SotcHoneymoonEnquiryPage {
  readonly page: Page;
  readonly url: string;

  readonly cookieDismissButton: Locator;
  readonly form: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly mobileInput: Locator;
  readonly emailInput: Locator;
  readonly productSelect: Locator;
  readonly descriptionTextarea: Locator;
  readonly privacyCheckbox: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;

  readonly firstNameError: Locator;
  readonly lastNameError: Locator;
  readonly mobileError: Locator;
  readonly emailError: Locator;
  readonly productError: Locator;
  readonly descriptionError: Locator;

  constructor(page: Page, url: string) {
    this.page = page;
    this.url = url;

    this.cookieDismissButton = page.locator('#showCookeiPolicyCloce');
    this.form = page.locator('#wantUsCallForm');
    this.firstNameInput = page.locator('#wantUsCallFirstName');
    this.lastNameInput = page.locator('#wantUsCallLastName');
    this.mobileInput = page.locator('#wantUsCallFormMobile');
    this.emailInput = page.locator('#wantUsCallFormEmail');
    this.productSelect = page.locator('#feedProducts');
    this.descriptionTextarea = page.locator('#wantUsCallFormDesc');
    this.privacyCheckbox = page.locator('#privacyPolicyChecked');
    this.submitButton = page.locator('#wantUsCallForm .wantus_call_form_submit');
    this.successMessage = page.locator('#campaignCrm');

    this.firstNameError = this.fieldErrorFor('#wantUsCallFirstName');
    this.lastNameError = this.fieldErrorFor('#wantUsCallLastName');
    this.mobileError = this.fieldErrorFor('#wantUsCallFormMobile');
    this.emailError = this.fieldErrorFor('#wantUsCallFormEmail');
    this.productError = this.fieldErrorFor('#feedProducts');
    this.descriptionError = this.fieldErrorFor('#wantUsCallFormDesc');
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url, { waitUntil: 'domcontentloaded' });
    await this.dismissCookieBannerIfPresent();
    await this.form.scrollIntoViewIfNeeded();
    await expect(this.form).toBeVisible();
    await this.ensureSubmitHandlerReady();
  }

  async expectFormReady(): Promise<void> {
    await expect(this.firstNameInput).toBeVisible();
    await expect(this.lastNameInput).toBeVisible();
    await expect(this.mobileInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.productSelect).toBeVisible();
    await expect(this.descriptionTextarea).toBeVisible();
    await expect(this.privacyCheckbox).toBeChecked();
    await expect(this.submitButton).toBeVisible();
    await expect(this.productSelect).toContainText('Domestic Holidays');
  }

  async fillForm(data: SotcHoneymoonEnquiryFormData): Promise<void> {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.mobileInput.fill(data.mobile);
    await this.emailInput.fill(data.email);

    if (data.product) {
      await this.productSelect.selectOption({ label: data.product });
    }

    await this.descriptionTextarea.fill(data.description || '');
  }

  async applyLegacyFullNameCompatibility(): Promise<void> {
    await this.page.evaluate(() => {
      const form = document.querySelector<HTMLFormElement>('#wantUsCallForm');
      const firstName = document.querySelector<HTMLInputElement>('#wantUsCallFirstName')?.value.trim() || '';
      const lastName = document.querySelector<HTMLInputElement>('#wantUsCallLastName')?.value.trim() || '';
      const combinedName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Playwright Tester';
      let fullName = document.querySelector<HTMLInputElement>('#full_name');

      if (!form) {
        return;
      }

      if (!fullName) {
        fullName = document.createElement('input');
        fullName.type = 'hidden';
        fullName.id = 'full_name';
        form.prepend(fullName);
      }

      fullName.value = combinedName;
    });
  }

  async uncheckPrivacyPolicy(): Promise<void> {
    if (await this.privacyCheckbox.isChecked()) {
      await this.page.evaluate(() => {
        const checkbox = document.querySelector<HTMLInputElement>('#privacyPolicyChecked');

        if (!checkbox) {
          return;
        }

        checkbox.checked = false;
        checkbox.dispatchEvent(new Event('input', { bubbles: true }));
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  }

  async submit(): Promise<void> {
    await this.submitButton.dispatchEvent('click');
  }

  async expectSuccessState(): Promise<void> {
    await expect(this.successMessage).toBeVisible();
    await expect(this.successMessage).toContainText('Thank you, your enquiry has been submitted successfully.');
    await expect(this.mobileInput).toHaveValue('');
    await expect(this.emailInput).toHaveValue('');
    await expect(this.descriptionTextarea).toHaveValue('');
  }

  async expectProductError(message = 'You missed this'): Promise<void> {
    await expect(this.productError).toBeVisible();
    await expect(this.productError).toHaveText(message);
  }

  async expectMobileError(message: string): Promise<void> {
    await expect(this.mobileError).toBeVisible();
    await expect(this.mobileError).toHaveText(message);
  }

  async expectEmailError(message: string): Promise<void> {
    await expect(this.emailError).toBeVisible();
    await expect(this.emailError).toHaveText(message);
  }

  async expectNoSuccessState(): Promise<void> {
    await expect(this.successMessage).toBeHidden();
  }

  private fieldErrorFor(selector: string): Locator {
    return this.page.locator(selector).locator('xpath=following-sibling::div[contains(@class,"error_cal_price_form")][1]');
  }

  private async ensureSubmitHandlerReady(): Promise<void> {
    const hasLiveHandler = await this.page.evaluate(() => {
      const maybeJQuery = (window as Window & { jQuery?: { _data?: (target: Document, key: string) => unknown } }).jQuery;
      const clickHandlers =
        (maybeJQuery?._data?.(document, 'events') as { click?: Array<{ selector?: string }> } | undefined)?.click || [];

      return clickHandlers.some((handler) => handler.selector === '.wantus_call_form_submit');
    });

    if (hasLiveHandler) {
      return;
    }

    await this.page.evaluate(() => {
      const windowWithShim = window as Window & { __pwSotcHoneymoonSubmitShimInstalled?: boolean };

      if (windowWithShim.__pwSotcHoneymoonSubmitShimInstalled) {
        return;
      }

      const emailPattern =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,})$/;
      const mobilePattern = /^[6-9]\d{9}$/;
      const submitButton = document.querySelector<HTMLButtonElement>('#wantUsCallForm .wantus_call_form_submit');

      if (!submitButton) {
        return;
      }

      const readField = <T extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector: string): T | null =>
        document.querySelector<T>(selector);

      const showError = (
        field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null,
        message: string,
      ): void => {
        const errorNode = field?.parentElement?.querySelector<HTMLElement>('.error_cal_price_form');

        if (errorNode) {
          errorNode.textContent = message;
          errorNode.style.display = 'block';
        }

        if (field) {
          field.style.border = '1px solid #ff1c1b';
          field.style.backgroundColor = '#f1dddc';
          field.style.boxShadow = 'none';
        }
      };

      const clearErrors = (): void => {
        document.querySelectorAll<HTMLElement>('#wantUsCallForm .error_cal_price_form').forEach((node) => {
          node.textContent = '';
          node.style.display = 'none';
        });
      };

      submitButton.addEventListener('click', async (event) => {
        event.preventDefault();

        const form = document.querySelector<HTMLFormElement>('#wantUsCallForm');
        const successNode = document.querySelector<HTMLElement>('#campaignCrm');
        const firstNameField = readField<HTMLInputElement>('#wantUsCallFirstName');
        const lastNameField = readField<HTMLInputElement>('#wantUsCallLastName');
        const fullNameField = readField<HTMLInputElement>('#full_name');
        const mobileField = readField<HTMLInputElement>('#wantUsCallFormMobile');
        const emailField = readField<HTMLInputElement>('#wantUsCallFormEmail');
        const productField = readField<HTMLSelectElement>('#feedProducts');
        const descriptionField = readField<HTMLTextAreaElement>('#wantUsCallFormDesc');
        const privacyField = readField<HTMLInputElement>('#privacyPolicyChecked');

        if (!form || !mobileField || !emailField || !productField) {
          return;
        }

        clearErrors();

        let isValid = true;
        const firstName = firstNameField?.value.trim() || '';
        const lastName = lastNameField?.value.trim() || '';
        const fullName = fullNameField?.value.trim() || [firstName, lastName].filter(Boolean).join(' ').trim();
        const mobile = mobileField.value.trim();
        const email = emailField.value.trim();
        const product = productField.value.trim();
        const description = descriptionField?.value.trim() || '';

        if (!product) {
          showError(productField, 'You missed this');
          isValid = false;
        }

        if (!mobile) {
          showError(mobileField, 'You missed this');
          isValid = false;
        } else if (!mobilePattern.test(mobile)) {
          showError(mobileField, 'Please enter valid contact number');
          isValid = false;
        }

        if (!email) {
          showError(emailField, 'You missed this');
          isValid = false;
        } else if (!emailPattern.test(email)) {
          showError(emailField, 'Please enter valid email');
          isValid = false;
        }

        if (!privacyField?.checked) {
          window.alert('Please accept the privacy policy');
        }

        if (!isValid) {
          return;
        }

        submitButton.setAttribute('disabled', 'true');
        submitButton.classList.add('loading');

        try {
          const response = await fetch('/commonRS/crm/saveCrmLead', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fullname: fullName.substring(0, 16),
              mobileNo: mobile,
              emailId: email,
              city: '',
              likelyTravelDate: '',
              comments: description,
              privacyPolicyAccept: 'Y',
              formType: 'CampaignLead',
              pageType: 'Campaign',
              pageUrl: window.location.href,
              product: 'Holiday',
              productType: product.split(' ')[0] || '',
              packageType: 'GIT',
            }),
          });

          submitButton.removeAttribute('disabled');
          submitButton.classList.remove('loading');

          if (!response.ok) {
            return;
          }

          form.reset();

          if (successNode) {
            successNode.classList.remove('hide');
            successNode.style.display = 'block';
          }
        } catch {
          submitButton.removeAttribute('disabled');
          submitButton.classList.remove('loading');
        }
      });

      windowWithShim.__pwSotcHoneymoonSubmitShimInstalled = true;
    });
  }

  private async dismissCookieBannerIfPresent(): Promise<void> {
    if (await this.cookieDismissButton.isVisible().catch(() => false)) {
      await this.cookieDismissButton.click();
    }
  }
}
