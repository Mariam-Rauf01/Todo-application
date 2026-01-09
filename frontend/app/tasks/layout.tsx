import { redirect } from 'next/navigation';
import { isAuthenticated } from '../utils/auth-server';
import AuthHeader from '../components/auth-header';

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication on the server side
  if (!isAuthenticated()) {
    redirect('/login');
  }

  // If authenticated, render children
  return (
    <>
      <AuthHeader />
      <div className="py-8">
        {children}
      </div>
    </>
  );
}