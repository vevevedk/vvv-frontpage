import React from "react";
import { FaDatabase, FaRobot, FaChartLine, FaLightbulb } from 'react-icons/fa';

const Services: React.FC = () => {
  const services = [
    {
      id: 1,
      title: "Multi-Channel Analytics",
      description: "Unify data from WooCommerce, Google Ads, Search Console, and more into one real-time dashboard. See your complete marketing picture at a glance.",
      icon: <FaDatabase size={50} />,
      features: ["Real-time data sync", "Custom dashboards", "Multi-source integration"]
    },
    {
      id: 2,
      title: "AI-Powered Attribution",
      description: "Automatically classify marketing channels using machine learning. Get accurate ROI measurement and identify which campaigns drive real results.",
      icon: <FaRobot size={50} />,
      features: ["Automated channel classification", "ML-based insights", "Accurate ROI tracking"]
    },
    {
      id: 3,
      title: "Predictive Analytics",
      description: "Forecast performance and identify opportunities before they happen. Get actionable insights powered by advanced analytics and AI.",
      icon: <FaChartLine size={50} />,
      features: ["Performance forecasting", "Trend analysis", "Anomaly detection"]
    },
    {
      id: 4,
      title: "Automated Reporting",
      description: "Save hours every week with automated insights and reports. Get scheduled reports delivered to your inbox with the metrics that matter.",
      icon: <FaLightbulb size={50} />,
      features: ["Scheduled reports", "Custom metrics", "Time-saving automation"]
    }
  ];

  return (
    <section id="services" className="bg-gradient-to-b from-gray-50 to-white py-20 md:py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-4">
            Powerful Analytics Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to measure, analyze, and optimize your marketing performance
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {services.map((service) => (
            <article
              key={service.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl p-8 transition-all duration-300 hover:-translate-y-2 border border-gray-100"
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    {service.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-primary mb-3">{service.title}</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">{service.description}</p>
                  
                  {service.features && (
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-600">
                          <span className="w-1.5 h-1.5 bg-secondary rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services; 