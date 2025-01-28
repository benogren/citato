import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
            console.error("Elevenlabs API Key is not configured");
            return NextResponse.json(
                { error: "No API key!" },
                { status: 500 }
            );
        }

        const { text, voice } = await req.json();

        if (!text || !voice) {
            return NextResponse.json(
                { error: "missing text and voice" },
                { status: 400 }
            );
        }

        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
            {
                method: "POST",
                headers: {
                    Accept: "audio/mpeg",
                    "Content-Type": "application/json",
                    "xi-api-key": apiKey,
                },
                body: JSON.stringify({
                    text,
                    model_id: "eleven_multilingual_v2",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API error response:", errorData);
            const errorMessage =
                errorData.detail?.message || "Failed to generate speech";
            return NextResponse.json(
                { error: errorMessage },
                { status: response.status }
            );
        }

        const audioBuffer = await response.arrayBuffer();
        const audioBase64 = Buffer.from(audioBuffer).toString("base64");

        return NextResponse.json({ audio: audioBase64 });
    } catch (error) {
        console.error("Text to speech generation error:", error);

        const errorMessage =
            error instanceof Error
                ? error.message
                : "An unknown error occurred";

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}