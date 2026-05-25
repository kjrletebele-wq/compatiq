import { redirect } from 'next/navigation';
import { SetupLiveDataClient } from './SetupLiveDataClient';

/**
 * Live data setup — dev only.
 * Redirects to home in production so this page is never exposed publicly.
 */
export default function SetupLiveDataPage() {
  if (process.env.NODE_ENV === 'production') {
    redirect('/');
  }
  return <SetupLiveDataClient />;
}
