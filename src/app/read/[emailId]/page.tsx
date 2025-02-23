import Header from '../../../components/header';
import FetchEmail from './fetchEmail';
import FetchAI from './fetchAI';
// import FetchLinks from './fetchLinks';

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
                    <div className="flex flex-col m-8 pl-8">
                    <FetchAI emailId={emailId} />

                    {/* <FetchLinks emailId={emailId} /> */}

                    <p className='text-xs text-gray-400 pt-4'>
                        Summary and links are generated using AI, and may have mistakes.<br/>Please double-check responses.
                    </p>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}