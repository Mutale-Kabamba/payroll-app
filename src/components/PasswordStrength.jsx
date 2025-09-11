import React from 'react';
import { Check, X, Shield } from 'lucide-react';

const PasswordStrength = ({ password, showStrength = true }) => {
  const getPasswordStrength = (pwd) => {
    let score = 0;
    const feedback = [];
    
    // Length check
    if (pwd.length >= 8) {
      score += 1;
      feedback.push({ text: 'At least 8 characters', met: true });
    } else {
      feedback.push({ text: 'At least 8 characters', met: false });
    }
    
    // Uppercase check
    if (/[A-Z]/.test(pwd)) {
      score += 1;
      feedback.push({ text: 'Contains uppercase letter', met: true });
    } else {
      feedback.push({ text: 'Contains uppercase letter', met: false });
    }
    
    // Lowercase check
    if (/[a-z]/.test(pwd)) {
      score += 1;
      feedback.push({ text: 'Contains lowercase letter', met: true });
    } else {
      feedback.push({ text: 'Contains lowercase letter', met: false });
    }
    
    // Number check
    if (/\d/.test(pwd)) {
      score += 1;
      feedback.push({ text: 'Contains number', met: true });
    } else {
      feedback.push({ text: 'Contains number', met: false });
    }
    
    // Special character check
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      score += 1;
      feedback.push({ text: 'Contains special character', met: true });
    } else {
      feedback.push({ text: 'Contains special character', met: false });
    }
    
    let strength = 'Very Weak';
    let color = 'red';
    
    if (score >= 5) {
      strength = 'Very Strong';
      color = 'green';
    } else if (score >= 4) {
      strength = 'Strong';
      color = 'lime';
    } else if (score >= 3) {
      strength = 'Medium';
      color = 'yellow';
    } else if (score >= 2) {
      strength = 'Weak';
      color = 'orange';
    }
    
    return { strength, color, score, feedback };
  };

  if (!password || !showStrength) return null;

  const { strength, color, score, feedback } = getPasswordStrength(password);

  const getColorClass = () => {
    switch (color) {
      case 'green': return 'text-green-600 bg-green-50 border-green-200';
      case 'lime': return 'text-green-500 bg-green-50 border-green-200';
      case 'yellow': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'orange': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getBarColor = () => {
    switch (color) {
      case 'green': return 'bg-green-500';
      case 'lime': return 'bg-green-400';
      case 'yellow': return 'bg-yellow-500';
      case 'orange': return 'bg-orange-500';
      default: return 'bg-red-500';
    }
  };

  return (
    <div className="mt-2 space-y-2">
      {/* Strength Indicator */}
      <div className={`p-2 rounded-md border ${getColorClass()}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <Shield className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Password Strength: {strength}</span>
          </div>
          <span className="text-xs">{score}/5</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getBarColor()}`}
            style={{ width: `${(score / 5) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-1">
        {feedback.map((item, index) => (
          <div key={index} className="flex items-center text-xs">
            {item.met ? (
              <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
            ) : (
              <X className="h-3 w-3 text-red-500 mr-2 flex-shrink-0" />
            )}
            <span className={item.met ? 'text-green-700' : 'text-red-700'}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrength;