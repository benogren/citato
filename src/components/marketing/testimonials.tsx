// File: components/Testimonials.js
import Link from 'next/link';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuoteLeft } from '@fortawesome/free-solid-svg-icons';

export default function Testimonials() {
  const testimonials = [
    {
      content: "citato.ai has completely transformed how I consume newsletters. I'm no longer anxious about my inbox and feel so much more informed. It's like having a smart assistant who reads everything for me.",
      author: {
        name: "Sarah Johnson",
        title: "Product Manager at TechCorp",
        image: "/testimonials/sarah.jpg"
      }
    },
    {
      content: "As someone who subscribes to over 30 newsletters, citato.ai is a game-changer. I save at least 5 hours a week and never miss important insights. Worth every penny!",
      author: {
        name: "Michael Chen",
        title: "Startup Founder",
        image: "/testimonials/michael.jpg"
      }
    },
    {
      content: "The bookmark feature alone is worth the subscription. I'm finally reading the content I save instead of forgetting why I bookmarked it in the first place.",
      author: {
        name: "Elena Rodriguez",
        title: "Digital Marketing Consultant",
        image: "/testimonials/elena.jpg"
      }
    }
  ];

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Loved by information professionals
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Join thousands who&#39;ve transformed their newsletter experience
          </p>
        </div>
        <div className="mt-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="px-6 py-8">
                  <div className="relative h-10">
                    <FontAwesomeIcon 
                    icon={faQuoteLeft} 
                    className="h-6 w-6 absolute text-purple-200"
                    />
                  </div>
                  <p className="mt-6 text-gray-600">{testimonial.content}</p>
                  <div className="mt-6 flex items-center">
                    <div className="flex-shrink-0 relative h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                      <div className="absolute inset-0 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        {testimonial.author.name.charAt(0)}
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{testimonial.author.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.author.title}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-16 flex justify-center">
            <Link href="/signup" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700">
              Join them today
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}