import { expect, Locator, Page } from '@playwright/test';

export interface SotcRegistrationData {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  mobile: string;
}

export interface SotcLoginCredentials {
  email: string;
  password: string;
}

export type RegistrationOutcome = 'created' | 'duplicate-email';
export type LoginMode = 'password' | 'otp' | 'invalid' | 'unknown';

export class PasswordLoginUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PasswordLoginUnavailableError';
  }
}

export class SotcAccountPage {
  readonly page: Page;
  readonly accountUrl: string;

  readonly loginRegisterDropdown: Locator;
  readonly loginRegisterToggle: Locator;
  readonly loginDropdown: Locator;
  readonly openLoginButton: Locator;
  readonly authModal: Locator;
  readonly closeAuthModalButton: Locator;
  readonly cookieDismissButton: Locator;
  readonly filterLoader: Locator;

  readonly loginForm: Locator;
  readonly showRegisterLink: Locator;
  readonly loginEmailInput: Locator;
  readonly passwordMode: Locator;
  readonly otpMode: Locator;
  readonly passwordModeContainer: Locator;
  readonly otpModeContainer: Locator;
  readonly passwordInput: Locator;
  readonly otpInput: Locator;
  readonly loginButton: Locator;
  readonly loginErrorMessage: Locator;
  readonly otpSuccessMessage: Locator;
  readonly otpLimitMessage: Locator;
  readonly resendOtpLink: Locator;

  readonly registrationForm: Locator;
  readonly titleSelect: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly registerEmailInput: Locator;
  readonly registerPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly mobileInput: Locator;
  readonly consentCheckbox: Locator;
  readonly registerButton: Locator;
  readonly duplicateEmailMessage: Locator;
  readonly passwordRules: Locator;

