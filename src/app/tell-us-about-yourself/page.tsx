import { redirect } from 'next/navigation';

export default function TellUsAboutYourselfRedirect() {
  redirect('/sign-in');
}
