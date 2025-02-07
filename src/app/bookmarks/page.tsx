import Header from "@/components/header";
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/submit-button';

export default async function BookMarkPage() {
    return(
        <>
        <Header />
        <div className="bg-gray-100">
            <div className="w-1/2 mx-auto">
                <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16">
                <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 lg:px-48 dark:text-gray-400">
                    Save a bookmark
                </p>
                <form className="flex gap-2 items-center">
          <Input
            className="bg-white text-gray-900 py-2 px-4 rounded-md w-full"
            value=""
            placeholder="https://your-link.com"
            name="bookmark"
          />
          <SubmitButton
            pendingText="Generating..."
            formAction=""
            className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
          >
            Save
          </SubmitButton>
        </form>
                </div>
            </div>
        </div>
        <div className="flex flex-row">
            <div className="container mx-auto">
                sdiflskdhf
            </div>
        </div>
        </>
    );
}