  readonly viewAccountButton: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page, accountUrl: string) {
    this.page = page;
    this.accountUrl = accountUrl;

    this.loginRegisterDropdown = page.locator('#loginRegisterDropdown');
    this.loginRegisterToggle = page.locator('#LoginLogoutToggel');
    this.loginDropdown = page.locator('.dropdown-menu.login_dropdown');
    this.openLoginButton = page.locator('#mainLogIn');
    this.authModal = page.locator('#loginRegisterPopup');
    this.closeAuthModalButton = page.locator('#loginRegisterPopup .login_reg_popup_close');
    this.cookieDismissButton = page.locator('#showCookeiPolicyCloce');
    this.filterLoader = page.locator('#filterLoader');

    this.loginForm = page.locator('#login-form');
    this.showRegisterLink = page.locator('#login-form .show_register_form').last();
    this.loginEmailInput = page.locator('#loginId');
    this.passwordMode = page.locator('#tc_login_pass');
    this.otpMode = page.locator('#sendOTP');
    this.passwordModeContainer = page.locator('.tc_login_otp_details_pass');
    this.otpModeContainer = page.locator('.tc_login_otp_details_otp');
    this.passwordInput = page.locator('#existloginPass');
    this.otpInput = page.locator('#loginOTP');
    this.loginButton = page.locator('#loginButton');
    this.loginErrorMessage = page.locator('#loginErrorMessage');
    this.otpSuccessMessage = page.locator('.SucessMess');
    this.otpLimitMessage = page.locator('.otplimit');
    this.resendOtpLink = page.locator('#ResendOTP');

    this.registrationForm = page.locator('#registerFormReset');
    this.titleSelect = page.locator('#regTitle');
    this.firstNameInput = page.locator('#registerFName');
    this.lastNameInput = page.locator('#registerLName');
    this.registerEmailInput = page.locator('#registerEmailId');
    this.registerPasswordInput = page.locator('#registerPwd');
    this.confirmPasswordInput = page.locator('#registerConfirmPwd');
    this.mobileInput = page.locator('#registerMobileNo');
    this.consentCheckbox = page.locator('#tandc');
    this.registerButton = page.locator('#registerButton');
    this.duplicateEmailMessage = page.locator('.tcLogin:not(.hide)');
    this.passwordRules = page.locator('#passwordErrorBox .error-message');

    this.viewAccountButton = page.locator('#viewAccount');
    this.logoutLink = page.locator('a[href="javascript:logout();"]');
  }

  async goto(): Promise<void> {
    await this.page.goto(this.accountUrl, { waitUntil: 'domcontentloaded' });
    await this.dismissCookieBannerIfPresent();
    await this.dismissBlockingLoaderIfPresent();
    await expect(this.loginRegisterDropdown).toBeVisible();
  }

  async openAuthModal(): Promise<void> {
    await this.dismissCookieBannerIfPresent();
    await this.dismissBlockingLoaderIfPresent();

    if (await this.authModal.isVisible()) {
      return;
    }

    await this.loginRegisterDropdown.click();
    await expect(this.loginDropdown).toBeVisible();
    await expect(this.openLoginButton).toBeVisible();
    await this.openLoginButton.click();
    await expect(this.authModal).toBeVisible();
    await expect(this.loginForm).toBeVisible();
  }

  async openSignUpForm(): Promise<void> {
    await this.openAuthModal();

    if (await this.registrationForm.isVisible()) {
      return;
    }

    await this.showRegisterLink.click();
    await expect(this.registrationForm).toBeVisible();
  }

  async expectSignUpFormReady(): Promise<void> {
    await expect(this.registrationForm).toBeVisible();
    await expect(this.titleSelect).toBeVisible();
    await expect(this.firstNameInput).toBeVisible();
    await expect(this.lastNameInput).toBeVisible();
    await expect(this.registerEmailInput).toBeVisible();
    await expect(this.registerPasswordInput).toBeVisible();
    await expect(this.confirmPasswordInput).toBeVisible();
    await expect(this.mobileInput).toBeVisible();
    await expect(this.consentCheckbox).toBeChecked();
    await expect(this.registerButton).toBeVisible();
    await expect(this.passwordRules).toContainText('Contains between 8-12 alphanumeric characters.');
    await expect(this.passwordRules).toContainText('Only !, @, #,$,%,^,&,* to be used');
    await expect(this.passwordRules).toContainText('Does not contain White spaces');
  }

  async fillSignUpForm(data: SotcRegistrationData): Promise<void> {
    await this.titleSelect.selectOption({ value: data.title });
    await this.fillUnlocked(this.firstNameInput, data.firstName);
    await this.fillUnlocked(this.lastNameInput, data.lastName);
    await this.fillUnlocked(this.registerEmailInput, data.email);
    await this.registerEmailInput.press('Tab');
    await this.fillUnlocked(this.registerPasswordInput, data.password);
    await this.fillUnlocked(this.confirmPasswordInput, data.password);
    await this.fillUnlocked(this.mobileInput, data.mobile);

    if (!(await this.consentCheckbox.isChecked())) {
      await this.consentCheckbox.check();
    }
  }

  async submitRegistration(): Promise<RegistrationOutcome> {
    if (await this.duplicateEmailMessage.isVisible()) {
      return 'duplicate-email';
    }

    await this.registerButton.click();

    await expect
      .poll(async () => this.readRegistrationOutcome(), {
        message:
          'Expected SOTC registration to either authenticate the new customer or surface the duplicate-email banner.',
        timeout: 20_000,
      })
      .not.toBe('pending');

    const outcome = await this.readRegistrationOutcome();

    if (outcome === 'pending') {
      throw new Error('Registration outcome could not be determined.');
    }

    return outcome;
  }

  async loginWithPassword(credentials: SotcLoginCredentials): Promise<void> {
    const mode = await this.prepareLoginMode(credentials.email);

    if (mode !== 'password') {
      await this.assertPasswordLoginAvailable(credentials.email);
    }

    await this.passwordMode.check({ force: true });
    await expect(this.passwordInput).toBeVisible({ timeout: 15_000 });
    await this.fillUnlocked(this.passwordInput, credentials.password);
    await expect(this.loginButton).toBeEnabled();
    await this.loginButton.click();

    await expect
      .poll(async () => this.readLoginOutcome(), {
        message: 'Expected SOTC password login to either authenticate the user or show a login error.',
        timeout: 20_000,
      })
      .not.toBe('pending');

    const outcome = await this.readLoginOutcome();

    if (outcome === 'error') {
      const message = (await this.loginErrorMessage.textContent())?.trim() || 'Unknown login error.';
      throw new Error(`SOTC password login failed: ${message}`);
    }
  }

  async prepareLoginMode(identifier: string): Promise<LoginMode> {
    await this.ensureLoginFormVisible();
    await this.fillUnlocked(this.loginEmailInput, identifier);
    await this.loginEmailInput.press('Tab');
    await this.page.waitForTimeout(3_000);

    return this.detectLoginMode();
  }

  async startOtpLogin(identifier: string): Promise<void> {
    const mode = await this.prepareLoginMode(identifier);

    if (mode === 'invalid') {
      throw new Error(`SOTC did not recognize ${identifier} as a valid existing login identifier.`);
    }

    if (mode !== 'otp') {
      throw new Error(`SOTC did not expose OTP login for ${identifier}. Detected mode: ${mode}.`);
    }

    await this.otpMode.click({ force: true });

    await expect
      .poll(
        async () => {
          if (await this.otpLimitMessage.isVisible().catch(() => false)) {
            return 'otp-limit';
          }

          if (await this.otpSuccessMessage.isVisible().catch(() => false)) {
            return 'otp-sent';
          }

          return 'pending';
        },
        {
          message: 'Expected SOTC to confirm the OTP request or report an OTP limit state.',
          timeout: 20_000,
        },
      )
      .not.toBe('pending');

    await expect(this.otpInput).toBeVisible({ timeout: 15_000 });
    await expect(this.resendOtpLink).toBeVisible({ timeout: 15_000 });
  }

  async expectAuthenticated(): Promise<void> {
    await expect
      .poll(async () => this.hasStoredSession(), {
        message: 'Expected an authenticated SOTC customer session.',
        timeout: 20_000,
      })
      .toBe(true);

    await expect(this.loginRegisterToggle).not.toHaveText(/^Login$/i, { timeout: 10_000 });
    await this.openUserMenu();
    await expect(this.viewAccountButton.or(this.logoutLink).first()).toBeVisible({ timeout: 10_000 });
  }

  async logoutIfAuthenticated(): Promise<void> {
    if (!(await this.hasStoredSession())) {
      return;
    }

    await this.dismissBlockingLoaderIfPresent();
    await this.openUserMenu();
    await expect(this.logoutLink).toBeVisible();
    await this.logoutLink.click();

    await expect
      .poll(async () => this.hasStoredSession(), {
        message: 'Expected SOTC logout to clear the stored customer session.',
        timeout: 20_000,
      })
      .toBe(false);

    await this.goto();
  }

  private async ensureLoginFormVisible(): Promise<void> {
    if (await this.loginForm.isVisible()) {
      return;
    }

    if (await this.authModal.isVisible()) {
      await this.closeAuthModalButton.click();
      await expect(this.authModal).toBeHidden();
    }

    await this.openAuthModal();
  }

  private async openUserMenu(): Promise<void> {
    await this.dismissBlockingLoaderIfPresent();

    if (await this.viewAccountButton.isVisible()) {
      return;
    }

    await this.loginRegisterDropdown.click();
    await expect(this.loginDropdown).toBeVisible();
  }

  private async readRegistrationOutcome(): Promise<RegistrationOutcome | 'pending'> {
    if (await this.duplicateEmailMessage.isVisible()) {
      return 'duplicate-email';
    }

    if (await this.hasStoredSession()) {
      return 'created';
    }

    return 'pending';
  }

  private async readLoginOutcome(): Promise<'success' | 'error' | 'pending'> {
    if (await this.hasStoredSession()) {
      return 'success';
    }

    const loginErrorText = (await this.loginErrorMessage.textContent().catch(() => null))?.trim();

    if (loginErrorText) {
      return 'error';
    }

    return 'pending';
  }

  private async hasStoredSession(): Promise<boolean> {
    return this.page
      .evaluate(() => {
        return Boolean(localStorage.getItem('userDetailandFamilyTree'));
      })
      .catch(() => false);
  }

  private async dismissCookieBannerIfPresent(): Promise<void> {
    if (await this.cookieDismissButton.isVisible()) {
      await this.cookieDismissButton.click();
    }
  }

  private async dismissBlockingLoaderIfPresent(): Promise<void> {
    if (!(await this.filterLoader.isVisible().catch(() => false))) {
      return;
    }

    await this.page.waitForTimeout(2_000);

    if (!(await this.filterLoader.isVisible().catch(() => false))) {
      return;
    }

    // SOTC sometimes leaves this full-page loader stuck after client-side errors on unauthenticated loads.
    await this.page.evaluate(() => {
      const loader = document.querySelector<HTMLElement>('#filterLoader');

      if (!loader) {
        return;
      }

      loader.style.display = 'none';
      loader.style.visibility = 'hidden';
      loader.style.pointerEvents = 'none';
      loader.setAttribute('data-playwright-hidden', 'true');
    });

    await expect(this.filterLoader).toBeHidden();
  }

  private async fillUnlocked(locator: Locator, value: string): Promise<void> {
    await locator.click();
    await locator.fill(value);
  }

  private async detectLoginMode(): Promise<LoginMode> {
    const loginErrorText = (await this.loginErrorMessage.textContent().catch(() => null))?.trim().toLowerCase();

    if (loginErrorText?.includes('invalid username')) {
      return 'invalid';
    }

    if (
      (await this.passwordModeContainer.isVisible().catch(() => false)) ||
      (await this.passwordInput.isVisible().catch(() => false))
    ) {
      return 'password';
    }

    if (
      (await this.otpModeContainer.isVisible().catch(() => false)) ||
      (await this.otpInput.isVisible().catch(() => false))
    ) {
      return 'otp';
    }

    return 'unknown';
  }

  private async assertPasswordLoginAvailable(email: string): Promise<void> {
    const mode = await this.detectLoginMode();

    if (mode === 'password') {
      return;
    }

    if (mode === 'otp') {
      throw new PasswordLoginUnavailableError(
        `SOTC currently exposes OTP-only login for ${email}; the password path is not available for this customer account in the live UI.`,
      );
    }

    if (mode === 'invalid') {
      throw new PasswordLoginUnavailableError(`SOTC did not recognize ${email} as a valid login identifier.`);
    }

    throw new PasswordLoginUnavailableError(
      `SOTC did not reveal a usable password-login path for ${email} after email verification.`,
    );
  }
}
