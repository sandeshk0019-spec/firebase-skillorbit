
import { redirect } from 'next/navigation';

export default function RootPage() {
  // This page now simply redirects to the login page, which is the
  // mandatory entry point for the application.
  redirect('/login');
}
