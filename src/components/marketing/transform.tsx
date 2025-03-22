'use client';

import Image from 'next/image';

export default function Transformation() {
  return (
    <div className="py-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Turn Information Overload into Clear Insights
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Imagine starting your day with a personalized feed of perfectly summarized content you care about. No more clicking through endless emails or feeling guilty about unread updates.
            </p>
            <div className="mt-8">
              <ul className="space-y-5">
                <li className="flex">
                  <svg className="flex-shrink-0 h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-600">Instant AI-powered summaries of subscribed content</span>
                </li>
                <li className="flex">
                  <svg className="flex-shrink-0 h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-600">A unified feed that's actually enjoyable to browse</span>
                </li>
                <li className="flex">
                  <svg className="flex-shrink-0 h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-600">Key takeaways that help you decide what's worth your full attention</span>
                </li>
                <li className="flex">
                  <svg className="flex-shrink-0 h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-600">A clutter-free inbox without sacrificing valuable content</span>
                </li>
              </ul>
            </div>
            <p className="mt-6 text-lg text-gray-600">
              Best of all? You'll finally feel in control of your information diet, confident that you're not missing anything important while saving hours each week.
            </p>
          </div>
          <div className="mt-10 lg:mt-0 relative mx-auto">
            <div className="bg-gray-900 rounded-xl p-8 shadow-lg transform hover:-translate-y-1 transition-transform duration-300 w-[314px]">
              <div className="relative rounded-lg overflow-hidden h-[550px] w-[254px]">
                <Image 
                  src="/home-hero.gif" 
                  alt="citato.ai feed preview" 
                  width={254} 
                  height={550}
                  className="w-full object-cover rounded-lg" 
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}