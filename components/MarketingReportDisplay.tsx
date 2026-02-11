import React, { useState } from 'react';
import { MarketingReport } from '../types';
import { generateKeyArtImage } from '../services/geminiService';
import { DownloadIcon, ClipboardIcon } from './IconComponents';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChatInterface from './ChatInterface';

interface Props {
  data: MarketingReport;
}

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

const MarketingReportDisplay: React.FC<Props> = ({ data }) => {
  const [generatingImageFor, setGeneratingImageFor] = useState<number | null>(null);
  const [images, setImages] = useState<Record<number, string>>({});

  const handleGenerateImage = async (index: number, prompt: string) => {
    try {
      setGeneratingImageFor(index);
      const base64 = await generateKeyArtImage(prompt);
      setImages(prev => ({ ...prev, [index]: base64 }));
    } catch (error) {
      console.error("Image generation failed", error);
      alert("Failed to generate image. Ensure you have a valid paid API key selected.");
    } finally {
      setGeneratingImageFor(null);
    }
  };

  const handleExportPDF = () => {
    const element = document.getElementById('report-display');
    if (element && window.html2pdf) {
      const opt = {
        margin: 0,
        filename: `${data.showInfo.title.replace(/\s+/g, '_')}_Strategy.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      window.html2pdf().from(element).save();
    } else {
        alert("PDF Generation library not loaded.");
    }
  };

  const handleCopyToClipboard = () => {
    const text = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    alert("Report JSON copied to clipboard!");
  };

  const isMovie = data.mediaType === 'movie';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in" id="report-display">
      
      {/* Action Bar (No Print) */}
      <div className="flex justify-end space-x-2 no-print">
         <button onClick={handleCopyToClipboard} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-gray-300" title="Copy JSON">
            <ClipboardIcon className="w-5 h-5" />
         </button>
         <button onClick={handleExportPDF} className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 text-white" title="Export PDF">
            <DownloadIcon className="w-5 h-5" />
         </button>
      </div>

      {/* Header / Show Info */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div>
               <h1 className="text-4xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                 {data.showInfo.title}
               </h1>
               <div className="flex flex-wrap gap-2 text-sm">
                 <span className="px-3 py-1 rounded-full bg-gray-700 text-gray-300 border border-gray-600">{data.showInfo.genre}</span>
                 {data.showInfo.stars.map((star, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-indigo-900/30 text-indigo-300 border border-indigo-800/50">{star}</span>
                 ))}
               </div>
            </div>
            {data.mediaType && (
                <div className="px-3 py-1 rounded border border-gray-600 text-xs text-gray-400 uppercase tracking-widest">
                    {data.mediaType === 'movie' ? 'Movie' : 'TV Show'}
                </div>
            )}
          </div>
          <p className="text-gray-300 text-lg leading-relaxed max-w-4xl">{data.showInfo.summary}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Audience Profile */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-lg print-break-inside-avoid">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="w-1 h-6 bg-purple-500 rounded-full mr-3"></span>
                Audience Profile
            </h2>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-900/50 p-4 rounded-xl">
                        <span className="text-gray-400 text-sm">Age Range</span>
                        <div className="text-xl font-semibold text-white mt-1">{data.audienceProfile.ageRange}</div>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-xl">
                        <span className="text-gray-400 text-sm">Avg Income</span>
                        <div className="text-xl font-semibold text-white mt-1">{data.audienceProfile.averageIncome}</div>
                    </div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-xl">
                     <span className="text-gray-400 text-sm block mb-2">Key Locations</span>
                     <div className="flex flex-wrap gap-2">
                        {data.audienceProfile.locations.map((loc, i) => (
                            <span key={i} className="text-sm text-gray-200 bg-gray-700 px-2 py-1 rounded">{loc}</span>
                        ))}
                     </div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-xl">
                     <span className="text-gray-400 text-sm block mb-2">Interests</span>
                     <div className="flex flex-wrap gap-2">
                        {data.audienceProfile.interests.map((int, i) => (
                            <span key={i} className="text-sm text-indigo-200 bg-indigo-900/30 border border-indigo-800/30 px-2 py-1 rounded">{int}</span>
                        ))}
                     </div>
                </div>
            </div>
        </div>

        {/* Competitor Analysis */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-lg print-break-inside-avoid">
             <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="w-1 h-6 bg-red-500 rounded-full mr-3"></span>
                Competitor Analysis
            </h2>
            <div className="space-y-4">
                {data.competitorAnalysis.map((comp, i) => (
                    <div key={i} className="bg-gray-900/50 p-4 rounded-xl border-l-4 border-gray-700 hover:border-red-500 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-white">{comp.title}</h3>
                            <span className="text-xs text-green-400 font-mono">{comp.success}</span>
                        </div>
                        <p className="text-sm text-gray-400">{comp.reason}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Marketing Plan */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-lg print-break-inside-avoid">
         <h2 className="text-xl font-bold text-white mb-6 flex items-center">
            <span className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></span>
            Marketing Strategy
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Ad Placements</h3>
                    <p className="text-gray-200 bg-gray-900/50 p-4 rounded-xl">{data.marketingPlan.adPlacements}</p>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Social Strategy</h3>
                    <p className="text-gray-200 bg-gray-900/50 p-4 rounded-xl">{data.marketingPlan.socialStrategy}</p>
                </div>
            </div>
             <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Ad Buy Implementation</h3>
                    <p className="text-gray-200 bg-gray-900/50 p-4 rounded-xl">{data.marketingPlan.adBuyImplementation}</p>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">{isMovie ? 'Cross Promotion / Tie-ins' : 'Cross Promotion Shows'}</h3>
                    <div className="flex flex-wrap gap-2 bg-gray-900/50 p-4 rounded-xl">
                        {data.marketingPlan.crossPromotionShows.map((show, i) => (
                             <span key={i} className="px-3 py-1 bg-purple-900/30 text-purple-300 rounded-lg border border-purple-800/50 text-sm">{show}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Budget & Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-gray-700">
             {/* Budget Chart */}
             <div>
                <h3 className="text-lg font-bold text-white mb-4">Budget Breakdown</h3>
                <div className="h-64 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.marketingPlan.budgetBreakdown}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="percentage"
                                nameKey="category"
                            >
                                {data.marketingPlan.budgetBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }}/>
                        </PieChart>
                     </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                    {data.marketingPlan.budgetBreakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-gray-400 border-b border-gray-700 pb-1">
                            <span>{item.category}</span>
                            <span>{item.tactics}</span>
                        </div>
                    ))}
                </div>
             </div>
             
             {/* Events */}
             <div>
                 <h3 className="text-lg font-bold text-white mb-4">Stunts & Events</h3>
                 <div className="space-y-4">
                     {data.marketingPlan.marketingEvents.map((event, i) => (
                         <div key={i} className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 rounded-xl border border-gray-700">
                             <div className="flex justify-between mb-1">
                                 <h4 className="font-bold text-indigo-300">{event.title}</h4>
                                 <span className="text-xs text-gray-500 uppercase">{event.category}</span>
                             </div>
                             <p className="text-sm text-gray-300">{event.description}</p>
                         </div>
                     ))}
                 </div>
             </div>
        </div>
      </div>

      {/* Key Art Concepts */}
      <div className="space-y-6 print-break-inside-avoid">
        <h2 className="text-2xl font-bold text-white flex items-center">
             <span className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full mr-4"></span>
             Key Art Concepts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.keyArtConcepts.map((concept, i) => (
                <div key={i} className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all shadow-lg flex flex-col">
                    <div className="aspect-video bg-gray-900 relative flex items-center justify-center">
                        {images[i] ? (
                            <img src={images[i]} alt={concept.title} className="w-full h-full object-cover" />
                        ) : concept.imageUrl ? (
                            <img src={concept.imageUrl} alt={concept.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-6">
                                <p className="text-gray-600 text-sm mb-4 italic line-clamp-3">"{concept.prompt}"</p>
                                <button 
                                    onClick={() => handleGenerateImage(i, concept.prompt)}
                                    disabled={generatingImageFor === i}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    {generatingImageFor === i ? 'Painting...' : 'Generate Art'}
                                </button>
                            </div>
                        )}
                        {/* Overlay Gradient for Text Readability if image exists */}
                         {(images[i] || concept.imageUrl) && (
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80"></div>
                         )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-2">{concept.title}</h3>
                        <p className="text-sm text-gray-400 mb-4 flex-1">{concept.description}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>

       {/* Chat Section */}
       <div className="pt-8 border-t border-gray-800 print-break-inside-avoid">
           <ChatInterface report={data} />
       </div>

      {/* Grounding Sources */}
      {data.groundingUrls && data.groundingUrls.length > 0 && (
          <div className="text-center pt-8 border-t border-gray-800 print-break-inside-avoid">
              <h4 className="text-sm font-semibold text-gray-500 mb-3">Sources verified by Google Search</h4>
              <div className="flex flex-wrap justify-center gap-2">
                  {data.groundingUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-900/20 px-2 py-1 rounded border border-indigo-900/50 truncate max-w-[200px]">
                          {new URL(url).hostname}
                      </a>
                  ))}
              </div>
          </div>
      )}

    </div>
  );
};

export default MarketingReportDisplay;