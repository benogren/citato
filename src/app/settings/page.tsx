import Link from 'next/link';
// import { CopyIcon } from '@radix-ui/react-icons';
import { DataList, Badge, Flex, Code } from '@radix-ui/themes';
import Header from '../../components/header';
import { createClient } from "@/utils/supabase/server";

async function fetchGoogle(pageUserId: string) {
    const googleTeam = "09524579-5fbf-451b-8499-2d011b8e1536"
    const supabase = await createClient();
    const { data, error } = await supabase
    .from('emails')
      .select('*')
    .eq('userID', pageUserId)
    .eq('sender_id', googleTeam)
    .order('created_at', { ascending: false })
    .limit(1);
  
    if (error) {
      console.error('Error fetching data:', error);
      return null;
    }
  
    return data;
  }

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();
    const { data: user_profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id);

    const userGoogle = await fetchGoogle(user?.id as string);

    return (
        <>
        <Header />
        {user_profiles && user_profiles.map((item) => (
        <div className='container mx-auto my-12 bg-white p-8 rounded-lg shadow-md' key={item.id}>
            <DataList.Root>
            <DataList.Item align="center">
                    <DataList.Label minWidth="88px">Subscription</DataList.Label>
                    <DataList.Value>
                        <Badge color="sky" variant="soft" radius="full">Current plan: Annual</Badge>
                        &nbsp;&middot;&nbsp;
                        <Link href="/billing" className="text-blue-500">Manage subscription</Link>
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item align="center">
                    <DataList.Label minWidth="88px">Email Verified</DataList.Label>
                    <DataList.Value>
                        {/* {user user.email_verified 
                        ? <Badge color="jade" variant="soft" radius="full">Yes</Badge> 
                        : <Badge color="ruby" variant="soft" radius="full">No</Badge>
                        } */}
                        <Badge color="jade" variant="soft" radius="full">Yes</Badge> 
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item>
                    <DataList.Label minWidth="88px">ID</DataList.Label>
                    <DataList.Value>
                        <Flex align="center" gap="2">
                            <Code variant="ghost">{user?.id}</Code>
                            {/* <IconButton
                                size="1"
                                aria-label="Copy value"
                                color="gray"
                                variant="ghost"
                            >
                                <CopyIcon />
                            </IconButton> */}
                        </Flex>
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item>
                    <DataList.Label minWidth="88px">Full Name</DataList.Label>
                    <DataList.Value>{user?.user_metadata.first_name}{' '}{user?.user_metadata.last_name}</DataList.Value>
                </DataList.Item>
                <DataList.Item>
                    <DataList.Label minWidth="88px">Email</DataList.Label>
                    <DataList.Value>
                        <Link href={'mailto:'+user?.email}>{user?.email}</Link>
                    </DataList.Value>
                </DataList.Item>
                <DataList.Item>
                    <DataList.Label minWidth="88px">Forward Email</DataList.Label>
                    <DataList.Value>
                        <Flex align="center" gap="2">
                            <Code variant="ghost" className='lowercase'>
                                {item.slug + '@subs.citato.ai'}
                            </Code>
                            {/* <IconButton
                                size="1"
                                aria-label="Copy value"
                                color="gray"
                                variant="ghost"
                            >
                                <CopyIcon />
                            </IconButton> */}
                        </Flex>
                    </DataList.Value>
                </DataList.Item>
            </DataList.Root>
        </div>
        ))}
        {userGoogle && userGoogle.length > 0 ? (
            userGoogle.map((item) => (
            <>   
        <div className='container mx-auto my-12 bg-white p-8 rounded-lg shadow-md bg-gray-100' key={item.id}>
        <div className='my-4'>
        <h2 className='my-4 font-bold text-gray-600'>Google Verification:</h2> 
        <hr/>
        </div>
            <div className="whitespace-break-spaces"
                dangerouslySetInnerHTML={{ __html: item.plainText }}
            />
        </div>
        </>
        ))
        ) : (
            <div className='container mx-auto my-12 bg-white p-8 rounded-lg shadow-md bg-gray-100'>
            <div className='my-4'>
            <h2 className='my-4 font-bold text-gray-600'>Google Verification Steps:</h2> 
            <hr/>
            </div>
                <ol>
                    <li>Log into your google account.</li>
                    <li>Follow the link to Forwarding and POP/IMAP.</li>
                    <li>Click the Add a forwarding address button.</li>
                    <li>Enter your Citato forward email address and click next.</li>
                    <li>An email will be sent to your Citato forward email address address for verification. To view the email come back to this page.</li>
                    <li>Begin forwarding messages that match your filters – Follow instructions <Link href={'https://support.google.com/mail/answer/10957?hl=en}>https://support.google.com/mail/answer/10957?hl=en'} className='underline'>found here</Link></li>
                </ol>
            </div>
        )}
        </>
    );
}