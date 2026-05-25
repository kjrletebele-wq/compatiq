import { redirect } from 'next/navigation';

// Old route — permanently redirected to new route
export default function LookingForDeviceRedirect() {
  redirect('/buy-device');
}
