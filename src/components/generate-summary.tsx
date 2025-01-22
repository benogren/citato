import OpenAI from "openai";

export default async function GenerateSummary(itemText: string) {
    const openai = new OpenAI();
    // console.log('Gonna AI:', itemText);

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { 
                role: "system", 
                content: "Summarize content you are provided as follows:\n    \n    -Overall summary\n    -Key takeaways" 
            },
            {
                role: "user",
                content: itemText,
            },
        ],
    });

    console.log(completion.choices[0].message);

    return completion.choices[0].message.content;
}