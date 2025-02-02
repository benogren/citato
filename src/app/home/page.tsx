import Link from 'next/link';
import Header from '../../components/header';
import { createClient } from "@/utils/supabase/server";
import TimeAgo from '@/components/time-ago';
import RoundUp from './roundup';
//import { getTodaysSubscribedEmails } from './gmailroundup';
//import SubscriptionEmails from './SubscriptionEmails';

async function fetchSubData(pageUserId: string) {
  const supabase = await createClient();
  const googleTeam = "09524579-5fbf-451b-8499-2d011b8e1536";
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('updated_at, newsletter_senders(name, id, email_address)')
    .eq('userId', pageUserId)
    .not('newsletterId', 'eq', googleTeam)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching subscriptions:', error);
    return null;
  }

  return data;
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="container mx-auto text-center mt-10">
        <h1 className="text-2xl font-bold">Please log in to continue</h1>
      </div>
    );
  }

  const userSubs = await fetchSubData(user.id);
  //const getsubscriptionEmails = await getTodaysSubscribedEmails(user.id);
  //const userName = user.user_metadata?.first_name || "User";

  return (
    <>
      <Header />
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold py-16">Welcome to Citato</h1>

        {/* <h2 className="text-2xl font-normal pb-4">Today&#39;s Roundup (Gmail)</h2>
        <hr />
        <div className="pb-10 pt-6">
          <SubscriptionEmails emails={getsubscriptionEmails} />
        </div> */}

        <h2 className="text-2xl font-normal pb-4">Today&#39;s Roundup</h2>
        <hr />
        <div className="pb-10 pt-6">
          <RoundUp pageUserId={user.id} />
        </div>

        {/* User Newsletters Section */}
        <h2 className="text-2xl font-normal pb-4">Your Newsletters</h2>
        <hr />
        <div className="min-h-screen flow-root pt-4">
          <div className="grid grid-cols-5 gap-6 mb-6">
            {userSubs && userSubs.length > 0 ? (
              userSubs.map((item) => {
                const senders = Array.isArray(item.newsletter_senders)
                  ? item.newsletter_senders
                  : [item.newsletter_senders];

                return senders.map((sender) => (
                  <Link href={`/newsletter/${sender.id}`} key={sender.id}>
                    <div className="relative grid h-[20rem] items-end justify-center overflow-hidden rounded-xl bg-white text-center text-gray-700">
                      <div className="absolute inset-0 h-full w-full bg-cover bg-center bg-[url('https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')]">
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
                      </div>
                      <div className="relative p-6 py-14">
                        <h2 className="block text-xl font-medium text-white">
                          {sender.name}
                        </h2>
                        <p className="text-xs text-gray-400 pt-4">
                          <TimeAgo date={new Date(item.updated_at).toISOString()} />
                        </p>
                      </div>
                    </div>
                  </Link>
                ));
              })
            ) : (
              <div className="text-gray-500 text-lg bg-gray-200 rounded-md">
                <p className="p-4">
                  No Subscriptions Found. Make sure you have set up your email forward. Follow instructions in{' '}
                  <Link href="/settings" className="underline">
                    settings
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}