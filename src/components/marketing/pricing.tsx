'use client';

import { useState, useEffect } from 'react';

export default function Pricing() {
  const [annual, setAnnual] = useState(true);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Handle "async" operations with useEffect
  useEffect(() => {
    if (isSubmitting) {
      const timer = setTimeout(() => {
        setIsSubmitted(true);
        setIsSubmitting(false);
        setEmail('');
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [isSubmitting]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    // Validate email
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Set submitting state to trigger the useEffect
    setIsSubmitting(true);
  };

  return (
    <div id="pricing" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            No hidden fees, no complicated tiers. Just powerful newsletter management.
          </p>

          <div className="mt-8 flex justify-center">
            <div className="relative bg-gray-100 p-0.5 rounded-lg flex">
              <button
                type="button"
                className={`relative py-2 px-6 border border-transparent rounded-md ${!annual ? 'bg-white shadow-sm text-purple-700' : 'bg-transparent text-gray-700'}`}
                onClick={() => setAnnual(false)}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`relative py-2 px-6 border border-transparent rounded-md ${annual ? 'bg-white shadow-sm text-purple-700' : 'bg-transparent text-gray-700'}`}
                onClick={() => setAnnual(true)}
              >
                Annual <span className="text-sm font-normal">(Save 33%)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 max-w-lg mx-auto lg:max-w-none lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="px-6 py-8 bg-white sm:p-10 sm:pb-6">
              <div>
                <h3 className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-purple-100 text-purple-600">
                  Monthly
                </h3>
              </div>
              <div className="mt-4 flex items-baseline text-6xl font-extrabold text-gray-900">
                $15
                <span className="ml-1 text-2xl font-medium text-gray-500">/month</span>
              </div>
            </div>
            <div className="px-6 pt-6 pb-8 bg-gray-50 sm:p-10 sm:pt-6">
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-base text-gray-700">Unlimited newsletter processing</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-base text-gray-700">Unlimited bookmark summaries</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-base text-gray-700">Full archive access</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-base text-gray-700">Priority support</p>
                </li>
              </ul>
              <div className="mt-8">
                <div className="rounded-md shadow">
                  <button
                    type="button"
                    onClick={() => {
                      const emailInput = document.getElementById('pricing-email');
                      if (emailInput) emailInput.focus();
                    }}
                    className="w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700"
                  >
                    Join Waitlist
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 lg:mt-0 border border-purple-200 rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 relative">
            <div className="absolute inset-x-0 top-0 transform translate-y-px">
              <div className="flex justify-center transform -translate-y-1/2">
                <span className="inline-flex rounded-full bg-purple-600 px-4 py-1 text-sm font-semibold tracking-wider uppercase text-white">
                  Best Value
                </span>
              </div>
            </div>
            <div className="px-6 py-8 bg-white sm:p-10 sm:pb-6">
              <div>
                <h3 className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-purple-100 text-purple-600">
                  Annual
                </h3>
              </div>
              <div className="mt-4 flex items-baseline text-6xl font-extrabold text-gray-900">
                $10
                <span className="ml-1 text-2xl font-medium text-gray-500">/month</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">Billed annually ($120/year)</p>
            </div>
            <div className="px-6 pt-6 pb-8 bg-gray-50 sm:p-10 sm:pt-6">
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-base text-gray-700">All monthly features</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-base text-gray-700">Save 33%</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-base text-gray-700">Priority support</p>
                </li>
              </ul>
              <div className="mt-8">
                <div className="rounded-md shadow">
                  <button
                    type="button"
                    onClick={() => {
                      const emailInput = document.getElementById('pricing-email');
                      if (emailInput) emailInput.focus();
                    }}
                    className="w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700"
                  >
                    Best Value - Join Waitlist
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-16 max-w-lg mx-auto">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-medium text-gray-900 text-center">
              Join Our Waitlist For Early Access
            </h3>
            
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="mt-4">
                <div className="sm:flex">
                  <div className="min-w-0 flex-1">
                    <label htmlFor="pricing-email" className="sr-only">Email address</label>
                    <input
                      id="pricing-email"
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
                <p className="mt-3 text-sm text-gray-500 text-center">
                  Be the first to know when citato.ai launches. We&#39;ll notify you when spots are available.
                </p>
              </form>
            ) : (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <h3 className="ml-2 text-lg font-medium text-green-800">You&#39;re on the list!</h3>
                </div>
                <p className="mt-2 text-center text-green-700">
                  Thanks for joining our waitlist. We&#39;ll notify you when citato.ai launches.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}