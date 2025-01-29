import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <>
      <div className="justify-center items-center mx-auto">
        <div>
          <p className="text-center m-6">
              <Link href={"/"} className="font-bold text-xl text-gray-600">citato.ai</Link>
          </p>
          <hr className="w-4/6 mx-auto mb-6" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              When you use Citato, we collect information that you provide directly to us:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email address</li>
              <li>Google account information when you sign in with Google</li>
              <li>Newsletter subscription data</li>
              <li>Usage data and interactions with our service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process and manage your newsletter subscriptions</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Protect against fraud and abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third parties. 
              We may share your information with trusted third parties who assist us in operating our 
              website, conducting our business, or servicing you, as long as these parties agree to 
              keep this information confidential.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information. 
              However, no method of transmission over the internet or electronic storage is 100% 
              secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Withdraw consent for data processing</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes 
              by posting the new privacy policy on this page and updating the effective date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy, please contact us at:{" "}
              <a href="mailto:privacy@citato.ai" className="text-blue-600 hover:underline">
                privacy@citato.ai
              </a>
            </p>
          </section>

          <footer className="mt-8 pt-4 border-t text-gray-600">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
          </footer>
        </div>
      </div>
    </>
  );
}