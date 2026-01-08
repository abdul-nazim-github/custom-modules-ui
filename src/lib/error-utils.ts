import axios from 'axios';

/**
 * Safely extracts a human-readable error message from an unknown error object.
 * Handles Axios errors, standard Error objects, and strings.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'An error occurred with the network request';
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}
