import Header from '../../components/header';
import { createClient } from "@/utils/supabase/server";
import Roundup from './roundup';
// import TrendingTopics from '../../components/TrendingTopics.tsx';

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

  return (
    <>
      <Header />
      <div className="container mx-auto">
        <h1 className="text-4xl py-16">Welcome to Citato</h1>
        {/* <h2 className="text-2xl font-normal pb-4">Trends</h2>
        <hr />
        <div className="pb-10">
          <TrendingTopics />
        </div> */}

        <h2 className="text-2xl text-gray-600 pb-4">Your Roundup</h2>
        <hr />
        <div className="pb-10">
          <Roundup pageUserId={user.id}/>
        </div>

      </div>
    </>
  );
}