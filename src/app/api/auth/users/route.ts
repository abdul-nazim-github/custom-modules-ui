import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import { getErrorMessage } from '@/lib/error-utils';

interface BackendUser {
  id?: string;
  _id?: string;
  email: string;
  name: string;
  role: string[];
  permissions: string[];
  custom_permissions?: string[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    if (!accessToken) {
      console.error('API Route: /api/auth/users - No access token found in cookies');
      return NextResponse.json(
        { message: 'Unauthorized: No access token', success: false },
        { status: 401 }
      );
    }

    const sortBy = searchParams.get('sortBy') || 'name';
    const order = searchParams.get('order') || 'asc';

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3011/api';

    try {
      const response = await axios.get(`${backendUrl}/auth/users`, {
        params: { page, limit, sortBy, order },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const rawData = response.data.data || response.data.users || [];
      const normalizedUsers = Array.isArray(rawData) ? rawData.map((user: BackendUser) => ({
        ...user,
        id: (user.id || user._id) as string,
        email: user.email,
        name: user.name,
        role: user.role
      })) : [];

      return NextResponse.json({
        ...response.data,
        success: true,
        data: normalizedUsers,
        users: normalizedUsers,
        total: response.data.total || response.data.meta?.totalCount || normalizedUsers.length
      });
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
