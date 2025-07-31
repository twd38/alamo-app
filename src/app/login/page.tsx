import Image from 'next/image';
import ahcLogo from './assets/ahc-logo.png';

import { LoginForm } from '@/components/login-form';

export default async function LoginPage() {
  return (
    <div className="h-screen w-full">
      <img
        src={'/images/ahc-logo.png'}
        alt="AHC Logo"
        className="fixed ml-6 mt-4 h-20 w-auto"
      />
      <div className="w-full flex flex-col items-center justify-center h-screen">
        <LoginForm />
      </div>
    </div>
  );
}
