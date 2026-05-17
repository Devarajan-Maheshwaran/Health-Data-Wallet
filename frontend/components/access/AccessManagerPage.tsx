'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AccessManagerPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/access'); }, [router]);
  return null;
}
