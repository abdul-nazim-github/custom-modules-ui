import { NextResponse } from 'next/server';
import axios from 'axios';
import { getErrorMessage } from '@/lib/error-utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required', success: false },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3011/api';

    // Call Backend API
    const response = await axios.post(`${backendUrl}/auth/forgot-password`, { email });
    const { message, success } = response.data;

    return NextResponse.json({
      message: message || 'Reset email sent successfully',
      success: success ?? true,
    });

  } catch (error: unknown) {
    console.error('Forgot password error:', error);
    const message = getErrorMessage(error);

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
