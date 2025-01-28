"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { TECarousel, TECarouselItem } from "tw-elements-react";
import "tw-elements-react/dist/css/tw-elements-react.min.css";
import { createClient } from "@supabase/supabase-js";
import roundupAction from "./roundupAction";
import { faFrownOpen } from "@fortawesome/free-regular-svg-icons"; 
import { faMagicWandSparkles } from "@fortawesome/free-solid-svg-icons"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TextToSpeech from '@/components/text-to-speech';

// Define the type for the roundup items
type RoundupItem = {
    id: string;
    htmlContent: string;
    roundup_summary?: string | null; // Allow null values
    subject?: string;
    newsletter_senders: {
        name: string;
        id: string;
    };
};

async function fetchToday(pageUserId: string): Promise<RoundupItem[] | null> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const googleTeam = "09524579-5fbf-451b-8499-2d011b8e1536";
    const today: Date = new Date();
    const startOfDay = new Date(today);
    const endOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
        .from("emails")
        .select("*, newsletter_senders(name, id)")
        .eq("userID", pageUserId)
        .gte("created_at", startOfDay.toISOString())
        .lt("created_at", endOfDay.toISOString())
        .not("sender_id", "eq", googleTeam);

    if (error) {
        console.error("Error fetching emails:", error);
        return null;
    }

    return data as RoundupItem[];
}

export default function RoundUp({ pageUserId }: { pageUserId: string }) {
    const [todaysroundup, setTodaysRoundup] = useState<RoundupItem[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await fetchToday(pageUserId);

            if (data && Array.isArray(data)) {
                const updatedData = await Promise.all(
                    data.map(async (item) => {
                        if (!item?.roundup_summary) {
                            const contentSummary = await roundupAction(
                                { emailID: item.id },
                                { htmlContent: item.htmlContent }
                            );
                            return { ...item, roundup_summary: contentSummary };
                        }
                        return item;
                    })
                );
                setTodaysRoundup(updatedData);
            }

            setLoading(false);
        };

        fetchData();
    }, [pageUserId]);

  
    if (loading) {
      return (
        <div className="text-center">
            <span className="*:text-4xl"><FontAwesomeIcon icon={faMagicWandSparkles} className="text-gray-400 text-4xl animate-pulse"/></span>
            <p className="py-4 text-gray-500 animate-pulse">Hold tight. We&#39;re working on your roundup...</p>
            <div className="mx-auto w-full rounded-md p-4">
                <div className="flex animate-pulse space-x-4">
                    <div className="flex-1 space-y-6 py-1">
                        <div className="h-2 rounded bg-gray-200"></div>
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2 h-2 rounded bg-gray-200"></div>
                                <div className="col-span-1 h-2 rounded bg-gray-200"></div>
                            </div>
                            <div className="h-2 rounded bg-gray-200"></div>
                        </div>
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1 h-2 rounded bg-gray-200"></div>
                                <div className="col-span-2 h-2 rounded bg-gray-200"></div>
                            </div>
                            <div className="h-2 rounded bg-gray-200"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )
    }
  
    if (!todaysroundup || todaysroundup.length === 0) {
      return (
        <div className="text-center">
            <FontAwesomeIcon icon={faFrownOpen} className="text-gray-300 text-4xl"/>
            <p className="py-4 text-gray-500">Sorry, there&#39;s no roundup today.<br/>This is likely because we havent recevied any newsletters for you today.<br/><br/> Please check back tomorrow!</p>
        </div>
      )
    }
  
    return (
      <TECarousel showControls showIndicators ride="carousel" interval={30000}>
        <div className="relative w-full overflow-hidden after:clear-both after:block after:content-['']">
          {todaysroundup.map((item, index) => (
            <TECarouselItem
              key={index}
              itemID={index + 1}
              className="relative float-left -mr-[100%] hidden w-full transition-transform duration-[600ms] ease-in-out motion-reduce:transition-none h-[35rem]"
            >
              <img
                src="https://images.unsplash.com/photo-1650954316234-5d7160b24eed?q=80&w=1527&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" // Replace with your actual image source
                className="block w-full"
                alt={item.newsletter_senders?.name || "Newsletter"}
              />
              <div className="absolute inset-x-[15%] bottom-5 hidden py-5 text-white md:block">
                <h5 className="text-xl font-medium">{item.subject || "No subject"}</h5>
                <h6 className="text-xs pb-4">
                  <Link href={`/newsletter/${item.newsletter_senders.id}`}>
                    {item.newsletter_senders.name || "no name"}
                  </Link>
                </h6>
                <p className="pb-6 text-sm">{item.roundup_summary || "No content available"}</p>
                <div className="pb-6 flex gap-2">
                    <Link
                    href={`/read/${item.id}`}
                    className="text-white py-2 px-4 border rounded-md"
                    >
                    Read More
                    </Link>
                    <TextToSpeech textValue={item.roundup_summary || ""}/>
                </div>
              </div>
            </TECarouselItem>
          ))}
        </div>
      </TECarousel>
    );
  }
  