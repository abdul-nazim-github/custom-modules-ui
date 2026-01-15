import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import { getErrorMessage } from '@/lib/error-utils';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`API Route: /api/auth/users/${id}/role - params unwrapped`);
    const body = await request.json();
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    console.log(`API Route: /api/auth/users/${id}/role - accessToken present:`, !!accessToken);
    if (accessToken) {
      console.log(`API Route: /api/auth/users/${id}/role - Token starts with: ${accessToken.substring(0, 10)}...`);
    }

    if (!accessToken) {
      console.error(`API Route: /api/auth/users/${id}/role - No access token found in cookies`);
      return NextResponse.json(
        { message: 'Unauthorized: No access token', success: false },
        { status: 401 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3011/api';
    const fullBackendUrl = `${backendUrl}/auth/users/${id}/role`;

    console.log(`Attempting backend PUT to: ${fullBackendUrl}`);

    try {
      const response = await axios.put(
        fullBackendUrl,
        body,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Backend response status:', response.status);
      return NextResponse.json(response.data);
    } catch (backendError: unknown) {
      if (axios.isAxiosError(backendError)) {
        console.error('Backend role update error status:', backendError.response?.status);
        console.error('Backend role update error message:', backendError.response?.data?.message || backendError.message);
      } else {
        console.error('Backend role update error:', backendError);
      }
      throw backendError;
    }

  } catch (error: unknown) {
    console.error('Role update error:', error);
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
