'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Hero() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Use useEffect to handle the "async" portion after state changes
  useEffect(() => {
    // Only run this effect when isSubmitting becomes true
    if (isSubmitting) {
      const timer = setTimeout(() => {
        // Simulate API completion
        setIsSubmitted(true);
        setIsSubmitting(false);
        setEmail('');
      }, 800);
      
      // Clean up the timer
      return () => clearTimeout(timer);
    }
  }, [isSubmitting]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Validate email
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Set submitting state - the useEffect above will handle the "async" part
    setIsSubmitting(true);
  };

  return (
    <div className="relative pt-24 pb-16 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6">
            <div className="mt-20 lg:mt-24">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Never Miss What</span>
                <span className="block bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Matters to You</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Your AI-powered reading companion that transforms content overload into organized, actionable insights
              </p>
              <div className="mt-8 sm:mt-10">
                {!isSubmitted ? (
                  <form onSubmit={handleSubmit} className="sm:mx-auto sm:max-w-xl lg:mx-0">
                    <div className="sm:flex">
                      <div className="min-w-0 flex-1">
                        <label htmlFor="email" className="sr-only">Email address</label>
                        <input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full px-4 py-3 rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="mt-3 sm:mt-0 sm:ml-3">
                        <button
                          type="submit"
                          className={`block w-full py-3 px-4 rounded-md shadow bg-purple-600 text-white font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:text-sm ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                        </button>
                      </div>
                    </div>
                    {error && (
                      <p className="mt-2 text-sm text-red-600">{error}</p>
                    )}
                    <p className="mt-3 text-sm text-gray-500">
                      Be the first to know when we launch. We'll let you know as soon as spots are available.
                    </p>
                  </form>
                ) : (
                  <div className="sm:mx-auto sm:max-w-xl lg:mx-0 p-6 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center">
                      <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <h3 className="ml-2 text-lg font-medium text-green-800">You're on the list!</h3>
                    </div>
                    <p className="mt-2 text-sm text-green-700">
                      Thanks for joining our waitlist. We'll notify you when citato.ai launches.
                    </p>
                  </div>
                )}
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