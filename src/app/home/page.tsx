import Header from '../../components/header';
import { createClient } from "@/utils/supabase/server";
import Roundup from './roundup';

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