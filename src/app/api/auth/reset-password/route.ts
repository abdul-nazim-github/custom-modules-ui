import { NextResponse } from 'next/server';
import axios from 'axios';
import { getErrorMessage } from '@/lib/error-utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required', success: false },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3011/api';
    // Call Backend API
    const response = await axios.post(`${backendUrl}/auth/reset-password`, { email, password });
    const { message, success } = response.data;

    return NextResponse.json({
      message: message || 'Password reset successful',
      success: success ?? true,
    });

  } catch (error: unknown) {
    console.error('Reset password error:', error);
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
