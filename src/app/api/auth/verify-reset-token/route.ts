import { NextResponse } from 'next/server';
import axios from 'axios';
import { getErrorMessage } from '@/lib/error-utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: 'Token is required', success: false, isValid: false },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3011/api';

    const response = await axios.get(`${backendUrl}/auth/verify-reset-token`, {
      params: { token },
      headers: authHeader ? { Authorization: authHeader } : {},
    });

    return NextResponse.json(response.data);

  } catch (error: unknown) {
    console.error('Verify reset token error:', error);
    const message = getErrorMessage(error);

    let status = 500;
    if (axios.isAxiosError(error) && error.response) {
      status = error.response.status;
    }

    return NextResponse.json(
      {
        message: message || 'Internal Server Error',
        success: false,
        isValid: false
      },
      { status }
    );
  }
}
