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
    <div className='container mx-auto'>
      <h1 className='text-3xl font-bold mb-6'>Welcome, {user?.email}</h1>
      <div className='flex flex-wrap'>
      {emailData && emailData.map((item) => (
        <>
       <div className='bg-gray-50 mr-4 mb-4 rounded-lg shadow-md' key={item.id}>
        <p className='p-4'>
          <Link href={`/read/${item.id}`}>{item.subject}</Link><br/>
          <span className='text-xs'>
          {item.receivedDate}
          </span>
        </p>
       </div>
        </>
      ))}
      </div>
    </div>
    </>
  );
}