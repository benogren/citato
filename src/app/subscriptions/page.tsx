import Header from '../../components/header';
import { createClient } from "@/utils/supabase/server";
import Link from 'next/link';
import TimeAgo from "@/components/time-ago";

export default async function SubscriptionPage() {
  const supabase = await createClient();
  
  // Fetch subscriptions
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .order('last_received', { ascending: false })

    return (
        <>
        <Header />
        <div className="container mx-auto">
            <div className='flex justify-between items-center'>
            <h2 className="text-2xl text-gray-600 pb-4">Your Subscriptions</h2>
            <span>
            <Link href="/find-subscriptions" className="text-blue-500 text-sm">
                Find Subscriptions
            </Link>
            {/* <Link href="/find-subscriptions" className="text-blue-500 text-sm ml-8">
                Add a Subscription
            </Link> */}
            </span>
            </div>
            <hr />
            <div className="pb-10">
            </div>

            <div>
            {subscriptions && subscriptions.length > 0 ? (
                subscriptions.map((sub) => (
                    <div key={sub.id} className="subscription-item flex justify-between items-center pb-8">
                        <div>
                            <p className='text-lg text-gray-600'>{sub.from_name || sub.from_email}</p>
                            <p className='text-sm text-gray-500'>{sub.from_email}</p>
                        </div>
                        <div className='text-right text-xs'>
                        <p className='text-gray-500'><TimeAgo date={new Date(sub.last_received).toISOString()} /></p>
                        {/* <form action="/api/unsubscribe" method="POST">
                            <input type="hidden" name="id" value={sub.id} />
                            <button
                            type="submit"
                            className="text-red-600 hover:text-red-800 pt-4"
                            >
                            Unsubscribe
                            </button>
                        </form> */}
                        </div>
                    </div>
                ))
            ) : (
                <div className="col-span-full text-center text-gray-500 py-8">
                No subscriptions found.
                <Link href="/find-subscriptions" className="text-blue-500 ml-2">
                    Find subscriptions
                </Link>
                </div>
            )}
            </div>
        </div>
        </>
    );
}