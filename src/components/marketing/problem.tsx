'use client';

export default function Problem() {
  return (
    <div id="problem" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Stop Drowning in Content Overload
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Every day, your inbox fills with interesting content you&#39;ve subscribed to. Articles, updates, and insights from sources you care about pile up faster than you can process them. You&#39;re left with two bad choices:
          </p>
          <div className="mt-8">
            <ul className="space-y-4 mx-auto max-w-md">
              <li className="flex">
                <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="ml-2 text-gray-600">Mass delete everything (and miss valuable insights)</span>
              </li>
              <li className="flex">
                <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="ml-2 text-gray-600">Let them pile up (and watch your inbox spiral out of control)</span>
              </li>
            </ul>
          </div>
          <p className="mt-6 text-lg text-gray-600">
            The worst part? You&#39;ve subscribed to this content because it matters to your work and interests. But without a better way to manage it all, your information diet has become a source of stress rather than value.
          </p>
        </div>
      </div>
    </div>
  );
}