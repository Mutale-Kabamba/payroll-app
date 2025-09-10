import React from 'react';
import { Building, Calculator, Users, FileText, Shield, Clock, BarChart3, ArrowRight, CheckCircle, Star, Zap } from 'lucide-react';

const LandingPage = ({ onGetStarted, onLogin, setupData }) => {
  const companyName = setupData?.companyName || 'Your Company';

  const features = [
    {
      icon: <Users className="h-8 w-8 text-blue-600" />,
      title: 'Employee Management',
      description: 'Easily manage employee records, personal information, and employment details in one centralized system.'
    },
    {
      icon: <Calculator className="h-8 w-8 text-green-600" />,
      title: 'Automated Calculations',
      description: 'Automatic calculation of salaries, deductions, taxes, and allowances with precision and accuracy.'
    },
    {
      icon: <FileText className="h-8 w-8 text-purple-600" />,
      title: 'Payslip Generation',
      description: 'Generate professional payslips with detailed breakdowns and export options for easy distribution.'
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-orange-600" />,
      title: 'Reports & Analytics',
      description: 'Comprehensive reporting and analytics to track payroll costs, trends, and compliance metrics.'
    },
    {
      icon: <Shield className="h-8 w-8 text-red-600" />,
      title: 'Secure & Compliant',
      description: 'Built with security best practices and compliance with local tax regulations and labor laws.'
    },
    {
      icon: <Clock className="h-8 w-8 text-indigo-600" />,
      title: 'Time Tracking',
      description: 'Integrated time tracking to calculate worked hours, overtime, and attendance automatically.'
    }
  ];

  const benefits = [
    'Reduce payroll processing time by 80%',
    'Eliminate calculation errors',
    'Ensure compliance with tax regulations',
    'Streamline employee self-service',
    'Generate instant reports',
    'Secure cloud-based storage'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">PayrollPro</span>
            </div>
            <button
              onClick={onLogin}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap className="h-4 w-4 mr-2" />
                Modern Payroll Solution
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Simplify Your 
                <span className="text-blue-600 block">Payroll Process</span>
              </h1>
              <p className="text-xl text-gray-600 mt-6 leading-relaxed">
                Streamline payroll management for {companyName} with our comprehensive, secure, and user-friendly payroll system. 
                Save time, reduce errors, and ensure compliance.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onGetStarted}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center group"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={onLogin}
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors font-semibold"
                >
                  Sign In
                </button>
              </div>

              <div className="mt-8 flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Free 30-day trial
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  No setup fees
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Cancel anytime
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Monthly Overview</h3>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      All Systems Active
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">248</div>
                          <div className="text-sm text-gray-600">Employees</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <FileText className="h-8 w-8 text-green-600" />
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">248</div>
                          <div className="text-sm text-gray-600">Payslips</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600">Total Payroll</div>
                        <div className="text-2xl font-bold text-gray-900">$124,580</div>
                      </div>
                      <div className="flex items-center text-green-600">
                        <span className="text-sm font-medium">+5.2%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg">
                <Calculator className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-green-600 text-white p-3 rounded-full shadow-lg">
                <Shield className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Payroll Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive payroll features designed to handle all aspects of employee compensation and compliance.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-8 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 hover:border-blue-200">
                <div className="mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Why Choose PayrollPro?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join thousands of companies that trust PayrollPro for their payroll management needs.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex items-center space-x-4">
                <div className="flex -space-x-2">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center">
                      <span className="text-white font-medium text-sm">{i}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center">
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Trusted by 10,000+ companies</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
                  <div className="text-gray-600">Uptime</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="text-3xl font-bold text-green-600 mb-2">10K+</div>
                  <div className="text-gray-600">Companies</div>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="text-3xl font-bold text-purple-600 mb-2">80%</div>
                  <div className="text-gray-600">Time Saved</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
                  <div className="text-gray-600">Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Payroll Process?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Get started with PayrollPro today and experience the difference of modern payroll management.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold flex items-center justify-center group"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onLogin}
              className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-semibold"
            >
              Sign In to Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">PayrollPro</span>
            </div>
            
            <div className="text-gray-400 text-center md:text-right">
              <p className="mb-2">© 2025 PayrollPro. All rights reserved.</p>
              <p className="text-sm">Secure • Compliant • Reliable</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;