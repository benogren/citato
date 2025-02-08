import Header from "@/components/header";
import FetchLink from "./fetchLink";

export type paramsType = Promise<{ linkId: string }>;

export default async function ReadLinkPage(props: { params: paramsType }) {
    const { linkId } = await props.params;

    return (
        <>
        <Header />
        <FetchLink linkId={linkId} />
        </>
    );
}