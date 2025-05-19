import { useEffect } from 'react';
import { useRouter } from 'next/router';

// This page will redirect to /dashboard or /login based on auth status
// AuthProvider will handle the actual redirection logic for protected routes.
// This page mainly handles the root path.
const HomePage = () => {
  const router = useRouter();

  useEffect(() => {
    // Check localStorage directly or rely on AuthProvider's eventual redirect
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return <div>Loading...</div>; // Or a spinner
};

// This page does not need the standard DashboardLayout or AuthProvider wrapper directly,
// as its sole purpose is to redirect.
HomePage.getLayout = function getLayout(page) {
    return page;
}

export default HomePage; 