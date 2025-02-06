import Header from '../../../components/header';
import FetchEmail from './fetchEmail';

export type paramsType = Promise<{ emailId: string }>;

export default async function ReadEmailPage(props: { params: paramsType }) {
    const { emailId } = await props.params;

    return (
        <>
        <Header />
        <FetchEmail emailId={emailId} />
        </>
    );
}