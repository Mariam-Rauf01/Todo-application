// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    return token !== null && token !== '';
  }
  // On server, we can't check localStorage, so return false
  return false;
};

// Get the current user token
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
};

// Set the user token
export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token);
  }
};

// Remove the user token (logout)
export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
  }
};