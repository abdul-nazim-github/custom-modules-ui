import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor ... (comments)

// Endpoints that should NOT trigger auto-logout on 401 (e.g., login with wrong password)
const AUTO_LOGOUT_EXCLUDED_URLS = [
    '/api/auth/login',
    '/api/auth/register',
    'api/auth/reset-password',
    '/api/auth/forgot-password'
];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the request URL is in the excluded list
    // We check if the URL *includes* the endpoint path to handle absolute/relative variations
    const isExcluded = AUTO_LOGOUT_EXCLUDED_URLS.some(url => originalRequest.url?.includes(url));

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry && !isExcluded) {
      originalRequest._retry = true;

      // Redirect to signin page to force re-authentication
      if (typeof window !== 'undefined') {
        try {
            // Show session expired message
            toast.error('Session expired. Logging out...', { duration: 2000 });

            // Call the logout API to clear cookies (accessToken, refreshToken)
            await fetch('/api/auth/logout', { method: 'POST' });

            // Artificial delay to let the user see the message
            await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (logoutError) {
          console.error('Auto-logout failed:', logoutError);
        } finally {
          window.location.href = '/signin';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
