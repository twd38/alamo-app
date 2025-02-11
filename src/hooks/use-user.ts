import { useSession } from 'next-auth/react';
import type { User } from 'next-auth';

interface CustomUser extends User {
  name: string;
  email: string;
  image?: string;
}

export function useUser() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user as CustomUser | undefined,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated'
  };
} 