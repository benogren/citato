"use server";
import OpenAI from "openai";
import { createClient } from '@supabase/supabase-js';
import { redirect } from "next/navigation";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

export default async function summeryAction(formData: FormData): Promise<void> {
    const content = formData.get("emailText")?.toString();
    const emailId = formData.get("emailId")?.toString();
    const contentBody = JSON.stringify({ text: content });

    if (content && content.trim()) {
        //console.log("to be embedded: ",contentBody);
        
        //As OpenAI to summarize
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: "You will be provided newsletter content, and your task is to summarize the content, matching the style of the content's original author as follows:\n    \n    -Summary\n    -Key Takeaways\n " 
                },
                {
                    role: "user",
                    content: contentBody,
                },
            ],
        });
        const contentSummary = completion.choices[0].message.content;

        //Store in Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL as string, 
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
        );
        await supabase
            .from('emails')
            .update({ ai_summary: contentSummary })
            .eq('id', emailId);

        // console.log("for email:", emailId, "Content:", contentSummary);
        redirect(`/read/${emailId}`);
    }
}