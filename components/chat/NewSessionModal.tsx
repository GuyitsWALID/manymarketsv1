'use client';

import { useState } from 'react';
import { X, Sparkles, Target, Briefcase, Lightbulb, ArrowRight, Loader2 } from 'lucide-react';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSession: (data: { title: string; industry: string; goal: string }) => Promise<void>;
  isCreating: boolean;
}

const INDUSTRIES = [
  { id: 'tech', name: 'Technology & Software', icon: '💻' },
  { id: 'health', name: 'Health & Wellness', icon: '🏥' },
  { id: 'finance', name: 'Finance & Business', icon: '💰' },
  { id: 'education', name: 'Education & Learning', icon: '📚' },
  { id: 'creative', name: 'Creative & Design', icon: '🎨' },
  { id: 'lifestyle', name: 'Lifestyle & Personal', icon: '🌟' },
  { id: 'ecommerce', name: 'E-commerce & Retail', icon: '🛒' },
  { id: 'marketing', name: 'Marketing & Sales', icon: '📈' },
  { id: 'other', name: 'Other / Not Sure', icon: '🔍' },
];

const GOALS = [
  { id: 'find_niche', label: 'Find a profitable niche', description: 'Discover underserved market opportunities' },
  { id: 'validate_idea', label: 'Validate a business idea', description: 'Test if your idea has market demand' },
  { id: 'create_product', label: 'Create a digital product', description: 'Build an ebook, course, or SaaS' },
  { id: 'explore', label: 'Just explore opportunities', description: 'Browse and learn about markets' },
];

export default function NewSessionModal({ isOpen, onClose, onCreateSession, isCreating }: NewSessionModalProps) {
  const [step, setStep] = useState(1);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [customIndustry, setCustomIndustry] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCreate = async () => {
    const industry = selectedIndustry === 'other' ? customIndustry : INDUSTRIES.find(i => i.id === selectedIndustry)?.name || '';
    const goal = GOALS.find(g => g.id === selectedGoal)?.label || '';
    const title = sessionTitle || `${industry} Research`;
    
    await onCreateSession({ title, industry, goal });
  };

  const canProceed = () => {
    if (step === 1) return selectedIndustry !== '';
    if (step === 2) return selectedGoal !== '';
    if (step === 3) return true;
    return false;
  };

  const resetAndClose = () => {
    setStep(1);
    setSelectedIndustry('');
    setSelectedGoal('');
    setCustomIndustry('');
    setSessionTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={resetAndClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white border-2 sm:border-4 border-black rounded-lg w-full max-w-lg shadow-brutal overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b-2 border-black bg-uvz-orange">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            <h2 className="font-black text-white text-sm sm:text-base">New UVZ Research Session</h2>
          </div>
          <button 
            onClick={resetAndClose}
            className="p-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 p-3 sm:p-4 bg-gray-50 border-b-2 border-black">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-1 sm:gap-2">
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-black flex items-center justify-center font-bold text-xs sm:text-sm transition-colors ${
                step >= s ? 'bg-uvz-orange text-white' : 'bg-white text-gray-400'
              }`}>
                {s}
              </div>
              {s < 3 && (
                <div className={`w-4 sm:w-8 h-0.5 ${step > s ? 'bg-uvz-orange' : 'bg-gray-300'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Content - Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* Step 1: Industry Selection */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-uvz-orange" />
                <h3 className="font-bold text-base sm:text-lg">What industry interests you?</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                Select the market area you want to explore for your UVZ discovery.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {INDUSTRIES.map((industry) => (
                  <button
                    key={industry.id}
                    onClick={() => setSelectedIndustry(industry.id)}
                    className={`p-2 sm:p-3 border-2 border-black rounded text-center transition-all hover:shadow-brutal ${
                      selectedIndustry === industry.id 
                        ? 'bg-uvz-orange text-white shadow-brutal' 
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl block mb-1">{industry.icon}</span>
                    <span className="text-[10px] sm:text-xs font-bold block leading-tight">{industry.name}</span>
                  </button>
                ))}
              </div>
              {selectedIndustry === 'other' && (
                <input
                  type="text"
                  value={customIndustry}
                  onChange={(e) => setCustomIndustry(e.target.value)}
                  placeholder="Enter your industry..."
                  className="w-full mt-3 sm:mt-4 p-2 sm:p-3 border-2 border-black rounded font-medium text-sm focus:outline-none focus:ring-2 focus:ring-uvz-orange"
                />
              )}
            </div>
          )}

          {/* Step 2: Goal Selection */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-uvz-orange" />
                <h3 className="font-bold text-base sm:text-lg">What&apos;s your goal?</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                This helps me guide you through the right UVZ discovery process.
              </p>
              <div className="space-y-2 sm:space-y-3">
                {GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    className={`w-full p-3 sm:p-4 border-2 border-black rounded text-left transition-all hover:shadow-brutal ${
                      selectedGoal === goal.id 
                        ? 'bg-uvz-orange text-white shadow-brutal' 
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-bold block text-sm sm:text-base">{goal.label}</span>
                    <span className={`text-xs sm:text-sm ${selectedGoal === goal.id ? 'text-white/80' : 'text-gray-500'}`}>
                      {goal.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Session Name */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-uvz-orange" />
                <h3 className="font-bold text-base sm:text-lg">Name your session</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                Give your research session a name to easily find it later.
              </p>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder={`${INDUSTRIES.find(i => i.id === selectedIndustry)?.name || 'My'} Research`}
                className="w-full p-3 sm:p-4 border-2 border-black rounded font-bold text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-uvz-orange"
              />
              
              {/* Summary */}
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 border-2 border-black rounded">
                <h4 className="font-bold text-xs sm:text-sm text-gray-600 mb-2">Session Summary</h4>
                <div className="space-y-1 text-xs sm:text-sm">
                  <p><span className="font-bold">Industry:</span> {selectedIndustry === 'other' ? customIndustry : INDUSTRIES.find(i => i.id === selectedIndustry)?.name}</p>
                  <p><span className="font-bold">Goal:</span> {GOALS.find(g => g.id === selectedGoal)?.label}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-t-2 border-black bg-gray-50">
          <button
            onClick={step === 1 ? resetAndClose : handleBack}
            className="px-3 sm:px-4 py-2 border-2 border-black rounded font-bold text-sm hover:bg-gray-100 transition-colors"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-4 sm:px-6 py-2 bg-uvz-orange text-white border-2 border-black rounded font-bold text-sm flex items-center gap-2 hover:shadow-brutal transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="px-4 sm:px-6 py-2 bg-uvz-orange text-white border-2 border-black rounded font-bold text-sm flex items-center gap-2 hover:shadow-brutal transition-all disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Creating...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Start Research</span>
                  <span className="sm:hidden">Start</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
