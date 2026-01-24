import React from "react";
import Image from "next/image";
import { FaArrowUp, FaChartLine, FaDollarSign, FaSearch } from 'react-icons/fa';

interface CaseStudy {
  id: number;
  title: string;
  logo: string;
  industry: string;
  challenge: string;
  solution: string;
  metrics: {
    label: string;
    value: string;
    icon: React.ReactNode;
    color: string;
  }[];
  testimonial?: string;
}

const CustomerCases: React.FC = () => {
  const cases: CaseStudy[] = [
    {
      id: 1,
      title: "Wo Clé",
      logo: "/images/cases/wocle.svg",
      industry: "E-commerce",
      challenge: "Needed better ROI tracking across multiple marketing channels",
      solution: "AI-powered attribution and unified analytics dashboard",
      metrics: [
        { label: "Revenue Growth", value: "+300%", icon: <FaArrowUp />, color: "text-green-600" },
        { label: "Monthly Revenue", value: "20M DKK", icon: <FaDollarSign />, color: "text-primary" },
        { label: "ROAS", value: "8:1", icon: <FaChartLine />, color: "text-secondary" },
        { label: "Time Saved", value: "15 hrs/week", icon: <FaSearch />, color: "text-blue-600" }
      ],
      testimonial: "VVV transformed how we measure marketing performance. The AI attribution helped us understand which channels truly drive results."
    },
    {
      id: 2,
      title: "Crossfit Lageret Holstebro",
      logo: "/images/cases/crossfit-lageret.jpg",
      industry: "Fitness & Retail",
      challenge: "High ad spend with unclear attribution",
      solution: "Multi-channel analytics with automated channel classification",
      metrics: [
        { label: "Ad Spend Reduction", value: "-50%", icon: <FaDollarSign />, color: "text-green-600" },
        { label: "Search Rankings", value: "Top 3", icon: <FaSearch />, color: "text-primary" },
        { label: "Conversion Rate", value: "+45%", icon: <FaChartLine />, color: "text-secondary" }
      ]
    },
    {
      id: 3,
      title: "Porsaco",
      logo: "/images/cases/porsa.png",
      industry: "Manufacturing",
      challenge: "Lack of conversion tracking and campaign structure",
      solution: "Complete analytics setup with AI-powered insights",
      metrics: [
        { label: "Conversion Tracking", value: "100%", icon: <FaChartLine />, color: "text-green-600" },
        { label: "Campaign Structure", value: "Optimized", icon: <FaSearch />, color: "text-primary" },
        { label: "Data Quality", value: "99.9%", icon: <FaChartLine />, color: "text-secondary" }
      ]
    }
  ];

  return (
    <section id="cases" className="py-20 md:py-24 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-4">
            Customer Success Stories
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how leading companies use our platform to drive measurable growth
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {cases.map((caseItem) => (
            <article
              key={caseItem.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl overflow-hidden transition-all duration-300 hover:-translate-y-2 border border-gray-100 flex flex-col"
            >
              {/* Logo Section */}
              <div className="relative w-full h-32 bg-gradient-to-br from-gray-50 to-gray-100 flex justify-center items-center p-6">
                <div className="relative w-full h-full max-w-[200px]">
                  <Image
                    src={caseItem.logo}
                    alt={`${caseItem.title} logo`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-primary mb-2">{caseItem.title}</h3>
                  <span className="text-sm text-gray-500 font-medium">{caseItem.industry}</span>
                </div>

                {/* Challenge & Solution */}
                <div className="mb-6 space-y-3 flex-1">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Challenge</p>
                    <p className="text-sm text-gray-700">{caseItem.challenge}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Solution</p>
                    <p className="text-sm text-gray-700">{caseItem.solution}</p>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {caseItem.metrics.map((metric, index) => (
                    <div
                      key={`${caseItem.id}-metric-${index}`}
                      className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200"
                    >
                      <div className={`flex justify-center mb-1 ${metric.color}`}>
                        {metric.icon}
                      </div>
                      <div className="text-lg font-bold text-primary">{metric.value}</div>
                      <div className="text-xs text-gray-600 mt-1">{metric.label}</div>
                    </div>
                  ))}
                </div>

                {/* Testimonial */}
                {caseItem.testimonial && (
                  <div className="mt-auto pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 italic">"{caseItem.testimonial}"</p>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomerCases;