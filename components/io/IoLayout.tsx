import Head from "next/head";
import Link from "next/link";
import { PropsWithChildren } from "react";
import { appHref } from "../../lib/io/appLinks";

type IoLayoutProps = PropsWithChildren<{
  title: string;
  description?: string;
}>;

export default function IoLayout({ title, description, children }: IoLayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        {description ? <meta name="description" content={description} /> : null}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={title} />
        {description ? <meta property="og:description" content={description} /> : null}
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-white">
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center">
                <span className="text-2xl font-bold" style={{ color: "#0066CC" }}>
                  veveve
                </span>
                <span className="text-sm text-gray-500 ml-1">.io</span>
              </Link>

              <div className="hidden md:flex items-center space-x-8">
                <Link href="/product" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Product
                </Link>
                <Link href="/pricing" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Pricing
                </Link>
                <Link href="/case-studies" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Case Studies
                </Link>
                <Link href="/security" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Security
                </Link>
                <a href={appHref("/login")} className="text-gray-700 hover:text-blue-600 transition-colors">
                  Login
                </a>
                <a
                  href={appHref("/register")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Free Trial
                </a>
              </div>
            </div>
          </div>
        </nav>

        <main>{children}</main>

        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="text-2xl font-bold mb-4">veveve.io</div>
                <p className="text-gray-400">
                  Agentic PPC automation for international teams. Scale faster with autonomous optimization and
                  human-in-the-loop controls.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <Link href="/product" className="hover:text-white transition-colors">
                      Product
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing" className="hover:text-white transition-colors">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/security" className="hover:text-white transition-colors">
                      Security
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <Link href="/case-studies" className="hover:text-white transition-colors">
                      Case Studies
                    </Link>
                  </li>
                  <li>
                    <a
                      href="https://veveve.dk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      veveve.dk
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <a href="mailto:hello@veveve.dk" className="hover:text-white transition-colors">
                      hello@veveve.dk
                    </a>
                  </li>
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

