'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { TopControls } from '@/components/ui/TopControls';
import { OnboardingTour } from '@/components/ui/OnboardingTour';
import { OwnerOnboardingTour } from '@/components/ui/OwnerOnboardingTour';
import { ReservationAssistant } from '@/components/ui/ReservationAssistant';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
        <TopControls />
        <OnboardingTour />
        <OwnerOnboardingTour />
        <ReservationAssistant />
      </ThemeProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );

}
