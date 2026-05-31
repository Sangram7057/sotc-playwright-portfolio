export interface SotcUrls {
  baseUrl: string;
  accountUrl: string;
}

export interface SotcAccountTestUser {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  mobile: string;
  isSeededEmail: boolean;
}

export interface SotcAccountTestConfig {
  urls: SotcUrls;
  user: SotcAccountTestUser;
}

export interface SotcAccountTestConfigOptions {
  forceUniqueEmail?: boolean;
  requireSeededEmail?: boolean;
}

const EMAIL_PATTERN =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,})$/;
const SOTC_PASSWORD_PATTERN = /^(?=\S+$)(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,12}$/;
const TEN_DIGIT_MOBILE_PATTERN = /^\d{10}$/;

export function generateUniqueEmail(prefix = 'sotc.qa'): string {
  const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const safePrefix = prefix.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'sotcqa';

  return `${safePrefix}${timestamp}${randomSuffix}@example.com`;
}

export function generateIndianTestMobile(): string {
  const suffix = Math.floor(100000000 + Math.random() * 900000000).toString();

  return `9${suffix}`;
}

export function resolveSotcAccountTestConfig(
  env: NodeJS.ProcessEnv = process.env,
  options: SotcAccountTestConfigOptions = {},
): SotcAccountTestConfig {
  const baseUrl = normalizeUrl(env.SOTC_BASE_URL?.trim() || 'https://www.sotc.in');
  const accountUrl = env.SOTC_ACCOUNT_URL?.trim() || `${baseUrl}/MyAccount`;
  const password = requireEnv(env.SOTC_TEST_PASSWORD, 'SOTC_TEST_PASSWORD');
  const mobile = (env.SOTC_TEST_MOBILE?.trim() || generateIndianTestMobile()).replace(/\D/g, '');
  const seededEmail = env.SOTC_TEST_EMAIL?.trim();
  const email = resolveEmail(seededEmail, options);

  if (!SOTC_PASSWORD_PATTERN.test(password)) {
    throw new Error(
      'SOTC_TEST_PASSWORD must be 8-12 characters, include letters and numbers, allow only ! @ # $ % ^ & * as special characters, and contain no spaces.',
    );
  }

  if (!TEN_DIGIT_MOBILE_PATTERN.test(mobile)) {
    throw new Error('SOTC_TEST_MOBILE must be a 10-digit mobile number.');
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw new Error('SOTC_TEST_EMAIL must be a valid email address when provided.');
  }

  return {
    urls: {
      baseUrl,
      accountUrl,
    },
    user: {
      title: 'Mr',
      firstName: env.SOTC_TEST_FIRST_NAME?.trim() || 'Playwright',
      lastName: env.SOTC_TEST_LAST_NAME?.trim() || 'Tester',
      email,
      password,
      mobile,
      isSeededEmail: Boolean(seededEmail && email === seededEmail),
    },
  };
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function resolveEmail(
  seededEmail: string | undefined,
  options: SotcAccountTestConfigOptions,
): string {
  if (options.requireSeededEmail) {
    if (!seededEmail) {
      throw new Error(
        'Missing required environment variable: SOTC_TEST_EMAIL. Provide a seeded account email for the standalone login test.',
      );
    }

    return seededEmail;
  }

  if (options.forceUniqueEmail) {
    return generateUniqueEmail();
  }

  return seededEmail || generateUniqueEmail();
}

function requireEnv(value: string | undefined, name: string): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return trimmed;
}
