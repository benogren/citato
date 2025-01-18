import { metadata } from './layout';
import AuthButton from '@/components/header-auth';

export default async function Home() {

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
          <AuthButton></AuthButton>
        </nav>
        </>
    </div>
    </>
  );
}
