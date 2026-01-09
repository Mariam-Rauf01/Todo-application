import { cookies } from 'next/headers';

// Server-side authentication check
export const isAuthenticated = (): boolean => {
  const cookieStore = cookies();
  const token = cookieStore.get('access_token')?.value;
  return token !== undefined && token !== '';
};

// Get token server-side
export const getTokenServer = (): string | undefined => {
  const cookieStore = cookies();
  return cookieStore.get('access_token')?.value;
};

// Verify token (demo implementation - accepts any token)
export const verifyToken = (token: string): boolean => {
  // For demo purposes, accept any non-empty token
  return Boolean(token && token.length > 0);
};

// Verify token from request (for API routes)
export const verifyTokenFromRequest = async (request: any): Promise<{ success: boolean; token?: string }> => {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Try to get from cookies
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc: any, cookie: string) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});
        token = cookies.access_token;
      }
    }

    if (token && verifyToken(token)) {
      return { success: true, token };
    }

    return { success: false };
  } catch (error) {
    return { success: false };
  }
};