import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * veveve.io - English Frontpage
 * International platform for scaling paid marketing efforts
 */
export default function VeveveIOHome() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Head>
        <title>Veveve - Scale Your PPC Ads Globally | International PPC Agency</title>
        <meta 
          name="description" 
          content="Scale your PPC ads globally without scaling your team. Expert Google Ads, Facebook Ads, and LinkedIn Ads management. AI-powered optimization and automation for international campaigns." 
        />
        <meta 
          name="keywords" 
          content="PPC ads, Google Ads, Facebook Ads, LinkedIn Ads, PPC management, PPC agency, scale PPC, PPC optimization, paid search, international PPC" 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Veveve - Scale Your PPC Ads Globally | International PPC Agency" />
        <meta property="og:description" content="Scale your PPC ads globally without scaling your team. Expert Google Ads, Facebook Ads, and LinkedIn Ads management." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://veveve.io" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <span className="text-2xl font-bold" style={{ color: '#0066CC' }}>
                  veveve
                </span>
                <span className="text-sm text-gray-500 ml-1">.io</span>
              </div>
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Features
                </a>
                <a href="#benefits" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Benefits
                </a>
                <Link 
                  href="/login" 
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-50 via-white to-teal-50 py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Scale Your PPC Ads Globally
                <br />
                <span className="text-blue-600">Without Scaling Your Team</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Expert Google Ads, Facebook Ads, and LinkedIn Ads management. AI-powered optimization and automation 
                to scale your PPC campaigns internationally—without hiring more marketers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  Start Free Trial
                </Link>
                <a
                  href="#features"
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors"
                >
                  See How It Works
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need to Scale PPC Ads
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Powerful tools to manage, optimize, and scale your Google Ads, Facebook Ads, and LinkedIn Ads campaigns
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Multi-Channel PPC Management
                </h3>
                <p className="text-gray-600">
                  Manage Google Ads, Facebook Ads, LinkedIn Ads, and Microsoft Ads from one unified dashboard. See all your PPC performance in real-time.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  AI-Powered PPC Optimization
                </h3>
                <p className="text-gray-600">
                  Automated bid management, keyword optimization, and ad copy testing. AI analyzes performance and optimizes your PPC campaigns 24/7.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  PPC Analytics & Reporting
                </h3>
                <p className="text-gray-600">
                  Real-time ROAS tracking, conversion attribution, and automated PPC reports. Get insights on Google Ads, Facebook Ads, and LinkedIn Ads performance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose Veveve?
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                  Scale Without Scaling Headcount
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-teal-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Unified dashboard for all paid channels</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-teal-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">AI-powered attribution and insights</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-teal-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Automated reporting saves 10+ hours/week</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-teal-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Predictive analytics for better decisions</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">10+</div>
                  <div className="text-gray-600 mb-6">Hours saved per week</div>
                  <div className="text-4xl font-bold text-teal-600 mb-2">3x</div>
                  <div className="text-gray-600 mb-6">Faster decision-making</div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">50%+</div>
                  <div className="text-gray-600">ROI improvement</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Scale Your PPC Ads?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join businesses scaling their Google Ads, Facebook Ads, and LinkedIn Ads globally without scaling their teams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                Start Free Trial
              </Link>
              <Link
                href="/login"
                className="bg-transparent text-white px-8 py-4 rounded-lg text-lg font-semibold border-2 border-white hover:bg-white/10 transition-colors"
              >
                Login to Your Account
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="text-2xl font-bold mb-4">veveve.io</div>
                <p className="text-gray-400">
                  International PPC agency specializing in scaling Google Ads, Facebook Ads, and LinkedIn Ads campaigns globally.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#benefits" className="hover:text-white transition-colors">Benefits</a></li>
                  <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="https://veveve.dk" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">About Us</a></li>
                  <li><a href="https://veveve.dk#contact" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="mailto:hello@veveve.dk" className="hover:text-white transition-colors">hello@veveve.dk</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; {new Date().getFullYear()} Veveve. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
