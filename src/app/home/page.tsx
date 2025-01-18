import Header from '../../components/header';
import { createClient } from "@/utils/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user }, } = await supabase.auth.getUser();
  
  return (
    <>
    <Header />
    <div className='container mx-auto my-12 text-center'>
       Hi!
       <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
    </div>
    </>
  );
}