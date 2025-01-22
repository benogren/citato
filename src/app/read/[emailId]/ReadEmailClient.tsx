"use client";

import { useEffect, useState } from "react";

interface Post {
    id: string;
    from: string;
    to: string[];
    recipients: string[];
    helo_domain: string;
    subject: string;
    plainText: string;
    reply_plain: string;
    message_id: string;
    received: string;
    htmlContent: string;
    receivedDate: string;
    created_at: string;
    rawPayload: unknown;
    spf_result: string;
    spf_domain: string;
}


export default function ReadEmailClient({ posts }: { posts: Post[] }) {
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    if (!hydrated) return null; // Prevent rendering on the server

    return (
        <>
        {posts.map((post) => (
            <div key={post.id}>
                <div className=""
                    dangerouslySetInnerHTML={{ __html: post.htmlContent }}
                />
            </div> 
        ))}
        </>
    );
}