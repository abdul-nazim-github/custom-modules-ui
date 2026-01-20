export const validateName = (name: string): string | null => {
  if (!name) return 'Name is required';
  // No numbers, no special characters except space
  const nameRegex = /^[a-zA-Z\s]+$/;
  if (!nameRegex.test(name)) return 'Name can only contain letters and spaces';
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
};

export const SPECIAL_CHARS = "!@#$%^&*()_+";

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = new RegExp(`[${SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password);

  if (!hasUppercase) return 'Password must contain at least one uppercase letter';
  if (!hasLowercase) return 'Password must contain at least one lowercase letter';
  if (!hasNumber) return 'Password must contain at least one number';
  if (!hasSpecial) return 'Password must contain at least one special character';

  return null;
};

export const generatePassword = (): string => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" + SPECIAL_CHARS;
  let retVal = "";

  // Ensure at least one of each required type
  retVal += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
  retVal += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
  retVal += "0123456789"[Math.floor(Math.random() * 10)];
  retVal += SPECIAL_CHARS[Math.floor(Math.random() * SPECIAL_CHARS.length)];

  for (let i = 0; i < length - 4; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  // Shuffle the password
  return retVal.split('').sort(() => 0.5 - Math.random()).join('');
};

export interface ValidationErrors {
  [key: string]: string | undefined;
}
