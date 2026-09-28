import { redirect } from 'next/navigation';

export default function WhoAreYouRedirect() {
  redirect('/sign-in');
}
