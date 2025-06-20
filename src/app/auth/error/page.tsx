'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ErrorMessage = {
  title: string;
  message: string;
  action: React.ReactNode;
};

const errorMessages: Record<string, ErrorMessage> = {
  OAuthAccountNotLinked: {
    title: 'Account Linking Required',
    message:
      'We found an existing account with your email address. For security reasons, you need to sign in with your original method first, and then we can connect your Google account.',
    action: (
      <div className="flex flex-col space-y-4">
        <Button asChild variant="default" className="w-full">
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Sign In With Original Method
          </Link>
        </Button>
        <div className="text-xs text-gray-500 italic">
          <p>
            After signing in with your original method, you will be
            automatically able to use Google login in the future.
          </p>
        </div>
      </div>
    )
  },
  AccessDenied: {
    title: 'Access Denied',
    message:
      'You do not have permission to sign in. Please contact an administrator if you believe this is an error.',
    action: (
      <Button asChild variant="default">
        <Link href="/login">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Link>
      </Button>
    )
  },
  Verification: {
    title: 'Verification Required',
    message:
      'A verification email has been sent to your address. Please check your inbox and follow the instructions.',
    action: (
      <Button asChild variant="default">
        <Link href="/login">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Link>
      </Button>
    )
  },
  Default: {
    title: 'Authentication Error',
    message:
      'An error occurred during the authentication process. Please try again or contact support if the issue persists.',
    action: (
      <div className="flex flex-col space-y-4">
        <Button asChild variant="default" className="w-full">
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset Session
        </Button>
      </div>
    )
  }
};

// This component handles the actual error display and uses the search params
function ErrorContent(): React.ReactElement {
  const searchParams = useSearchParams();
  const [errorType, setErrorType] = useState<string>('Default');

  useEffect(() => {
    const error = searchParams.get('error');
    if (error && errorMessages[error]) {
      setErrorType(error);
    }
  }, [searchParams]);

  const errorInfo = errorMessages[errorType] || errorMessages['Default'];

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
        <AlertTriangle className="h-6 w-6 text-yellow-600" />
      </div>

      <div className="mt-3 text-center">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {errorInfo.title}
        </h3>
        <div className="mt-2">
          <p className="text-sm text-gray-500">{errorInfo.message}</p>
        </div>

        <div className="mt-6 flex flex-col">{errorInfo.action}</div>
      </div>
    </div>
  );
}

// Loading fallback component
function ErrorLoadingFallback(): React.ReactElement {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <div className="h-6 w-6 animate-pulse bg-gray-300 rounded-full"></div>
      </div>

      <div className="mt-3 text-center">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Loading Error Information...
        </h3>
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            Please wait while we retrieve error details.
          </p>
        </div>
      </div>
    </div>
  );
}

// Main page component that wraps the content with Suspense
export default function AuthErrorPage(): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <Suspense fallback={<ErrorLoadingFallback />}>
          <ErrorContent />
        </Suspense>

        <div className="text-center text-sm text-gray-500 mt-4">
          <p>
            Need assistance?{' '}
            <a
              href="#"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
