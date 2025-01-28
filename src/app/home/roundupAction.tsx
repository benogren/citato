"use server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { scrapeEmailContent } from "../read/[emailId]/emailScraper";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function roundupAction(
  { emailID }: { emailID: string },
  { htmlContent }: { htmlContent: string }
): Promise<string | null> {
  const content = htmlContent;
  const emailId = emailID?.toString();

  if (content && content.trim()) {
    const scrapedData = await scrapeEmailContent([
      { id: emailId, htmlContent: content } // Include 'id' here
    ]);

    const toSummarize = JSON.stringify(scrapedData[0].extractedContent.paragraphs);

    // Use OpenAI to summarize
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You will be provided newsletter content, and your task is to summarize the content in a short paragraph",
        },
        {
          role: "user",
          content: toSummarize,
        },
      ],
    });

    const contentSummary = completion.choices[0].message.content;

    // Store in Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );

    await supabase
      .from("emails")
      .update({ roundup_summary: contentSummary })
      .eq("id", emailId);

    return contentSummary; // Return the summary
  }

  return null; // Return null if no valid content
}