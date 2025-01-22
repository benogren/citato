import { NextResponse } from "next/server";
import OpenAI from "openai";
import { cookies } from "next/headers";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
    const request = await req.json();
    const isAuth = (await cookies()).get("supabase-auth-token");

    if (!isAuth) {
        // return NextResponse.json({
        //     message: "Not Authorized!"
        // },{status:403});
    }

    if (!request?.text) {
        return NextResponse.json({
            message: "Invalid"
        }, {status: 422});
    }

    try {
        console.log(request);

        const result = await openai.embeddings.create({
            input:request.text,
            model:"text-embedding-3-large", 
        });

        const embedding = result.data[0].embedding;
        const token = result.usage.total_tokens;

        return NextResponse.json({
            token,
            embedding,
        });
    } catch {
        return  NextResponse.json({
            message: "Something went wrong"
        }, {status:400});
    }
}