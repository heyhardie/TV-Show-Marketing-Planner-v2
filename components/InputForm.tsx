import React, { useState } from 'react';
import { ModelType, InputMode } from '../types';
import { SparklesIcon, BoltIcon, StarIcon, BrainIcon } from './IconComponents';

interface InputFormProps {
  onSubmit: (input: string, model: ModelType, mode: InputMode) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [model, setModel] = useState<ModelType>('fast');
  const [mode, setMode] = useState<InputMode>('existing');
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSubmit(input, model, mode);
  };

  // Check for Runtime Key OR Build Key
  const runtimeKey = (window as any).RUNTIME_CONFIG?.API_KEY;
  const hasRuntimeKey = runtimeKey && runtimeKey !== '__CLOUDFLARE_RUNTIME_API_KEY__';
  const hasBuildKey = !!process.env.API_KEY;
  
  const isConfigured = hasRuntimeKey || hasBuildKey;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-6 bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
      
      {/* Model Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setModel('fast')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
            model === 'fast' 
              ? 'border-indigo-500 bg-indigo-500/10 text-white' 
              : 'border-gray-700 hover:border-gray-600 text-gray-400 hover:bg-gray-700/50'
          }`}
        >
          <BoltIcon className="w-8 h-8 mb-2" />
          <span className="font-bold">Fast</span>
          <span className="text-xs opacity-70">Flash Preview</span>
        </button>

        <button
          type="button"
          onClick={() => setModel('pro')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
            model === 'pro' 
              ? 'border-purple-500 bg-purple-500/10 text-white' 
              : 'border-gray-700 hover:border-gray-600 text-gray-400 hover:bg-gray-700/50'
          }`}
        >
          <StarIcon className="w-8 h-8 mb-2" />
          <span className="font-bold">Pro</span>
          <span className="text-xs opacity-70">Pro + Search</span>
        </button>

        <button
          type="button"
          onClick={() => setModel('thinking')}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
            model === 'thinking' 
              ? 'border-emerald-500 bg-emerald-500/10 text-white' 
              : 'border-gray-700 hover:border-gray-600 text-gray-400 hover:bg-gray-700/50'
          }`}
        >
          <BrainIcon className="w-8 h-8 mb-2" />
          <span className="font-bold">Thinking</span>
          <span className="text-xs opacity-70">Pro + Reason (32k)</span>
        </button>
      </div>

      {/* Input Mode */}
      <div className="flex space-x-4 bg-gray-900/50 p-1 rounded-lg w-fit mx-auto">
        <button
          type="button"
          onClick={() => setMode('existing')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            mode === 'existing' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'
          }`}
        >
          Existing Show
        </button>
        <button
          type="button"
          onClick={() => setMode('concept')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            mode === 'concept' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'
          }`}
        >
          New Concept
        </button>
      </div>

      {/* Input Field */}
      <div className="space-y-2">
        <label htmlFor="input" className="block text-sm font-medium text-gray-300">
          {mode === 'existing' ? 'Show Title or URL' : 'Treatment / Summary'}
        </label>
        {mode === 'existing' ? (
          <input
            id="input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., Stranger Things, Breaking Bad"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
        ) : (
          <textarea
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            placeholder="Describe your show concept..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
          />
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 transition-all ${
          isLoading || !input.trim()
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg hover:shadow-indigo-500/25'
        }`}
      >
        {isLoading ? (
          <span>Processing...</span>
        ) : (
          <>
            <SparklesIcon className="w-5 h-5" />
            <span>Generate Strategy</span>
          </>
        )}
      </button>

      {/* API Key Status Indicator */}
      <div className="flex justify-center items-center pt-2">
          <div className={`px-3 py-1 rounded-full text-xs font-mono flex items-center space-x-2 ${
              isConfigured ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
          }`}>
              <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
              <span>
                  {isConfigured ? 'System API Key Configured' : 'Using Manual Key Selection'}
              </span>
          </div>
      </div>
    </form>
  );
};

export default InputForm;