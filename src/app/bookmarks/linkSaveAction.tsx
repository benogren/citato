"use server";
import { redirect } from "next/navigation";
import FirecrawlApp from '@mendable/firecrawl-js';
import OpenAI from "openai";
import { createClient } from "@/utils/supabase/server";

export default async function linkSaveAction(formData: FormData): Promise<void> {
    const url = formData.get('bookmark') as string;
    const user_id = formData.get('user_id') as string;

    const supabase = await createClient();

    const {
        data: { user },
      } = await supabase.auth.getUser();

    console.log("Saving Bookmark for User:", user?.id);

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    // Scraping the URL with Firecrawl
    const crawlKey = process.env.FC_YOUR_API_KEY as string
    const app = new FirecrawlApp({apiKey: crawlKey});

    const scrapeResponse = await app.scrapeUrl(url, {
        formats: ['markdown', 'html', 'links'],
    });
    
    if (!scrapeResponse.success) {
        throw new Error(`Failed to scrape: ${scrapeResponse.error}`)
    }

    const markdown = scrapeResponse.markdown;
    const html = scrapeResponse.html;
    const links = scrapeResponse.links;
    const title = scrapeResponse.metadata?.title || null;
    const author = scrapeResponse.metadata?.author || null;

    // console.log(`URL`, url);
    // console.log(`Title`, title);
    // console.log(`Author`, author);
    // console.log(`*Markdown`, markdown);
    // console.log(`**HTML`, html);
    // console.log(`***Links`, links);
    // console.log(`****Scrape Response`, scrapeResponse);

    //Create summary from OpenAI
    let contentSummary = null;

    if (!markdown) {
        throw new Error(`No markdown found for URL: ${url}`);
    } else {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: "You will be provided website content in markdown, and your task is to provide a short summary paragraph (2 to 3 sentences) of the content matching the tone and voice of the content's original author" 
                },
                {
                    role: "user",
                    content: markdown,
                },
            ],
        });
        contentSummary = completion.choices[0].message.content;
    }
    // console.log(`Content Summary`, contentSummary);

    // Create embeddings from OpenAI
    const contentEmbedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: markdown,
        encoding_format: "float",
    });
    
    const savedEmbedding = contentEmbedding.data[0].embedding;

    //console.log(`Content Embedding`, savedEmbedding);

    // Save to Supabase
    const linkData = {
        url: url,
        title: title,
        author: author,
        markdown: markdown,
        html: html,
        links: links,
        ai_summary: contentSummary,
        embeddings: savedEmbedding,
        user_id: user_id,
    }
    try {
        const { data, error } = await supabase
            .from('bookmarks')
            .insert(linkData);
        
        console.log('Link saved to supabase', data);

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error saving email:', error);
        throw error;
    }



    redirect(`/bookmarks`);
}