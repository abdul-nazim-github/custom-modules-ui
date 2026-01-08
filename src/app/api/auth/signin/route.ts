import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Call Backend API
    // In a real app, this would be your actual backend URL
    // For demo purposes, we'll mock a successful response if credentials match a pattern
    // or try to call the URL from env.

    let token = '';
    let user = null;

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    // MOCK LOGIC FOR DEMO (Remove in production if real backend is ready)
    if (email === 'demo@example.com' && password === 'password') {
       token = 'mock_jwt_token_xyz123';
       user = { id: 1, email, name: 'Demo User' };
    } else {
        // Attempt actual backend call
        try {
            const response = await axios.post(`${backendUrl}/auth/login`, { email, password });
            token = response.data.access_token;
            user = response.data.user;
        } catch (error) {
             // If backend call fails and it's not the mock user
             if (email !== 'demo@example.com') {
                 return NextResponse.json(
                    { message: 'Invalid credentials' },
                    { status: 401 }
                 );
             }
        }
    }

    if (!token) {
         return NextResponse.json(
            { message: 'Authentication failed' },
            { status: 401 }
         );
    }

    // Set httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: process.env.COOKIE_NAME || 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return NextResponse.json({ user, message: 'Login successful' });

  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
