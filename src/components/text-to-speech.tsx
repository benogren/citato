"use client";

import React, { useState } from "react";

interface TextToSpeechProps {
    textValue: string;
}

const TextToSpeech: React.FC<TextToSpeechProps> = ({ textValue }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState("pNInz6obpgDQGcFmaJgB");
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    const [error, setError] = useState<string | null>(null);

    const voices = [
        { id: "pNInz6obpgDQGcFmaJgB", name: "Adam" },
        { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
    ];

    const text = textValue || ""; // Ensure `text` is always a string

    const handleGenerateAudio = async () => {
        if (!text.trim()) return; // Safely call trim on `text`

        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch("../api/text-to-speech", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text,
                    voice: selectedVoice,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate audio");
            }

            // Create and play audio
            const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
            setAudioElement(audio);

            audio.onended = () => setIsPlaying(false);
            audio.play();
            setIsPlaying(true);

        } catch (error: unknown) {
            console.error("Error generating audio:", error);

            // Narrow down the type of error
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Failed to generate audio, please try again.");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePlayPause = () => {
        if (!audioElement) return;

        if (isPlaying) {
            audioElement.pause();
        } else {
            audioElement.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Select Voice</label>
                    <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="w-full p-2 border rounded-md"
                    >
                        {voices.map((voice) => (
                            <option key={voice.id} value={voice.id}>
                                {voice.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Text</label>
                </div>

                {error && <div className="text-red-500">{error}</div>}

                <div className="flex gap-2">
                    <button
                        onClick={handleGenerateAudio}
                        disabled={isGenerating || !text.trim()}
                        className={`flex-1 px-4 py-2 rounded-md text-white ${
                            isGenerating || !text.trim()
                                ? "bg-gray-400"
                                : "bg-blue-500 hover:bg-blue-600"
                        }`}
                    >
                        {isGenerating ? "Generating..." : "Generate Audio"}
                    </button>

                    {audioElement && (
                        <button
                            onClick={handlePlayPause}
                            className="px-4 pt-2 border rounded-md hover:bg-gray-100"
                        >
                            {isPlaying ? "Pause" : "Play"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TextToSpeech;