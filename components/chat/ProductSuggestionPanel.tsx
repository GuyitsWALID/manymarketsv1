'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, ArrowRight, CheckCircle, Clock, DollarSign, Zap, Book, Code, Video, Users, FileText, Loader2, Crown, Lock } from 'lucide-react';
import { ENABLE_PRICING } from '@/lib/config';

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
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [checkingPlan, setCheckingPlan] = useState(true);
  const [creatingProduct, setCreatingProduct] = useState(false);

  // Check user's subscription when panel opens
  useEffect(() => {
    if (isOpen) {
      checkSubscription();
    }
  }, [isOpen]);

  const checkSubscription = async () => {
    // If pricing is disabled, treat all users as Pro for product creation
    if (!ENABLE_PRICING) {
      setIsPro(true);
      setCheckingPlan(false);
      return;
    }

    try {
      const response = await fetch('/api/billing');
      if (response.ok) {
        const data = await response.json();
        const plan = data.currentPlan || 'free';
        setIsPro(plan === 'pro' || plan === 'enterprise');
      } else {
        setIsPro(false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsPro(false);
    } finally {
      setCheckingPlan(false);
    }
  };

  if (!isOpen) return null;

  const handleStartBuilding = async (suggestion: ProductSuggestion) => {
    // If not Pro, redirect to upgrade page
    if (!isPro) {
      router.push('/upgrade');
      return;
    }

    // Create product in database first
    setCreatingProduct(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          name: suggestion.name,
          description: suggestion.description,
          productType: suggestion.type,
          tagline: suggestion.whyThisProduct,
          mvpScope: suggestion.mvpScope,
          revenueModel: suggestion.revenueModel,
          timeToLaunch: suggestion.timeToLaunch,
          difficulty: suggestion.difficulty,
          estimatedEarnings: suggestion.estimatedEarnings,
          skillsMatch: suggestion.skillsMatch,
          matchScore: suggestion.matchScore,
          // Include research context for the builder
          researchContext: {
            niche: researchSummary.niche,
            uvz: researchSummary.uvz,
            targetAudience: researchSummary.targetAudience,
          },
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      // Navigate to builder with product ID
      router.push(`/builder?product=${data.product.id}`);
    } catch (error) {
      console.error('Error creating product:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to create product: ${message}`);
    } finally {
      setCreatingProduct(false);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white border-2 sm:border-4 border-black rounded-xl sm:rounded-2xl shadow-brutal max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b-2 border-black bg-gradient-to-r from-purple-500 to-pink-500">
          <div className="flex items-center gap-2 sm:gap-3">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            <div>
              <h2 className="text-base sm:text-xl font-black text-white">Product Recommendations</h2>
              <p className="text-xs sm:text-sm text-white/80 hidden sm:block">Based on your research and skills</p>
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
        <div className="px-3 sm:px-6 py-2 sm:py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-gray-500">Niche:</span>
              <p className="font-bold truncate">{researchSummary.niche}</p>
            </div>
            <div className="hidden sm:block">
              <span className="text-gray-500">UVZ:</span>
              <p className="font-bold truncate">{researchSummary.uvz}</p>
            </div>
            <div className="hidden sm:block">
              <span className="text-gray-500">Audience:</span>
              <p className="font-bold truncate">{researchSummary.targetAudience}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-16">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-uvz-orange mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-black mb-2 text-center">Analyzing Your Profile...</h3>
              <p className="text-gray-600 text-sm sm:text-base text-center">Matching your skills to the best product opportunities</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {suggestions.map((suggestion, index) => {
                const Icon = PRODUCT_ICONS[suggestion.type] || PRODUCT_ICONS.default;
                const isSelected = selectedProduct === suggestion.id;

                return (
                  <div
                    key={suggestion.id}
                    className={`border-2 rounded-lg sm:rounded-xl overflow-hidden transition-all ${
                      isSelected
                        ? 'border-uvz-orange shadow-brutal'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Card Header */}
                    <button
                      onClick={() => setSelectedProduct(isSelected ? null : suggestion.id)}
                      className="w-full p-3 sm:p-4 text-left bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-2 sm:gap-4">
                        {/* Rank Badge */}
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 border-black flex items-center justify-center font-black text-white text-sm sm:text-base ${
                          index === 0 ? 'bg-uvz-orange' : index === 1 ? 'bg-purple-500' : 'bg-blue-500'
                        }`}>
                          #{index + 1}
                        </div>

                        {/* Icon - Hidden on mobile */}
                        <div className="hidden sm:flex w-12 h-12 bg-gray-100 rounded-lg border-2 border-gray-200 items-center justify-center">
                          <Icon className="w-6 h-6 text-gray-700" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                            <h3 className="font-black text-sm sm:text-lg">{suggestion.name}</h3>
                            <span className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded border ${getDifficultyColor(suggestion.difficulty)}`}>
                              {suggestion.difficulty}
                            </span>
                          </div>
                          <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">{suggestion.description}</p>
                        </div>

                        {/* Match Score */}
                        <div className="text-right shrink-0">
                          <div className="text-xl sm:text-2xl font-black text-uvz-orange">{suggestion.matchScore}%</div>
                          <div className="text-[10px] sm:text-xs text-gray-500">Match</div>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {isSelected && (
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-gray-100 bg-gray-50">
                        <div className="pt-3 sm:pt-4 space-y-3 sm:space-y-4">
                          {/* Why This Product */}
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2">Why This Product?</h4>
                            <p className="text-xs sm:text-sm text-gray-600">{suggestion.whyThisProduct}</p>
                          </div>

                          {/* Skills Match */}
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2">Skills Match</h4>
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                              {suggestion.skillsMatch.map(skill => (
                                <span key={skill} className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-100 text-green-700 text-[10px] sm:text-xs font-bold rounded-full flex items-center gap-1">
                                  <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-2 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-white rounded-lg border border-gray-200">
                              <div className="flex items-center gap-1 sm:gap-2 text-gray-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">
                                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span className="hidden sm:inline">Time to Launch</span>
                                <span className="sm:hidden">Time</span>
                              </div>
                              <div className="font-bold text-xs sm:text-base">{suggestion.timeToLaunch}</div>
                            </div>
                            <div className="p-2 sm:p-3 bg-white rounded-lg border border-gray-200">
                              <div className="flex items-center gap-1 sm:gap-2 text-gray-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">
                                <DollarSign className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span className="hidden sm:inline">Revenue Model</span>
                                <span className="sm:hidden">Revenue</span>
                              </div>
                              <div className="font-bold text-xs sm:text-base">{suggestion.revenueModel}</div>
                            </div>
                            <div className="p-2 sm:p-3 bg-white rounded-lg border border-gray-200">
                              <div className="flex items-center gap-1 sm:gap-2 text-gray-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">
                                <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span className="hidden sm:inline">Est. Earnings</span>
                                <span className="sm:hidden">Earnings</span>
                              </div>
                              <div className="font-bold text-green-600 text-xs sm:text-base">{suggestion.estimatedEarnings}</div>
                            </div>
                          </div>

                          {/* MVP Scope */}
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2">MVP Scope</h4>
                            <ul className="space-y-0.5 sm:space-y-1">
                              {suggestion.mvpScope.map((item, i) => (
                                <li key={i} className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                                  <span className="text-uvz-orange font-bold">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={() => handleStartBuilding(suggestion)}
                            disabled={creatingProduct || checkingPlan}
                            className={`w-full py-2.5 sm:py-3 font-bold text-sm sm:text-base border-2 border-black rounded-lg sm:rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                              isPro 
                                ? 'bg-uvz-orange text-white' 
                                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            }`}
                          >
                            {creatingProduct ? (
                              <>
                                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                <span className="hidden sm:inline">Creating Product...</span>
                                <span className="sm:hidden">Creating...</span>
                              </>
                            ) : checkingPlan ? (
                              <>
                                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                Checking...
                              </>
                            ) : isPro ? (
                              <>
                                <span className="hidden sm:inline">Start Building This Product</span>
                                <span className="sm:hidden">Start Building</span>
                                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                              </>
                            ) : (
                              <>
                                <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="hidden sm:inline">Upgrade to Pro to Build</span>
                                <span className="sm:hidden">Upgrade to Build</span>
                                <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                              </>
                            )}
                          </button>
                          {!isPro && !checkingPlan && (
                            <p className="text-center text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
                              Product Builder is a Pro feature
                            </p>
                          )}
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
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-t-2 border-gray-200 bg-gray-50">
          <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
            Click a product to see details and start building
          </p>
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 font-bold text-sm text-gray-600 hover:text-black transition-colors sm:ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
