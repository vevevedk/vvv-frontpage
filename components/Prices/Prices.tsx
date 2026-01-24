import React, { useState, useEffect } from "react";
import { PriceData } from "../model/PrisDataModel";
import { PageLoader } from "../ui/LoadingSpinner";
import ErrorState from "../ui/ErrorState";
import { useToast } from "../ui/Toast";

const Prices: React.FC = () => {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/data/prices");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setPrices(data);
      } catch (error) {
        console.error("Fetch error:", error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        setError(errorMessage);
        showError('Failed to Load Pricing', 'Unable to load pricing information. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [showError]);

  if (isLoading) {
    return (
      <section id="prices" className="py-16 px-4 bg-white">
        <PageLoader label="Loading pricing information..." />
      </section>
    );
  }

  if (error) {
    return (
      <section id="prices" className="py-16 px-4 bg-white">
        <ErrorState 
          type="general" 
          title="Unable to Load Pricing"
          message="We couldn't load the pricing information. Please refresh the page or contact us if the problem persists."
          onRetry={() => window.location.reload()}
          retryLabel="Refresh Page"
        />
      </section>
    );
  }

  if (!prices.length) {
    return (
      <section id="prices" className="py-16 px-4 bg-white">
        <div className="max-w-wrapper mx-auto text-center py-12">
          <p className="text-gray-600 text-lg">No pricing information available at this time.</p>
          <a 
            href="mailto:hello@veveve.dk" 
            className="inline-block mt-4 text-primary hover:underline"
          >
            Contact us for pricing information
          </a>
        </div>
      </section>
    );
  }

  return (
    <section id="prices" className="py-20 md:py-24 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-4">
            Pricing Plans
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your business needs. All plans include our core analytics features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {prices.map((price, index) => {
            const isPopular = index === 1; // Middle plan as popular
            return (
              <article
                key={price.id}
                className={`relative bg-white rounded-xl shadow-md hover:shadow-xl p-8 text-center transition-all duration-300 hover:-translate-y-2 flex flex-col border-2 ${
                  isPopular 
                    ? 'border-secondary scale-105 md:scale-110' 
                    : 'border-gray-100'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-secondary text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className="text-2xl md:text-3xl text-primary mb-4 font-bold">{price.title}</h3>
                
                <div className="my-6 flex flex-col items-center gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl text-gray-600">DKK</span>
                    <span className="text-5xl md:text-6xl font-bold text-primary">
                      {price.price.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">per month, ex. VAT</span>
                </div>

                <p className="text-gray-700 mb-8 min-h-[60px] flex items-center justify-center">
                  {price.description}
                </p>

                <ul className="list-none p-0 m-0 flex-grow mb-8 space-y-3 text-left">
                  {price.servicesIncluded.map((service, serviceIndex) => (
                    <li
                      key={`${price.id}-service-${serviceIndex}`}
                      className="flex items-start gap-3 py-2"
                    >
                      <span className="text-secondary mt-1">✓</span>
                      <span className="text-gray-700 text-sm md:text-base">{service}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <a
                    href="mailto:hello@veveve.dk?subject=Pricing Inquiry - {price.title}"
                    className={`inline-block w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                      isPopular
                        ? 'bg-secondary text-white hover:bg-secondary/90 shadow-lg hover:shadow-xl'
                        : 'bg-primary text-white hover:bg-primary-dark'
                    }`}
                  >
                    Get Started
                  </a>
                  <p className="text-xs text-gray-500 mt-3">
                    No credit card required
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Need a custom plan? <a href="mailto:hello@veveve.dk" className="text-primary hover:underline font-semibold">Contact us</a> for enterprise solutions
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <span>✓ 14-day free trial</span>
            <span>✓ Cancel anytime</span>
            <span>✓ Money-back guarantee</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Prices;
