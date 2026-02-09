import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Must match the backend's SECRET_KEY
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthResult {
  success: boolean;
  userId?: number;
  email?: string;
  error?: string;
}

/**
 * Verifies the authentication token from the request
 * @param request - The Next.js API request object
 * @returns Promise<AuthResult> - Result of the authentication verification
 */
export async function verifyTokenFromRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Try to get token from Authorization header first
    const authHeader = request.headers.get('Authorization');
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('Token found in Authorization header');
    } else {
      // Fallback to cookie
      const cookieStore = cookies();
      token = cookieStore.get('auth-token')?.value;
      if (token) {
        console.log('Token found in cookie');
      }
    }

    if (!token) {
      console.log('No token found in header or cookies');
      return {
        success: false,
        error: 'Authentication token missing'
      };
    }

    // Verify the token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
      
      console.log('✅ Token verified successfully for user ID:', decoded.userId);
      console.log('JWT_SECRET used:', JWT_SECRET);
      
      return {
        success: true,
        userId: decoded.userId,
        email: decoded.email
      };
    } catch (verifyError: any) {
      console.error('❌ Token verification failed:', verifyError.message);
      console.error('JWT_SECRET:', JWT_SECRET);
      return {
        success: false,
        error: 'Invalid or expired token'
      };
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Helper function to get the current user from the request
 * @param request - The Next.js API request object
 * @returns Promise<AuthResult> - Result containing user info if authenticated
 */
export async function getCurrentUser(request: NextRequest): Promise<AuthResult> {
  return await verifyTokenFromRequest(request);
}

/**
 * Synchronous function to check if user is authenticated (for server components)
 * @returns boolean - Whether the user is authenticated
 */
export function isAuthenticated(): boolean {
  try {
    // Access cookies in a server component
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return false;
    }

    // Verify the token synchronously
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
}