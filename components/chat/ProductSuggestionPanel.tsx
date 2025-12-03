'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, ArrowRight, CheckCircle, Clock, DollarSign, Zap, Book, Code, Video, Users, FileText, Loader2 } from 'lucide-react';

export interface ProductSuggestion {
  id: string;
  type: string;
  name: string;
  description: string;
  matchScore: number;
  skillsMatch: string[];
  timeToLaunch: string;
  revenueModel: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  whyThisProduct: string;
  mvpScope: string[];
  estimatedEarnings: string;
}

interface ProductSuggestionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: ProductSuggestion[];
  researchSummary: {
    niche: string;
    uvz: string;
    targetAudience: string;
  };
  sessionId: string;
  isLoading?: boolean;
}

const PRODUCT_ICONS: Record<string, any> = {
  ebook: Book,
  course: Video,
  template: FileText,
  saas: Code,
  community: Users,
  default: Zap,
};

export default function ProductSuggestionPanel({
  isOpen,
  onClose,
  suggestions,
  researchSummary,
  sessionId,
  isLoading = false,
}: ProductSuggestionPanelProps) {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartBuilding = (suggestion: ProductSuggestion) => {
    // Navigate to builder with product context
    router.push(`/builder?session=${sessionId}&product=${suggestion.id}&type=${suggestion.type}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-700 border-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Hard': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white border-4 border-black rounded-2xl shadow-brutal max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-gradient-to-r from-purple-500 to-pink-500">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-black text-white">Your Product Recommendations</h2>
              <p className="text-sm text-white/80">Based on your research and skills</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Research Summary */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Niche:</span>
              <p className="font-bold truncate">{researchSummary.niche}</p>
            </div>
            <div>
              <span className="text-gray-500">UVZ:</span>
              <p className="font-bold truncate">{researchSummary.uvz}</p>
            </div>
            <div>
              <span className="text-gray-500">Audience:</span>
              <p className="font-bold truncate">{researchSummary.targetAudience}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 animate-spin text-uvz-orange mb-4" />
              <h3 className="text-xl font-black mb-2">Analyzing Your Profile...</h3>
              <p className="text-gray-600">Matching your skills to the best product opportunities</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => {
                const Icon = PRODUCT_ICONS[suggestion.type] || PRODUCT_ICONS.default;
                const isSelected = selectedProduct === suggestion.id;

                return (
                  <div
                    key={suggestion.id}
                    className={`border-2 rounded-xl overflow-hidden transition-all ${
                      isSelected
                        ? 'border-uvz-orange shadow-brutal'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Card Header */}
                    <button
                      onClick={() => setSelectedProduct(isSelected ? null : suggestion.id)}
                      className="w-full p-4 text-left bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* Rank Badge */}
                        <div className={`w-10 h-10 rounded-lg border-2 border-black flex items-center justify-center font-black text-white ${
                          index === 0 ? 'bg-uvz-orange' : index === 1 ? 'bg-purple-500' : 'bg-blue-500'
                        }`}>
                          #{index + 1}
                        </div>

                        {/* Icon */}
                        <div className="w-12 h-12 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-gray-700" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-black text-lg">{suggestion.name}</h3>
                            <span className={`px-2 py-0.5 text-xs font-bold rounded border ${getDifficultyColor(suggestion.difficulty)}`}>
                              {suggestion.difficulty}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-2">{suggestion.description}</p>
                        </div>

                        {/* Match Score */}
                        <div className="text-right shrink-0">
                          <div className="text-2xl font-black text-uvz-orange">{suggestion.matchScore}%</div>
                          <div className="text-xs text-gray-500">Match</div>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {isSelected && (
                      <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                        <div className="pt-4 space-y-4">
                          {/* Why This Product */}
                          <div>
                            <h4 className="font-bold text-sm text-gray-700 mb-2">Why This Product?</h4>
                            <p className="text-sm text-gray-600">{suggestion.whyThisProduct}</p>
                          </div>

                          {/* Skills Match */}
                          <div>
                            <h4 className="font-bold text-sm text-gray-700 mb-2">Skills Match</h4>
                            <div className="flex flex-wrap gap-2">
                              {suggestion.skillsMatch.map(skill => (
                                <span key={skill} className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="p-3 bg-white rounded-lg border border-gray-200">
                              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                                <Clock className="w-3 h-3" />
                                Time to Launch
                              </div>
                              <div className="font-bold">{suggestion.timeToLaunch}</div>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-gray-200">
                              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                                <DollarSign className="w-3 h-3" />
                                Revenue Model
                              </div>
                              <div className="font-bold">{suggestion.revenueModel}</div>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-gray-200">
                              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                                <Zap className="w-3 h-3" />
                                Est. Earnings
                              </div>
                              <div className="font-bold text-green-600">{suggestion.estimatedEarnings}</div>
                            </div>
                          </div>

                          {/* MVP Scope */}
                          <div>
                            <h4 className="font-bold text-sm text-gray-700 mb-2">MVP Scope</h4>
                            <ul className="space-y-1">
                              {suggestion.mvpScope.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                  <span className="text-uvz-orange font-bold">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={() => handleStartBuilding(suggestion)}
                            className="w-full py-3 bg-uvz-orange text-white font-bold border-2 border-black rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                          >
                            Start Building This Product
                            <ArrowRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t-2 border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-500">
            Click a product to see details and start building
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 font-bold text-gray-600 hover:text-black transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
