import Link from 'next/link';
import Header from '../../components/header';
import { createClient } from "@/utils/supabase/server";

async function fetchData() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('emails')
    .select('*')
    .order('receivedDate', { ascending: false });

  if (error) {
    console.error('Error fetching data:', error);
    return null;
  }

  return data;
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user }, } = await supabase.auth.getUser();
  const emailData = await fetchData();
  
  return (
    <>
    <Header />
    <div className='container mx-auto my-12 text-center'>
      <h1 className='text-3xl font-bold'>Welcome, {user?.email}</h1>
      {emailData && emailData.map((item) => (
        <div className='bg-white p-8 rounded-lg shadow-md' key={item.id}>
          <h2 className='text-xl font-bold'>
            <Link href={`/read/${item.id}`}>{item.subject}</Link>
            </h2>
          <p className='text-sm text-gray-500'>{item.receivedDate}</p>
          <p className='text-sm text-gray-500'>From: {item.from}</p>
        </div>
      ))}
    </div>
    </>
  );
}