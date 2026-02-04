import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import { getErrorMessage } from '@/lib/error-utils';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { message: 'Unauthorized: No access token', success: false },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy');
    const order = searchParams.get('order');

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3011/api';

    const query = new URLSearchParams({ page, limit });
    if (search) query.set('search', search);
    if (sortBy) query.set('sortBy', sortBy);
    if (order) query.set('order', order);

    try {
      const response = await axios.get(`${backendUrl}/roles/list?${query.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      return NextResponse.json(response.data);
    } catch (backendError: unknown) {
      if (axios.isAxiosError(backendError)) {
        console.error('Backend list roles error status:', backendError.response?.status);
        console.error('Backend list roles error message:', backendError.response?.data?.message || backendError.message);
      } else {
        console.error('Backend list roles error:', backendError);
      }
      throw backendError;
    }
  } catch (error: unknown) {
    console.error('List roles error:', error);
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
