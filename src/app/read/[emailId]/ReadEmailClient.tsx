"use client";

import ReactTimeago from "react-timeago";
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
                    <div className="flex flex-row">
                        <div className="flex flex-col w-1/4 m-4">
                            <h2 className="font-bold border-b-2 border-gray-200 text-gray-500 text-base">More:</h2>
                            <div className="m-4">
                                <h3 className="truncate text-left text-sm font-normal">{post.subject}</h3>
                            </div>
                            <div className="m-4">
                                <h3 className="truncate text-left text-sm font-normal">{post.subject}</h3>
                            </div>
                            <div className="m-4">
                                <h3 className="truncate text-left text-sm font-normal">{post.subject}</h3>
                            </div>
                        </div>
                        <div className="flex flex-col grow">
                            <h1 className="text-gray-700 text-2xl text-left font-bold">{post.subject}</h1>
                            <h2 className="text-gray-500 text-sm font-normal">
                                <ReactTimeago date={new Date(post.created_at)} />{' '}&middot;{' '}{post.to}
                            </h2>
                            <div
                                className="mt-10 shadow-md text-wrap whitespace-normal text-sm"
                                dangerouslySetInnerHTML={{ __html: post.htmlContent }}
                            />
                        </div>
                        <div className="flex flex-col w-1/4 m-4">
                            <h2 className="font-bold border-b-2 border-gray-200 text-gray-500 text-base">Chat:</h2>
                            <div className="text-xs whitespace-normal truncate">
                                <pre>{JSON.stringify(post, null, 2)}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
}