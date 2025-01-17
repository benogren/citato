import Link from 'next/link';
import {
  getSignInUrl,
  getSignUpUrl,
  withAuth,
} from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import { metadata } from './layout';

export default async function Home() {
  const { user } = await withAuth();
  const signInUrl = await getSignInUrl();
  const signUpUrl = await getSignUpUrl();

  if (user) {
    redirect(`/home`);
  }

  return (
    <>
    <div className="container mx-auto mt-48 text-center">
      <h1 className="title text-2xl">
        {JSON.parse(JSON.stringify(metadata.title))}
      </h1>
      <p className="text-gray-500 text-lg">
        {JSON.parse(JSON.stringify(metadata.description))}
      </p>
        <>
        <nav className="flex gap-2 justify-center py-10">
          <Link href={signInUrl} className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md">
            Log in
          </Link>
          <Link href={signUpUrl} className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md">
            Sign Up
          </Link>
        </nav>
        </>
    </div>
    </>
  );
}
