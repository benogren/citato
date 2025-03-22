import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Hero from '@/components/marketing/hero';
import CTA from '@/components/marketing/CTA';
import Pricing from '@/components/marketing/pricing';
import Testimonials from '@/components/marketing/testimonials';
import Problem from '@/components/marketing/problem';
import Transformation from '@/components/marketing/transform';
import Features from '@/components/marketing/features';
import FAQ from '@/components/marketing/FAQ';
import Navbar from '@/components/marketing/navbar';

export default async function Home() {

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>citato.ai | AI-powered Reading Companion</title>
        <meta name="description" content="Transform newsletter overload into organized, actionable insights with citato.ai" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      
      <main>
        <Hero />
        <Problem />
        <Transformation />
        <Features />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
    </div>
    );
}
