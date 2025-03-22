// import Image from 'next/image';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagicWandSparkles, faBookmark, faRectangleList, faBolt } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

export default function Features() {
  const features = [
    {
      name: 'Seamless Email Integration',
      description: 'Connect once and let citato.ai automatically process content from your inbox. No manual copying, no switching between apps. Your subscribed content is instantly organized and summarized.',
      icon: faGoogle,
    },
    {
      name: 'Smart AI Summaries',
      description: 'Get the gist of any article or update in seconds. Our AI analyzes each piece of content and extracts the most important points, helping you quickly decide if you want to dive deeper.',
      icon: faMagicWandSparkles,
    },
    {
      name: 'Unified Content Feed',
      description: 'Browse all your subscriptions and saved bookmarks in one beautiful, distraction-free interface. Filter, sort, and search across all your content effortlessly.',
      icon: faRectangleList,
    },
    {
      name: 'Bookmark Intelligence',
      description: 'Save any article for later and get instant AI-powered summaries. Finally, a bookmark system that helps you remember why you saved something in the first place.',
      icon: faBookmark,
    },
    {
      name: 'Key Takeaways',
      description: 'When you decide to read the full content, citato.ai generates concise takeaways and highlights important links, making it easy to retain and share key insights.',
      icon: faBolt,
    }
  ];

  return (
    <div id="features" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-purple-600 tracking-wide uppercase">Features</h2>
          <p className="mt-1 text-3xl font-extrabold text-gray-900 sm:text-4xl sm:tracking-tight">
            Everything You Need to Stay Informed, Not Overwhelmed
          </p>
        </div>

        <div className="mt-16">
          <div className="space-y-16">
            <div className='flex flex-wrap -mx-8'>
            {features.map((feature, index) => (
              <div key={index} className={`w-1/2`}>
                <div className="flex-1 p-8">
                    <div className="h-12 w-12 rounded-md bg-gradient-to-bl from-purple-600 to-indigo-600 flex items-center justify-center">
                        <FontAwesomeIcon 
                        icon={feature.icon} 
                        className="h-6 w-6 text-white"
                        />
                    </div>
                  <h3 className="mt-6 text-xl font-medium text-gray-900">{feature.name}</h3>
                  <p className="mt-2 text-base text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}