// utils/auth.ts
export function isAuthenticated(): boolean {
  // Check if user is authenticated
  // This could check for a token in localStorage, cookies, etc.
  const token = localStorage.getItem('authToken');
  return !!token; // Return true if token exists, false otherwise
}

export function login(token: string): void {
  // Store the authentication token
  localStorage.setItem('authToken', token);
}

export function logout(): void {
  // Remove the authentication token
  localStorage.removeItem('authToken');
}

export function getToken(): string | null {
  // Get the authentication token
  return localStorage.getItem('authToken');
}