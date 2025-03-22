'use client';

import Script from 'next/script';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

export default function Hero() {
  // Reference to the form element
  const formRef = useRef(null);

  // Effect to initialize the LaunchList form after it's loaded
  useEffect(() => {
    // This will run after the LaunchList script has loaded
    // and the form element is in the DOM
    if (window.LaunchListDiy && formRef.current) {
      // If there's any initialization needed, it would go here
      // Most of the time, LaunchList's script handles this automatically
    }
  }, []);

  return (
    <div className="relative pt-24 pb-16 overflow-hidden bg-white">
      {/* Add the LaunchList script using Next.js Script component */}
      <Script
        src="https://getlaunchlist.com/js/widget-diy.js"
        strategy="afterInteractive"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6">
            <div className="mt-20 lg:mt-24">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Never Miss What</span>
                <span className="block text-purple-600">Matters to You</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Your AI-powered reading companion that transforms content overload into organized, actionable insights
              </p>
              <div className="mt-8 sm:mt-10">
                {/* Custom Form Implementation */}
                <form
                  ref={formRef}
                  className="launchlist-form sm:mx-auto sm:max-w-xl lg:mx-0"
                  action="https://getlaunchlist.com/s/4Al8cQ" // Replace YOUR_FORM_KEY with your actual key
                  method="POST">
                  <div className="sm:flex">
                    <div className="min-w-0 flex-1">
                      <label htmlFor="email" className="sr-only">Email address</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        className="block w-full px-4 py-3 rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-3">
                      <button
                        type="submit"
                        className="block w-full py-3 px-4 rounded-md shadow bg-purple-600 text-white font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:text-sm"
                      >
                        Join Waitlist
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-500">
                    Be the first to know when we launch. We&#39;ll let you know as soon as spots are available.
                  </p>
                </form>
              </div>
            </div>
          </div>
          <div className="mt-12 lg:mt-0 lg:col-span-6 relative">
            <div className="absolute right-5">
              <div className="overflow-hidden">
                <Image 
                  src="/hero-image.png" 
                  alt="citato.ai dashboard preview" 
                  width={400} 
                  height={640}
                  className="w-full object-cover" 
                  // placeholder="blur"
                  // blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}