import React from 'react';
import { HistoryItem } from '../types';
import { XMarkIcon, TrashIcon, BoltIcon, StarIcon, BrainIcon } from './IconComponents';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onDelete,
  onClear,
}) => {
  return (
    <div
      className={`fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-gray-900 border-l border-gray-800 shadow-2xl flex flex-col">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">History</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No history yet.</p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-indigo-500 transition-colors cursor-pointer group relative"
                onClick={() => {
                   onSelect(item);
                   onClose();
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-200 truncate pr-6">{item.showInfo.title}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    className="text-gray-500 hover:text-red-500 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center text-xs text-gray-500 space-x-2">
                  <span>{new Date(item.timestamp || 0).toLocaleDateString()}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    {item.modelUsed === 'thinking' && <BrainIcon className="w-3 h-3 text-emerald-500" />}
                    {item.modelUsed === 'pro' && <StarIcon className="w-3 h-3 text-purple-500" />}
                    {(!item.modelUsed || item.modelUsed === 'fast') && <BoltIcon className="w-3 h-3 text-indigo-500" />}
                    <span className="capitalize">{item.modelUsed || 'Fast'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {history.length > 0 && (
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={onClear}
              className="w-full py-2 px-4 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-medium transition-colors"
            >
              Clear All History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorySidebar;