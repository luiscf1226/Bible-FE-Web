'use client';

import ErrorPage from '@/components/ErrorPage';

export default function PrayerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPage error={error} reset={reset} />;
} 