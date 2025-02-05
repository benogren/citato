import { parse } from "node-html-parser";

type EmailDataItem = {
    id: string;
    htmlContent: string;
};

export async function sanitizeEmailContent(emailData: EmailDataItem[]) {
    return emailData.map((item) => {
        const root = parse(item.htmlContent);
        
        const paragraphs = root.querySelectorAll("h1, h2, h3, p, li")
            .map(el => el.text.trim())
            .filter(text => text.length > 0);
            
        const links = root.querySelectorAll("a")
            .map(el => el.getAttribute("href"))
            .filter(Boolean);

        return {
            id: item.id,
            sanitizedHTML: root.toString(),
            extractedContent: {
                paragraphs,
                links,
            },
        };
    });
}