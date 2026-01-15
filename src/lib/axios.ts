import axios from 'axios';

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add Authorization header if token exists (client-side)
// Note: For httpOnly cookies, the browser handles sending cookies automatically to the same domain (Next.js API).
// If this axios instance is used to call Next.js API routes, we don't need to manually add the token if it's in a cookie.
// However, if we are calling the external backend directly from client (not recommended for httpOnly), we would need it.
// Since the plan is Client -> Next.js API -> Backend, the Client just calls Next.js API.
// The Next.js API will handle the token.
// So this axios instance is primarily for Client -> Next.js API calls.

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Here we could implement token refresh logic if we had a refresh token flow
      // For now, we might just redirect to login or let the error propagate
      // window.location.href = '/signin'; // Optional: force redirect
    }

    return Promise.reject(error);
  }
);

export default api;
