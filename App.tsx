import React, { useState, useEffect, useRef } from 'react';
import { ModelType, InputMode, MarketingReport, HistoryItem } from './types';
import * as geminiService from './services/geminiService';
import * as historyService from './services/historyService';
import { trackEvent } from './services/analyticsService';

import InputForm from './components/InputForm';
import MarketingReportDisplay from './components/MarketingReportDisplay';
import HistorySidebar from './components/HistorySidebar';
import Loader from './components/Loader';
import Footer from './components/Footer';
import { HistoryIcon } from './components/IconComponents';

const App: React.FC = () => {
  const [report, setReport] = useState<MarketingReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasTrackedView = useRef(false);

  // Load history on mount
  useEffect(() => {
    setHistory(historyService.getHistory());
    
    // Track Page View (Unique per session load)
    if (!hasTrackedView.current) {
        trackEvent('view');
        hasTrackedView.current = true;
    }
  }, []);

  const handleSubmit = async (input: string, model: ModelType, mode: InputMode) => {
    setIsLoading(true);
    setError(null);
    setReport(null);
    
    try {
      const result = await geminiService.generateMarketingStrategy(input, model, mode);
      setReport(result);
      
      // Save to history
      const updatedHistory = historyService.saveReport(result);
      setHistory(updatedHistory);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setReport(item);
  };

  const handleHistoryDelete = (id: string) => {
    const updated = historyService.deleteReport(id);
    setHistory(updated);
    if (report && (report as HistoryItem).id === id) {
        setReport(null);
    }
  };

  const handleHistoryClear = () => {
    historyService.clearHistory();
    setHistory([]);
    setReport(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-200 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Header */}
      <header className="sticky top-0 z-30 w-full bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">AI</span>
             </div>
             <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
               TV Marketing AI
             </h1>
          </div>
          
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white transition-colors relative"
          >
            <HistoryIcon className="w-6 h-6" />
            {history.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full">
        
        {/* Input Section */}
        {!report && !isLoading && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-fade-in-up">
                <div className="text-center space-y-4 max-w-2xl">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                        Next-Gen Marketing Strategies
                    </h2>
                    <p className="text-lg text-gray-400">
                        Generate comprehensive audience profiles, competitor analysis, and key art concepts for your TV show in seconds using Gemini 3.
                    </p>
                </div>
                <InputForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
        )}

        {/* Loading State */}
        {isLoading && (
            <div className="min-h-[50vh] flex flex-col items-center justify-center">
                <Loader />
            </div>
        )}

        {/* Error State */}
        {error && (
            <div className="max-w-2xl mx-auto mt-8 p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-200 text-center">
                <p className="font-semibold">Generation Failed</p>
                <p className="text-sm opacity-80">{error}</p>
                <button 
                    onClick={() => setError(null)}
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    Try Again
                </button>
            </div>
        )}

        {/* Report Display */}
        {report && !isLoading && (
            <div className="space-y-8 mt-4 mb-12">
                <div className="flex justify-between items-center">
                     <button 
                        onClick={() => setReport(null)}
                        className="text-sm text-gray-400 hover:text-white flex items-center space-x-1"
                     >
                        <span>← Back to Generator</span>
                     </button>
                </div>
                <MarketingReportDisplay data={report} />
            </div>
        )}

      </main>

      {/* Footer */}
      <Footer />

      {/* History Sidebar */}
      <HistorySidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        history={history}
        onSelect={handleHistorySelect}
        onDelete={handleHistoryDelete}
        onClear={handleHistoryClear}
      />

    </div>
  );
};

export default App;