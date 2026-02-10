
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function RootPage() {
  // This page now simply redirects to the login page.
  // The landing page content has been merged into the login experience.
  redirect('/login');
}
