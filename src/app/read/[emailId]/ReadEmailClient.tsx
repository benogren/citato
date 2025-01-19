"use client";

import ReactTimeago from "react-timeago";
import { useEffect, useState } from "react";

interface Post {
    id: string;
    subject: string;
    receivedDate: string; // Use `Date` if you parse this earlier
    htmlContent: string;
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
                            <h2 className="font-bold border-b-2 border-gray-200 text-gray-500">More:</h2>
                            <div className="m-4">
                                <h3 className="truncate">{post.subject}</h3>
                            </div>
                        </div>
                        <div className="flex flex-col grow">
                            <h1 className="text-gray-700 text-2xl">{post.subject}</h1>
                            <h2 className="text-gray-500 text-sm">
                                <ReactTimeago date={new Date(post.receivedDate)} />
                            </h2>
                            <div
                                className="mt-10 shadow-md text-wrap whitespace-normal text-sm"
                                dangerouslySetInnerHTML={{ __html: post.htmlContent }}
                            />
                        </div>
                        <div className="flex flex-col w-1/4 m-4">
                            AI side
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
}