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

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';

  const hasUppercase = /[A-Z]/.test(password);
  const hasNumberOrSpecial = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUppercase) return 'Password must contain at least one uppercase letter';
  if (!hasNumberOrSpecial) return 'Password must contain at least one number or special character';

  return null;
};

export interface ValidationErrors {
  [key: string]: string | undefined;
}
