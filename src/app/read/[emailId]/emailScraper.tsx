import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// Define the type for email data items
type EmailDataItem = {
    id: string;
    htmlContent: string;
};

// Sanitize HTML
export function sanitizeHTML(rawHTML: string): string {
    const window = new JSDOM("").window;
    const purifier = DOMPurify(window);
    return purifier.sanitize(rawHTML);
}

// Scrape email content
export async function scrapeEmailContent(emailData: EmailDataItem[]) {
    return emailData.map((item) => {
        const sanitizedHTML = sanitizeHTML(item.htmlContent);
        const dom = new JSDOM(sanitizedHTML);
        const document = dom.window.document;

        const paragraphs = Array.from(document.querySelectorAll("h1, h2, h3, p, li")).map(
            (el) => el.textContent || ""
        );
        const links = Array.from(document.querySelectorAll("a")).map((el) => el.href);

        return {
            id: item.id,
            sanitizedHTML,
            extractedContent: {
                paragraphs,
                links,
            },
        };
    });
}