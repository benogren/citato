'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed w-full bg-white/95 backdrop-blur-sm z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href={"/"} className="flex items-center font-bold text-xl bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent no-underline">citato.ai</Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-600 hover:text-purple-600 transition-colors">
              Features
            </Link>
            {/* <Link href="#pricing" className="text-gray-600 hover:text-purple-600 transition-colors">
              Pricing
            </Link> */}
            <Link href="#faq" className="text-gray-600 hover:text-purple-600 transition-colors">
              FAQ
            </Link>
            <Link href="/sign-in" className="text-gray-600 hover:text-purple-600 transition-colors">
              Log in
            </Link>
            <Link href="#cta" className="bg-violet-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-purple-700 transition-colors">
              Get Started
            </Link>
          </div>
          
          <div className="md:hidden">
            <button 
              type="button" 
              className="text-gray-600 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="#features" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-purple-600 hover:bg-gray-50 rounded-md">
              Features
            </Link>
            <Link href="#pricing" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-purple-600 hover:bg-gray-50 rounded-md">
              Pricing
            </Link>
            <Link href="#faq" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-purple-600 hover:bg-gray-50 rounded-md">
              FAQ
            </Link>
            <Link href="/login" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-purple-600 hover:bg-gray-50 rounded-md">
              Log in
            </Link>
            <Link href="#cta" className="block w-full text-center px-3 py-2 text-base font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}