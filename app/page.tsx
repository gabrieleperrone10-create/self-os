import { redirect } from 'next/navigation';

// Root redirect — middleware handles auth routing
export default function Home() {
  redirect('/dashboard');
}
