import { useState } from 'react';
import { X, Coffee, Layers, Play, History } from 'lucide-react';
import { SimplifiedBatchManagementView } from './SimplifiedBatchManagementView';
import { ProductionView } from './ProductionView';
import { ProductionHistoryView } from './ProductionHistoryView';

interface TeaProductionModalProps {
  onClose: () => void;
}

type ViewMode = 'batches' | 'produce' | 'history';

export function TeaProductionModal({ onClose }: TeaProductionModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('batches');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <div>
            <h2 className="text-2xl font-display font-bold text-secondary-900 flex items-center gap-3">
              <Coffee className="w-7 h-7 text-amber-600" />
              Tea Production System
            </h2>
            <p className="text-sm text-secondary-600 mt-1">
              Manage batches, produce tea, and track production
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setViewMode('batches')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              viewMode === 'batches'
                ? 'bg-white text-amber-600 border-b-2 border-amber-600'
                : 'text-secondary-600 hover:text-secondary-900 hover:bg-gray-100'
            }`}
          >
            <Layers className="w-5 h-5" />
            Manage Batches
          </button>
          <button
            onClick={() => setViewMode('produce')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              viewMode === 'produce'
                ? 'bg-white text-green-600 border-b-2 border-green-600'
                : 'text-secondary-600 hover:text-secondary-900 hover:bg-gray-100'
            }`}
          >
            <Play className="w-5 h-5" />
            Produce Tea
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
              viewMode === 'history'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-secondary-600 hover:text-secondary-900 hover:bg-gray-100'
            }`}
          >
            <History className="w-5 h-5" />
            Production History
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {viewMode === 'batches' && <SimplifiedBatchManagementView />}
          {viewMode === 'produce' && <ProductionView />}
          {viewMode === 'history' && <ProductionHistoryView />}
        </div>
      </div>
    </div>
  );
}
