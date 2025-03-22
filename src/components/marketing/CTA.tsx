'use client';

import Script from 'next/script';

export default function CTA() {
  return (
    <div id="cta" className="bg-gradient-to-bl from-indigo-800 to-purple-600">
      {/* Add the LaunchList embed widget script using Next.js Script component */}
      <Script
        src="https://getlaunchlist.com/js/widget.js"
        strategy="afterInteractive"
      />
      
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Be First to Experience</span>
            <span className="block">The Future of Content Consumption</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-purple-200">
            Join our exclusive waitlist and be notified as soon as citato.ai launches
          </p>
        </div>

        <div className="mt-10 max-w-xl mx-auto">
          {/* Embed Widget Implementation */}
          <div 
            className="launchlist-widget mb-0 pb-0" 
            data-key-id="4Al8cQ" // Replace YOUR_FORM_KEY with your actual key
            data-height="80px">
          </div>
          
          <p className="text-sm text-purple-200 text-center">
            No spam. We&#39;ll only send you citato.ai launch updates.
          </p>
        </div>
      </div>
    </div>
  );
}