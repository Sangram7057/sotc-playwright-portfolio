import { generateIndianTestMobile, generateUniqueEmail } from './sotcAccountTestData';

export interface SotcHoneymoonFormUrls {
  baseUrl: string;
  honeymoonFormUrl: string;
}

export interface SotcHoneymoonFormConfig {
  urls: SotcHoneymoonFormUrls;
  formData: {
    firstName: string;
    lastName: string;
    mobile: string;
    email: string;
    product: string;
    description: string;
  };
  compatibilityFullName: string;
}

const EMAIL_PATTERN =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,})$/;
const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

export function resolveSotcHoneymoonFormConfig(
  env: NodeJS.ProcessEnv = process.env,
): SotcHoneymoonFormConfig {
  const baseUrl = normalizeUrl(env.SOTC_BASE_URL?.trim() || 'https://www.sotc.in');
  const honeymoonFormUrl =
    env.SOTC_HONEYMOON_FORM_URL?.trim() || `${baseUrl}/india-honeymoon/manali-honeymoon-packages`;
  const firstName = env.SOTC_TEST_FIRST_NAME?.trim() || 'Playwright';
  const lastName = env.SOTC_TEST_LAST_NAME?.trim() || 'Tester';
  const email = env.SOTC_TEST_EMAIL?.trim() || generateUniqueEmail('sotc.honeymoon');
  const mobile = (env.SOTC_TEST_MOBILE?.trim() || generateIndianTestMobile()).replace(/\D/g, '');

  if (!EMAIL_PATTERN.test(email)) {
    throw new Error('SOTC_TEST_EMAIL must be a valid email address when provided.');
  }

  if (!INDIAN_MOBILE_PATTERN.test(mobile)) {
    throw new Error('SOTC_TEST_MOBILE must be a valid 10-digit Indian mobile number starting with 6-9.');
  }

  return {
    urls: {
      baseUrl,
      honeymoonFormUrl,
    },
    formData: {
      firstName,
      lastName,
      mobile,
      email,
      product: 'Domestic Holidays',
      description: 'Playwright honeymoon enquiry validation.',
    },
    compatibilityFullName: [firstName, lastName].filter(Boolean).join(' ').trim(),
  };
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}
