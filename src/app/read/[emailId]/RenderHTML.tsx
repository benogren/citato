"use client";

import React, { useEffect, useRef } from "react";

export default function RenderHTML({ htmlContent }: { htmlContent: string }) {
    const shadowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (shadowRef.current) {
            let shadowRoot = shadowRef.current.shadowRoot;
            if (!shadowRoot) {
                // Attach the shadow root only if it doesn't already exist
                shadowRoot = shadowRef.current.attachShadow({ mode: "open" });
            }
            // Clear the content of the shadow root and append the new HTML content
            shadowRoot.innerHTML = ""; // Clear existing content
            const container = document.createElement("div");
            container.innerHTML = htmlContent;
            shadowRoot.appendChild(container);
        }
    }, [htmlContent]);

    return <div ref={shadowRef} />;
}
