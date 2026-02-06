import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import { getErrorMessage } from '@/lib/error-utils';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
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
      const response = await axios.put(`${backendUrl}/auth/users/${id}/role`, body, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return NextResponse.json(response.data);
    } catch (backendError: unknown) {
      if (axios.isAxiosError(backendError)) {
        console.error('Backend update role error status:', backendError.response?.status);
        console.error('Backend update role error message:', backendError.response?.data?.message || backendError.message);
        return NextResponse.json(
            { message: backendError.response?.data?.message || 'Failed to update role', success: false },
            { status: backendError.response?.status || 500 }
        );
      } else {
        console.error('Backend update role error:', backendError);
      }
      throw backendError;
    }
  } catch (error: unknown) {
    console.error('Update role error:', error);
    const message = getErrorMessage(error);

    return NextResponse.json(
      { message: message || 'Internal Server Error', success: false },
      { status: 500 }
    );
  }
}
