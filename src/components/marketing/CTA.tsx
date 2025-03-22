'use client';

import { useState, useEffect } from 'react';

export default function CTA() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Use useEffect to handle the "async" operation when isSubmitting changes
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

  const handleSubmit = (e) => {
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
    <div id="cta" className="bg-gradient-to-bl from-indigo-800 to-purple-600">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Be First to Experience</span>
            <span className="block">A New Way of Consuming Information</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-purple-200">
            Join our exclusive waitlist and be notified as soon as citato.ai launches
          </p>
        </div>

        {!isSubmitted ? (
          <div className="mt-10 max-w-xl mx-auto">
            <form onSubmit={handleSubmit} className="sm:flex">
              <div className="min-w-0 flex-1">
                <label htmlFor="cta-email" className="sr-only">Email address</label>
                <input
                  id="cta-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-4 py-3 rounded-md border-0 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  disabled={isSubmitting}
                />
              </div>
              <div className="mt-3 sm:mt-0 sm:ml-3">
                <button
                  type="submit"
                  className={`block w-full py-3 px-4 rounded-md shadow bg-purple-500 text-white font-medium hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-300 sm:text-sm ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                </button>
              </div>
            </form>
            {error && (
              <p className="mt-2 text-sm text-red-300">{error}</p>
            )}
            <p className="mt-3 text-sm text-purple-200 text-center">
              No spam. We'll only send you citato.ai launch updates.
            </p>
          </div>
        ) : (
          <div className="mt-10 max-w-xl mx-auto p-6 bg-white/10 backdrop-blur-sm rounded-lg">
            <div className="flex items-center justify-center">
              <svg className="h-6 w-6 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="ml-2 text-lg font-medium text-white">Thanks for joining!</h3>
            </div>
            <p className="mt-2 text-center text-purple-100">
              You're officially on our waitlist. We'll be in touch when citato.ai is ready to launch.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}