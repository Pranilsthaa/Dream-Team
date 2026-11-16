import type { FieldErrors, Resolver } from 'react-hook-form';

export type AuthFormValues = {
  username: string;
  email: string;
  password: string;
};

export const authFormDefaults: AuthFormValues = { username: '', email: '', password: '' };

export function authFormResolver(signup: boolean): Resolver<AuthFormValues> {
  return values => {
    const errors: FieldErrors<AuthFormValues> = {};
    if (signup && !/^[a-z0-9_]{3,30}$/.test(values.username.trim().toLowerCase())) {
      errors.username = { type: 'validate', message: 'Use 3–30 letters, numbers, or underscores.' };
    }
    const email = values.email.trim();
    if (!email) {
      errors.email = { type: 'required', message: 'Enter your email address.' };
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      errors.email = { type: 'validate', message: 'Enter a valid email address.' };
    }
    if (values.password.length < (signup ? 12 : 1) || values.password.length > 128) {
      errors.password = { type: 'validate', message: signup
        ? 'Use a passphrase of 12–128 characters.'
        : 'Enter your password (up to 128 characters).' };
    }
    return Object.keys(errors).length ? { values: {}, errors } : { values, errors: {} };
  };
}
