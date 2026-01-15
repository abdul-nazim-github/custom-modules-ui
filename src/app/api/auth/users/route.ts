import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import { getErrorMessage } from '@/lib/error-utils';

interface BackendUser {
  id?: string;
  _id?: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    console.log('API Route: /api/auth/users - accessToken present:', !!accessToken);

    if (!accessToken) {
      console.error('API Route: /api/auth/users - No access token found in cookies');
      return NextResponse.json(
        { message: 'Unauthorized: No access token', success: false },
        { status: 401 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3011/api';

    console.log(`Fetching users from backend: ${backendUrl}/auth/users`);

    try {
      const response = await axios.get(`${backendUrl}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      console.log('Backend response status:', response.status);
      console.log('Backend response success:', response.data.success);
      if (response.data.data && response.data.data.length > 0) {
        console.log('First user from backend (raw):', JSON.stringify(response.data.data[0]));
      }

      // Map _id to id if necessary
      if (response.data.success && Array.isArray(response.data.data)) {
        response.data.data = response.data.data.map((user: BackendUser) => {
          const mappedUser = {
            ...user,
            id: user.id || user._id
          };
          return mappedUser;
        });
        console.log('First user after mapping:', JSON.stringify(response.data.data[0]));
      }

      return NextResponse.json(response.data);
    } catch (backendError: unknown) {
      if (axios.isAxiosError(backendError)) {
        console.error('Backend fetch users error status:', backendError.response?.status);
        console.error('Backend fetch users error message:', backendError.response?.data?.message || backendError.message);
      } else {
        console.error('Backend fetch users error:', backendError);
      }
      throw backendError; // Re-throw to be caught by the outer catch block
    }

  } catch (error: unknown) {
    console.error('Fetch users error:', error);
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
