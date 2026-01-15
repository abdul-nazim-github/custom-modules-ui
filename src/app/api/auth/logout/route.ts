import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;

  try {
    if (accessToken) {
      const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3011/api';

      // Call Backend Logout API
      await axios.post(`${backendUrl}/auth/logout`,
        { refreshToken },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
    }
  } catch (error) {
    console.error('Backend logout failed:', error);
    // We continue to clear cookies even if backend fails to ensure local logout
  }

  // Clear local cookies
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
  cookieStore.delete('userName');
  cookieStore.delete('userEmail');
  cookieStore.delete('userPermissions');
  cookieStore.delete('userRole');

  return NextResponse.json({ message: 'Logged out successfully', success: true });
}
