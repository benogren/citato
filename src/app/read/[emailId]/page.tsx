import Header from '../../../components/header';
import FetchEmail from './fetchEmail';
import FetchAI from './fetchAI';

export type paramsType = Promise<{ emailId: string }>;

export default async function ReadEmailPage(props: { params: paramsType }) {
    const { emailId } = await props.params;

    return (
        <>
        <Header />
        <div className="bg-gray-100">
            <div className="container mx-auto">
                <div className="flex flex-row">
                    <div className="flex flex-col">
                        <div className="bg-white shadow-lg rounded-md my-8 w-[674px] p-2">
                            <FetchEmail emailId={emailId} />
                        </div>
                    </div>
                    <FetchAI emailId={emailId} />
                </div>
            </div>
        </div>
        </>
    );
}