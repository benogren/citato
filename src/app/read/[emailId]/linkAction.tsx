"use server";
import OpenAI from "openai";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { sanitizeEmailContent } from "@/components/sanitizemailcontent";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

export default async function linkAction(formData: FormData): Promise<void> {
    const content = formData.get("emailText")?.toString() || "";
    const emailId = formData.get("emailId")?.toString() || "";

    if (content && content.trim()) {
        const scrapedData = await sanitizeEmailContent([
            { id: emailId, htmlContent: content }
          ]);
        const toSummarize = JSON.stringify(scrapedData[0].extractedContent.paragraphs);

        //###Links to Read Later(pull out any interesting links from the article's content)
        
        //As OpenAI to summarize
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: "You will be provided newsletter content, and your task is to find interesting links from the article's content:\n    \n    ###Links to Read Later\n " 
                },
                {
                    role: "user",
                    content: toSummarize,
                },
            ],
        });
        const contentSummary = completion.choices[0].message.content;

        // console.log("AI Content Summary:", contentSummary);

        //Store in Supabase
        const supabase = await createClient();

        const { error } = await supabase
            .from('newsletter_emails')
            .update({ ai_links: contentSummary })
            .eq('id', emailId)
        
            if (error) {
                console.error("Supabase Update Error:", error);
                throw error;
            }

        redirect(`/read/${emailId}`);
    }
}