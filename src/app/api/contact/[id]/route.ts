import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import { getErrorMessage } from '@/lib/error-utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      const response = await axios.get(`${backendUrl}/contact/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return NextResponse.json(response.data);
    } catch (backendError: unknown) {
      if (axios.isAxiosError(backendError)) {
        console.error('Backend fetch contact detail error status:', backendError.response?.status);
        return NextResponse.json(
            { message: backendError.response?.data?.message || 'Backend Error', success: false },
            { status: backendError.response?.status || 500 }
        );
      }
      throw backendError;
    }

  } catch (error: unknown) {
    console.error('Fetch contact detail error:', error);
    const message = getErrorMessage(error);
    return NextResponse.json(
      { message: message || 'Internal Server Error', success: false },
      { status: 500 }
    );
  }
}
