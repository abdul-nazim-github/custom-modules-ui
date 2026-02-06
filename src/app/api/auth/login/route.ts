import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import { getErrorMessage } from '@/lib/error-utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3011/api';
    // Call Backend API
    const response = await axios.post(`${backendUrl}/auth/login`, { email, password });
    const { message, data, success } = response.data;

    if (!success || !data) {
      return NextResponse.json(
        { message: message || 'Authentication failed', success: false },
        { status: 401 }
      );
    }

    const { accessToken, refreshToken, user } = data;

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { message: 'Invalid response from server: missing tokens', success: false },
        { status: 502 }
      );
    }

    // Set cookies
    const cookieStore = await cookies();

    // Access Token Cookie
    cookieStore.set({
      name: 'accessToken',
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    // Refresh Token Cookie
    cookieStore.set({
      name: 'refreshToken',
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // User Name Cookie (for UI display)
    if (user) {
      if (user.name) {
        cookieStore.set({
          name: 'userName',
          value: user.name,
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24,
          path: '/',
        });
      }
      if (user.email) {
        cookieStore.set({
          name: 'userEmail',
          value: user.email,
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24,
          path: '/',
        });
      }
      if (user.permissions) {
        cookieStore.set({
          name: 'userPermissions',
          value: JSON.stringify(user.permissions),
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24,
          path: '/',
        });
      }
      if (user.role) {
        cookieStore.set({
          name: 'userRole',
          value: Array.isArray(user.role) ? JSON.stringify(user.role) : JSON.stringify([user.role]),
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24,
          path: '/',
        });
      }
    }

    return NextResponse.json({
      message: message || 'Login successful',
      success: true,
      data: { accessToken, refreshToken, user }
    });

  } catch (error: unknown) {
    console.error('Login error:', error);
    const message = getErrorMessage(error);

    // Extract status code if available from axios error
    let status = 500;
    if (axios.isAxiosError(error) && error.response) {
      status = error.response.status;
    }

    return NextResponse.json(
      {
        message: message || 'Internal Server Error',
        success: false
      },
      { status }
    );
  }
}
