interface FetchLinkListProps {
    links: string[];
}

export default function LinkList({ links = [] }: FetchLinkListProps) {
    // Ensure we're working with an array
    const safeLinks = Array.isArray(links) ? links : [];
    
    return (
        <>
        {safeLinks.map((link, index) => (
            <div key={index} className="flex flex-row items-center">
                <div className="text-blue-500 underline">{link}</div>
            </div>
        ))}
        </>
    );
}