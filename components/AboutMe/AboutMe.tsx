import React from "react";
import { FaRobot, FaChartBar, FaDatabase, FaUsers } from 'react-icons/fa';

const AboutMe: React.FC = () => {
  const values = [
    {
      icon: <FaRobot size={32} />,
      title: "AI-Powered",
      description: "Leveraging machine learning and AI to automate insights and attribution"
    },
    {
      icon: <FaChartBar size={32} />,
      title: "Data-Driven",
      description: "Making decisions based on real data, not assumptions"
    },
    {
      icon: <FaDatabase size={32} />,
      title: "Unified Analytics",
      description: "Connecting all your marketing data sources into one powerful platform"
    },
    {
      icon: <FaUsers size={32} />,
      title: "Customer-Focused",
      description: "Built for marketers who need actionable insights, not just data"
    }
  ];

  return (
    <section id="about" className="py-20 md:py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Main About Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 mb-16">
          <h2 className="text-center text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-6">
            About Veveve
          </h2>
          <div className="max-w-4xl mx-auto space-y-6">
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed text-center">
              We're a team of marketing technology specialists with over 12 years of experience building analytics platforms that drive real business results.
            </p>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed">
              Our expertise spans e-commerce, travel, and service industries. Through years of hands-on experience, we've built a comprehensive platform that combines multi-channel analytics with AI-powered attribution and insights.
            </p>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed">
              Unlike traditional analytics tools, Veveve uses machine learning to automatically classify marketing channels, track customer journeys across touchpoints, and provide predictive insights that help you optimize spend and maximize ROI.
            </p>
          </div>
        </div>

        {/* Values/Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {values.map((value, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100"
            >
              <div className="text-primary mb-4 flex justify-center">
                {value.icon}
              </div>
              <h3 className="text-xl font-bold text-primary mb-3 text-center">
                {value.title}
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-center leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2">12+</div>
            <div className="text-gray-600 text-sm md:text-base">Years Experience</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2">50+</div>
            <div className="text-gray-600 text-sm md:text-base">Active Clients</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2">$500M+</div>
            <div className="text-gray-600 text-sm md:text-base">Revenue Tracked</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2">99.9%</div>
            <div className="text-gray-600 text-sm md:text-base">Uptime</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutMe;