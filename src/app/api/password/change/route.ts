import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import { getErrorMessage } from '@/lib/error-utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Old password and new password are required', success: false },
        { status: 400 }
      );
    }

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
      const response = await axios.post(
        `${backendUrl}/password/change`,
        { oldPassword, newPassword },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      return NextResponse.json(response.data);
    } catch (backendError: unknown) {
      if (axios.isAxiosError(backendError)) {
        const status = backendError.response?.status || 500;
        const message = backendError.response?.data?.message || backendError.message;

        return NextResponse.json(
            { message, success: false },
            { status }
        );
      } else {
        console.error('Backend change password error:', backendError);
      }
      throw backendError;
    }

  } catch (error: unknown) {
    console.error('Change password error:', error);
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
