import React from 'react';

const Test = () => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          HealthChain
        </h1>
        <p className="text-gray-700 text-center mb-8">
          Decentralized Public Health Data Management Platform
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-6 shadow-sm">
            <h2 className="font-bold text-xl mb-3">Secure Storage</h2>
            <p className="text-gray-600">
              Your health data is securely stored on a decentralized network, giving you complete control.
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-6 shadow-sm">
            <h2 className="font-bold text-xl mb-3">Privacy Protection</h2>
            <p className="text-gray-600">
              Zero-knowledge proofs ensure your information remains private while still being verifiable.
            </p>
          </div>
        </div>
        
        <div className="flex justify-center">
          <button 
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:opacity-90 transition-opacity"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    </div>
  );
};

export default Test;