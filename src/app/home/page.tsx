import Link from 'next/link';
import Header from '../../components/header';
import { createClient } from "@/utils/supabase/server";
import TimeAgo from '@/components/time-ago';

async function fetchUserProfile(pageUserId: string) {
  console.log('Fetching profile for:', pageUserId);
  const supabase = await createClient();
  const { data, error } = await supabase
  .from('user_profiles')
    .select('*')
  .eq('id', pageUserId)

  if (error) {
    console.error('Error fetching data:', error);
    return null;
  }

  return data;
}

async function fetchSubData(pageUserId: string) {
  console.log('Fetching subs for:', pageUserId);
  const supabase = await createClient();
  const googleTeam = "09524579-5fbf-451b-8499-2d011b8e1536"
  const { data, error } = await supabase
  .from('user_subscriptions')
    .select('updated_at, newsletter_senders(name, id, email_address)')
  .eq('userId', pageUserId)
  .not('newsletterId', 'eq', googleTeam)
  .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching data:', error);
    return null;
  }

  return data;
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user }, } = await supabase.auth.getUser();
  const userProfile = await fetchUserProfile(user?.id as string);
  const userSubs = await fetchSubData(user?.id as string);
  
  return (
    <>
    <Header />
    <div className='container mx-auto'>
      <h1 className='text-3xl font-bold py-16'>Welcome to Citato</h1>
      {userProfile && userProfile.map((item) => (
      <h2 className='text-2xl font-normal pb-4' key={item.id}>
        {item.first_name}&#39;s Newsletters
      </h2>
      ))}
      <hr />
      <div className='min-h-screen flow-root pt-4'>
        <div className="grid-cols-5 grid gap-6 mb-6">

        {userSubs && userSubs.length > 0 ? (
              userSubs.map((item: { updated_at: string; newsletter_senders: { name: string; id: string; email_address: string } | { name: string; id: string; email_address: string }[] }) => {
                const senders = Array.isArray(item.newsletter_senders)
                  ? item.newsletter_senders
                  : [item.newsletter_senders];
                return senders.map((sender) => (
              <Link href={`/newsletter/${sender.id}`} key={sender.id}>
              <div className="relative grid h-[20rem] items-end justify-center overflow-hidden rounded-xl bg-white bg-clip-border text-center text-gray-700">
                <div className="absolute inset-0 m-0 h-full w-full overflow-hidden bg-transparent bg-[url('https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover bg-clip-border bg-center text-gray-700 shadow-none">
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-t from-black/80 via-black/50 to-bg-black-10"></div>
                </div>
                <div className="relative p-6 px-6 py-14 md:px-12">
                  <h2 className="block text-xl font-medium tracking-normal text-white antialiased">
                    {sender.name}
                  </h2>
                  <p className="block text-xs antialiased font-normal leading-snug tracking-normal text-gray-400 pt-4">
                    <TimeAgo date={new Date(item.updated_at).toLocaleString()} />
                  </p>
                </div>
              </div>
              </Link>
            ));
          })
        ) : (
          <div className="text-gray-500 text-lg bg-gray-200 rounded-md">
            <p className='p-4 text-normal'>
              No Subscriptions Found, make sure you have set up your email forward. Follow instructions found in <Link href={'/settings'} className='underline'>settings</Link>
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
    </>
  );
}