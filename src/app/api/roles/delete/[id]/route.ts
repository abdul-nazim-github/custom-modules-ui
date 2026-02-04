import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import { getErrorMessage } from '@/lib/error-utils';

export async function DELETE(
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
      const response = await axios.delete(`${backendUrl}/roles/delete/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return NextResponse.json(response.data);
    } catch (backendError: unknown) {
      if (axios.isAxiosError(backendError)) {
        console.error('Backend delete role error status:', backendError.response?.status);
        console.error('Backend delete role error message:', backendError.response?.data?.message || backendError.message);
      } else {
        console.error('Backend delete role error:', backendError);
      }
      throw backendError;
    }
  } catch (error: unknown) {
    console.error('Delete role error:', error);
    const message = getErrorMessage(error);
    let status = 500;
    if (axios.isAxiosError(error) && error.response) {
      status = error.response.status;
    }

    return NextResponse.json(
      { message: message || 'Internal Server Error', success: false },
      { status }
    );
  }
}
