import Link from 'next/link';
import { DataList, Badge, Flex, Code } from '@radix-ui/themes';
import Header from '../../components/header';
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: 'citato.ai | Settings',
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user }, } = await supabase.auth.getUser();
  // const { data: user_profiles } = await supabase
  //   .from('user_profiles')
  //   .select('*')
  //   .eq('id', user?.id);

  return (
    <>
      <Header />
      <div className='container mx-auto'>
        <h2 className="text-2xl text-gray-600 pb-4">Settings</h2>
        <hr />
      
      {/* <pre>{JSON.stringify(user, null, 2)}</pre> */}
        <div className='mt-8 bg-white p-8 rounded-lg shadow-md' key={user?.id}>
          <DataList.Root>
            {/* <DataList.Item align="center">
              <DataList.Label minWidth="88px">Subscription</DataList.Label>
              <DataList.Value>
                <Badge color="sky" variant="soft" radius="full">Current plan: Annual</Badge>
                &nbsp;&middot;&nbsp;
                <Link href="/billing" className="text-blue-500">Manage subscription</Link>
              </DataList.Value>
            </DataList.Item> */}
            <DataList.Item>
              <DataList.Label minWidth="88px">ID</DataList.Label>
              <DataList.Value>
                <Flex align="center" gap="2">
                  <Code variant="ghost">{user?.id}</Code>
                </Flex>
              </DataList.Value>
            </DataList.Item>
            <DataList.Item>
              <DataList.Label minWidth="88px">Full Name</DataList.Label>
              <DataList.Value>{user?.user_metadata.full_name}</DataList.Value>
            </DataList.Item>
            <DataList.Item>
              <DataList.Label minWidth="88px">Email</DataList.Label>
              <DataList.Value>
                <Link href={'mailto:' + user?.email}>{user?.email}</Link>
              </DataList.Value>
            </DataList.Item>
            <DataList.Item align="center">
              <DataList.Label minWidth="88px">Email Verified</DataList.Label>
              <DataList.Value>
              {user?.user_metadata.email_verified ? 
              <Badge color="jade" variant="soft" radius="full">Yes</Badge>
              : 
              <Badge color="ruby" variant="soft" radius="full">No</Badge>
              }
              </DataList.Value>
            </DataList.Item>
          </DataList.Root>
        </div>
      </div>
    </>
  );
}