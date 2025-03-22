'use client';

import { useState } from 'react';

export default function FAQ() {
  const [openItem, setOpenItem] = useState(0);

  const faqs = [
    {
      question: "How does citato.ai access my content?",
      answer: "We securely connect to your Gmail account and only process subscriptions and content you care about. We never access personal emails or send emails on your behalf."
    },
    {
      question: "What types of content can citato.ai process?",
      answer: "citato.ai works with most content that arrives in your inbox, including newsletters, updates from websites you follow, industry insights, and more. If we encounter content we can't process, we'll let you know and continuously improve our compatibility."
    },
    {
      question: "Can I export my summaries and takeaways?",
      answer: "Yes! All your summaries, takeaways, and bookmarks can be exported in multiple formats for easy sharing or personal reference."
    },
    {
      question: "What happens if I cancel my subscription?",
      answer: "You'll maintain access to your account until the end of your billing period. After that, you can export your data before losing access."
    },
    {
      question: "Is my data secure?",
      answer: "We use bank-level encryption and never store your full email content. We only process the content you've subscribed to and maintain summaries in our secure cloud."
    }
  ];

  return (
    <div id="faq" className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Got a different question? Contact our support team at 
            <a href="mailto:support@citato.ai" className="text-purple-600 font-medium hover:text-purple-700"> support@citato.ai</a>
          </p>
        </div>
        <div className="mt-12">
          <dl className="space-y-6 divide-y divide-gray-200">
            {faqs.map((faq, index) => (
              <div key={index} className="pt-6">
                <dt className="text-lg">
                  <button
                    onClick={() => setOpenItem(openItem === index ? -1 : index)}
                    className="text-left w-full flex justify-between items-start text-gray-900 focus:outline-none"
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    <span className="ml-6 h-7 flex items-center">
                      <svg 
                        className={`${openItem === index ? '-rotate-180' : 'rotate-0'} h-6 w-6 transform text-purple-600 transition-transform duration-200 ease-in-out`}
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>
                </dt>
                <dd className={`mt-2 pr-12 transition-all duration-200 ease-in-out ${openItem === index ? 'block opacity-100 max-h-96' : 'hidden opacity-0 max-h-0'}`}>
                  <p className="text-base text-gray-600">{faq.answer}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}