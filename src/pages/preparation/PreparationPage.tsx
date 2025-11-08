import { useState } from 'react';
import { Coffee } from 'lucide-react';
import { TeaProductionModal } from './TeaProductionModal';

export function PreparationPage() {
  const [showTeaProduction, setShowTeaProduction] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-secondary-900">Preparation</h1>
        <p className="text-secondary-600 mt-1">Manage tea production and batches</p>
      </div>

      {/* Tea Preparation Card */}
      <div 
        onClick={() => setShowTeaProduction(true)}
        className="card bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 border-2 border-amber-300 hover:border-amber-500 hover:shadow-2xl transition-all duration-300 cursor-pointer group relative overflow-hidden"
      >
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-600 rounded-full translate-y-24 -translate-x-24"></div>
        </div>

        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Coffee className="w-12 h-12 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-secondary-900 mb-2 group-hover:text-amber-700 transition-colors">
                  Tea Preparation
                </h2>
                <p className="text-base text-secondary-700 mb-3">
                  Create batches, produce tea, and track your production
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="px-3 py-1 bg-white/80 rounded-full text-amber-700 font-medium shadow-sm">
                    📦 Manage Batches
                  </span>
                  <span className="px-3 py-1 bg-white/80 rounded-full text-orange-700 font-medium shadow-sm">
                    🍵 Produce Tea
                  </span>
                  <span className="px-3 py-1 bg-white/80 rounded-full text-amber-700 font-medium shadow-sm">
                    📊 Track Production
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl shadow-lg group-hover:shadow-xl transition-all font-semibold text-lg">
                <span>Click to Start</span>
                <span className="text-2xl">→</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tea Production Modal */}
      {showTeaProduction && (
        <TeaProductionModal
          onClose={() => setShowTeaProduction(false)}
        />
      )}
    </div>
  );
}
