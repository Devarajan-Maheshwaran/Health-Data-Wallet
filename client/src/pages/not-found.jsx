import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-12 text-center">
      <h1 className="text-5xl font-bold tracking-tight text-primary-600 mb-2">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-neutral-600 mb-8 max-w-md">
        Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
      </p>
      <Link href="/">
        <Button>
          <span className="material-icons mr-2 text-sm">arrow_back</span>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;