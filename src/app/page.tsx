import { metadata } from './layout';
import AuthButton from '@/components/header-auth';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagicWandSparkles, faBookmark, faRectangleList, faBolt } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import Image from 'next/image';

export default async function Home() {

  return (
    <>
    {/* <div className="container mx-auto mt-48 text-center">
      <h1 className="title text-2xl">
        {JSON.parse(JSON.stringify(metadata.title))}
      </h1>
      <p className="text-gray-500 text-lg">
        {JSON.parse(JSON.stringify(metadata.description))}
      </p>
        <>
        <nav className="flex gap-2 justify-center py-10">
          <AuthButton></AuthButton>
        </nav>
        </>
    </div> */}
    <div className="flex gap-2 w-full bg-gradient-to-bl from-violet-600 to-indigo-800">
      <div className='xl:w-1/2 lg:w-1/2 md:w-1/2 mx-auto text-center'>
        <div className="py-16 mx-auto">
          <p className='font-bold text-xl text-gray-100 mb-4'>{JSON.parse(JSON.stringify(metadata.title))}</p>
          <h1 className="text-4xl mb-4 text-white">
            Never Miss What Matters in Your Newsletters
          </h1>
          <h2 className="text-2xl text-gray-200">
            Citato, your AI-powered reading companion that transforms newsletter overload into organized, actionable insights.
          </h2>
          <nav className="flex gap-2 justify-center pt-10 text-white">
            <AuthButton></AuthButton>
          </nav>
        </div>
      </div>
    </div>
    <div className="flex gap-2 w-full">
      <div className='lg:w-2/3 mx-auto flex gap-2 items-center'>
        <div className="w-1/2 py-16 pr-4 rounded-lg drop-shadow-md">
          <Image  src="/gmail.png" alt="gmail" className="rounded-lg mx-auto" width={295} height={295} />
        </div>
        <div className="w-1/2 py-16 pl-4">
        <h2 className="text-2xl bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Stop Drowning in Newsletter Overload</h2>
        <p className="text-gray-500 text-lg">
          Every morning, it&#39;s the same story. Your inbox fills with newsletters you want to read, but finding time to process them all feels impossible.
        </p>
        </div>
      </div>
    </div>
    <div className="flex gap-2 w-full bg-gray-100">
      <div className='lg:w-2/3 mx-auto flex gap-2 items-center'>
        <div className="w-1/2 py-16 pr-4">
        <h2 className="text-2xl bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Turn Information Overload into Clear Insights</h2>
        <p className="text-gray-500 text-lg">
        Imagine starting your day with a personalized feed of perfectly summarized newsletters. No more clicking through endless emails or feeling guilty about unread content.
        </p>
        </div>
        <div className="w-1/2 py-16 pr-4 rounded-lg drop-shadow-md">
          <Image  src="/citato.png" alt="gmail" className="rounded-lg mx-auto" width={295} height={295} />
        </div>
      </div>
    </div>
    {/* <div className="flex gap-2 w-full">
      <div className='lg:w-2/3 mx-auto items-center py-16'>
        <h3 className="text-gray-500 text-lg text-center">
        With citato.ai, you get:
        </h3>
        <div className='flex gap-4 w-full justify-center py-8 text-center'>
          <span className="text-gray-500 text-sm w-1/3">
          <FontAwesomeIcon icon={faArchive} className="text-gray-400 size-8 mx-auto mb-4" />
          Instant AI-powered summaries of every newsletter
          </span>
          <span className="text-gray-500 text-sm w-1/3">
          <FontAwesomeIcon icon={faArchive} className="text-gray-400 size-8 mx-auto mb-4" />
          A unified feed that's actually enjoyable to browse
          </span>
          <span className="text-gray-500 text-sm w-1/3">
          <FontAwesomeIcon icon={faArchive} className="text-gray-400 size-8 mx-auto mb-4" />
          Key takeaways that help you decide what's worth your full attention
          </span>
        </div>
        <p className="text-gray-500 text-md text-center">
          <i>Control of your information diet and confidence that you're not missing anything important.</i>
        </p>
      </div>
    </div> */}
    <div className="flex gap-2 w-full">
      <div className='lg:w-2/3 mx-auto items-center py-8'>
        <h2 className="text-3xl bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent text-center">
        Everything You Need to Stay Informed, Not Overwhelmed
        </h2>
      </div>
    </div>
    <div className="flex gap-2 w-full">
      <div className='lg:w-2/3 mx-auto flex gap-2 items-center'>
        <div className="w-1/4 pr-4">
          <FontAwesomeIcon  icon={faGoogle} className="text-indigo-400 size-16 mx-auto mb-4" />
        </div>
        <div className="py-8 pl-4">
        <h2 className="text-2xl text-gray-500">Seamless Gmail Integration</h2>
        <p className="text-gray-500 text-lg">
          Connect once and let citato.ai automatically process your newsletters. No manual copying, no switching between apps. Your newsletters are instantly organized and summarized.
        </p>
        </div>
      </div>
    </div>
    <div className="flex gap-2 w-full">
      <div className='lg:w-2/3 mx-auto flex gap-2 items-center'>
        <div className="w-1/4 pr-4">
        <FontAwesomeIcon  icon={faMagicWandSparkles} className="text-indigo-400 size-16 mx-auto mb-4" />
        </div>
        <div className="py-8 pl-4">
        <h2 className="text-2xl text-gray-500">Smart AI Summaries</h2>
        <p className="text-gray-500 text-lg">
        Get the gist of any newsletter in seconds. Our AI analyzes each newsletter and extracts the most important points, helping you quickly decide if you want to dive deeper.
        </p>
        </div>
      </div>
    </div>
    <div className="flex gap-2 w-full">
      <div className='lg:w-2/3 mx-auto flex gap-2 items-center'>
        <div className="w-1/4 pr-4">
        <FontAwesomeIcon  icon={faBookmark} className="text-indigo-400 size-16 mx-auto mb-4" />
        </div>
        <div className="py-8 pl-4">
        <h2 className="text-2xl text-gray-500">Bookmarks with Intelligence</h2>
        <p className="text-gray-500 text-lg">
          Save any article for later and get instant AI-powered summaries. Finally, a bookmark system that helps you remember why you saved something in the first place.
        </p>
        </div>
      </div>
    </div>
    <div className="flex gap-2 w-full">
      <div className='lg:w-2/3 mx-auto flex gap-2 items-center'>
        <div className="w-1/4 pr-4">
        <FontAwesomeIcon  icon={faRectangleList} className="text-indigo-400 size-16 mx-auto mb-4" />
        </div>
        <div className="py-8 pl-4">
        <h2 className="text-2xl text-gray-500">Your Content Feed</h2>
        <p className="text-gray-500 text-lg">
        Browse all your newsletters and saved bookmarks in one beautiful, distraction-free interface. Filter, sort, and search across all your content effortlessly.
        </p>
        </div>
      </div>
    </div>
    <div className="flex gap-2 w-full">
      <div className='lg:w-2/3 mx-auto flex gap-2 items-center'>
        <div className="w-1/4 pr-4">
        <FontAwesomeIcon  icon={faBolt} className="text-indigo-400 size-16 mx-auto mb-4" />
        </div>
        <div className="py-8 pl-4">
        <h2 className="text-2xl text-gray-500">Key Takeaways & Smart Links</h2>
        <p className="text-gray-500 text-lg">
        When you decide to read the full content, citato.ai generates concise takeaways and highlights important links, making it easy to retain and share key insights.
        </p>
        </div>
      </div>
    </div>
    </>
  );
}
