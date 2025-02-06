"use server";
import OpenAI from "openai";
import { createClient } from "@/utils/supabase/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

export default async function linkAction(content: string, emailId: string) {
    const emailContent = content;
    const emailid = emailId;

    console.log("Email ID:", emailid);

    const supabase = await createClient();
    const { data: checklinks, error } = await supabase
            .from('newsletter_emails')
            .select('ai_links')
            .eq('id', emailid)

            if (error) {
                console.error("Supabase Fetch Error:", error);
                throw error;
            }
    
    if (checklinks && checklinks[0].ai_links) {
        console.log("Links already found for this email");
    } else {
        console.log("Finding links for this email");

        if (emailContent) {
    
            //As OpenAI to summarize
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { 
                        role: "system", 
                        content: "You will be provided newsletter content in Base64, and your task is to find interesting links from the content and list them as markdown as follows,:\n###Links to Read Later(pull out any interesting links from the article's content)" 
                    },
                    {
                        role: "user",
                        content: emailContent,
                    },
                ],
            });
            const linkSummary = completion.choices[0].message.content;

            console.log("AI Content Summary:", linkSummary);

            //Store in Supabase
            const { error } = await supabase
                .from('newsletter_emails')
                .update({ ai_links: linkSummary })
                .eq('id', emailid)
            
                if (error) {
                    console.error("Supabase Update Error:", error);
                    throw error;
                }

            return linkSummary || "";
        }
    }
}