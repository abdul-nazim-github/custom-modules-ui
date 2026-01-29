import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import { getErrorMessage } from '@/lib/error-utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { message: 'Unauthorized: No access token', success: false },
        { status: 401 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3011/api';

    try {
      const response = await axios.get(`${backendUrl}/contact/list`, {
        params: { page, limit },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return NextResponse.json(response.data);
    } catch (backendError: unknown) {
      if (axios.isAxiosError(backendError)) {
        console.error('Backend fetch contacts error status:', backendError.response?.status);
        console.error('Backend fetch contacts error message:', backendError.response?.data?.message || backendError.message);
        return NextResponse.json(
            { message: backendError.response?.data?.message || 'Backend Error', success: false },
            { status: backendError.response?.status || 500 }
        );
      }
      throw backendError;
    }

  } catch (error: unknown) {
    console.error('Fetch contacts error:', error);
    const message = getErrorMessage(error);
    return NextResponse.json(
      { message: message || 'Internal Server Error', success: false },
      { status: 500 }
    );
  }
}
