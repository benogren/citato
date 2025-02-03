//import Link from 'next/link';
import Header from '../../components/header';
import { createClient } from "@/utils/supabase/server";
import Roundup from './roundup';
//import { getTodaysSubscribedEmails } from './gmailroundup';
//import SubscriptionEmails from './SubscriptionEmails';

// async function fetchSubData(pageUserId: string) {
//   const supabase = await createClient();
//   const googleTeam = "09524579-5fbf-451b-8499-2d011b8e1536";
//   const { data, error } = await supabase
//     .from('user_subscriptions')
//     .select('updated_at, newsletter_senders(name, id, email_address)')
//     .eq('userId', pageUserId)
//     .not('newsletterId', 'eq', googleTeam)
//     .order('updated_at', { ascending: false });

//   if (error) {
//     console.error('Error fetching subscriptions:', error);
//     return null;
//   }

//   return data;
// }

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

  //const userSubs = await fetchSubData(user.id);
  //const getsubscriptionEmails = await getTodaysSubscribedEmails(user.id);
  //const userName = user.user_metadata?.first_name || "User";

  return (
    <>
      <Header />
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold py-16">Welcome to Citato</h1>

        <h2 className="text-2xl font-normal pb-4">Today&#39;s Roundup</h2>
        <hr />
        <div className="pb-10">
          <Roundup pageUserId={user.id}/>
        </div>

      </div>
    </>
  );
}