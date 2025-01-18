import Link from 'next/link';
import { CopyIcon } from '@radix-ui/react-icons';
import { DataList, Badge, Flex, IconButton, Code } from '@radix-ui/themes';
import Header from '../../components/header';
import { createClient } from "@/utils/supabase/server";

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user }, } = await supabase.auth.getUser();

    return (
        <>
        <Header />
        <div className='container mx-auto my-12 bg-white p-8 rounded-lg shadow-md'>
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
                            <IconButton
                                size="1"
                                aria-label="Copy value"
                                color="gray"
                                variant="ghost"
                            >
                                <CopyIcon />
                            </IconButton>
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
                                {/* {findUser && (
                                    findUser.emailSlug + '@subs.citato.ai'
                                )} */}
                            </Code>
                            <IconButton
                                size="1"
                                aria-label="Copy value"
                                color="gray"
                                variant="ghost"
                            >
                                <CopyIcon />
                            </IconButton>
                        </Flex>
                    </DataList.Value>
                </DataList.Item>
            </DataList.Root>
        </div>
        </>
    );
}