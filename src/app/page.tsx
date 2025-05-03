
import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect users to the consumer home page by default
  redirect('/consumer');
}
