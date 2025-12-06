'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, Loader2, Sparkles, ArrowRight, Clock, Zap, Star, BookOpen, Palette, Code, Video, Users, BarChart3, Search, GraduationCap, ChevronRight, AlertCircle } from 'lucide-react';
import { PRODUCT_TYPES, ProductTypeConfig, getRecommendedProductTypes } from '@/lib/product-types';

interface Skill {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const SKILLS: Skill[] = [
  { id: 'writing', name: 'Writing & Content', icon: '✍️', description: 'Blog posts, ebooks, copywriting' },
  { id: 'design', name: 'Design & Visual', icon: '🎨', description: 'Graphics, UI/UX, branding' },
  { id: 'coding', name: 'Development', icon: '💻', description: 'Web apps, mobile, automation' },
  { id: 'video', name: 'Video & Audio', icon: '🎬', description: 'YouTube, podcasts, courses' },
  { id: 'teaching', name: 'Teaching & Coaching', icon: '📚', description: 'Courses, workshops, mentoring' },
  { id: 'marketing', name: 'Marketing & Sales', icon: '📈', description: 'Ads, funnels, outreach' },
  { id: 'research', name: 'Research & Analysis', icon: '🔬', description: 'Data, reports, insights' },
  { id: 'community', name: 'Community Building', icon: '👥', description: 'Groups, events, networking' },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', name: 'Beginner', description: 'Just starting out', icon: '🌱' },
  { id: 'intermediate', name: 'Intermediate', description: '1-3 years experience', icon: '🌿' },
  { id: 'advanced', name: 'Advanced', description: '3+ years experience', icon: '🌳' },
  { id: 'expert', name: 'Expert', description: 'Industry professional', icon: '⭐' },
];

const TIME_COMMITMENTS = [
  { id: 'minimal', name: 'Side Project', description: '5-10 hrs/week', icon: '🌙' },
  { id: 'moderate', name: 'Part-time', description: '10-20 hrs/week', icon: '☀️' },
  { id: 'full', name: 'Full-time', description: '20+ hrs/week', icon: '🚀' },
];

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 text-green-700 border-green-200',
  intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  advanced: 'bg-red-100 text-red-700 border-red-200',
};

export interface EnhancedSkillsData {
  skills: string[];
  experienceLevel: string;
  timeCommitment: string;
  additionalNotes: string;
  selectedProductType: string;
}

interface EnhancedSkillsAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: EnhancedSkillsData) => void;
  isLoading?: boolean;
  embedded?: boolean;
}

export default function EnhancedSkillsAssessmentModal({
  isOpen,
  onClose,
  onComplete,
  isLoading = false,
  embedded = false,
}: EnhancedSkillsAssessmentModalProps) {
  const [step, setStep] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [timeCommitment, setTimeCommitment] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [selectedProductType, setSelectedProductType] = useState<ProductTypeConfig | null>(null);
  const [recommendedTypes, setRecommendedTypes] = useState<ProductTypeConfig[]>([]);
  const [showAllTypes, setShowAllTypes] = useState(false);

  // Update recommendations when skills/experience change
  useEffect(() => {
    if (selectedSkills.length > 0 && experienceLevel) {
      const recommended = getRecommendedProductTypes(selectedSkills, experienceLevel);
      setRecommendedTypes(recommended);
    }
  }, [selectedSkills, experienceLevel]);

  if (!isOpen) return null;

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(s => s !== skillId)
        : [...prev, skillId]
    );
  };

  const handleSubmit = () => {
    onComplete({
      skills: selectedSkills,
      experienceLevel,
      timeCommitment,
      additionalNotes,
      selectedProductType: selectedProductType?.id || '',
    });
  };

  const canProceed = () => {
    if (step === 1) return selectedSkills.length > 0;
    if (step === 2) return experienceLevel !== '';
    if (step === 3) return timeCommitment !== '';
    if (step === 4) return selectedProductType !== null;
    return true;
  };

  const totalSteps = 5;

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Easy';
      case 'intermediate': return 'Medium';
      case 'advanced': return 'Advanced';
      default: return difficulty;
    }
  };

  // Content shared between modal and embedded modes
  const renderContent = () => (
    <>
      {/* Progress */}
      <div className={`px-3 sm:px-6 py-2 sm:py-3 bg-gray-50 ${embedded ? 'rounded-t-xl' : 'border-b border-gray-200'}`}>
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-gray-500 mb-1.5 sm:mb-2">
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round((step / totalSteps) * 100)}% Complete</span>
        </div>
        <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-uvz-orange transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] sm:text-xs text-gray-400">
          <span className={step >= 1 ? 'text-uvz-orange font-bold' : ''}>Skills</span>
          <span className={step >= 2 ? 'text-uvz-orange font-bold' : ''}>Experience</span>
          <span className={step >= 3 ? 'text-uvz-orange font-bold' : ''}>Time</span>
          <span className={step >= 4 ? 'text-uvz-orange font-bold' : ''}>Product</span>
          <span className={step >= 5 ? 'text-uvz-orange font-bold' : ''}>Confirm</span>
        </div>
      </div>

      {/* Steps Content */}
      <div className="p-3 sm:p-6 overflow-y-auto flex-1">
        {renderStepContent()}
      </div>

      {/* Footer */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 sm:px-6 py-2.5 font-bold text-gray-600 hover:text-black transition-colors text-sm sm:text-base"
            >
              Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-2.5 font-bold text-gray-600 hover:text-black transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
          )}

          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-8 py-2.5 sm:py-3 bg-uvz-orange text-white font-bold border-2 border-black rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-sm sm:text-base"
            >
              Continue
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-2 border-black rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all disabled:opacity-50 text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  Start Building
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );

  const renderStepContent = () => {
    // Step 1: Skills Selection
    if (step === 1) {
      return (
        <div>
          <h3 className="text-base sm:text-lg font-black mb-1 sm:mb-2">What are your strongest skills?</h3>
          <p className="text-gray-600 text-xs sm:text-base mb-3 sm:mb-6">Select all that apply. We&apos;ll match you with products that leverage your abilities.</p>
          
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {SKILLS.map(skill => (
              <button
                key={skill.id}
                onClick={() => toggleSkill(skill.id)}
                className={`p-2 sm:p-4 border-2 rounded-lg sm:rounded-xl text-left transition-all ${
                  selectedSkills.includes(skill.id)
                    ? 'border-uvz-orange bg-orange-50 shadow-brutal-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl">{skill.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="font-bold text-xs sm:text-sm">{skill.name}</span>
                      {selectedSkills.includes(skill.id) && (
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-uvz-orange shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 hidden sm:block">{skill.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Step 2: Experience Level
    if (step === 2) {
      return (
        <div>
          <h3 className="text-base sm:text-lg font-black mb-1 sm:mb-2">What&apos;s your experience level?</h3>
          <p className="text-gray-600 text-xs sm:text-base mb-3 sm:mb-6">This helps us recommend the right product complexity.</p>
          
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {EXPERIENCE_LEVELS.map(level => (
              <button
                key={level.id}
                onClick={() => setExperienceLevel(level.id)}
                className={`p-3 sm:p-4 border-2 rounded-lg sm:rounded-xl text-left transition-all ${
                  experienceLevel === level.id
                    ? 'border-uvz-orange bg-orange-50 shadow-brutal-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-2xl sm:text-3xl">{level.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base">{level.name}</span>
                      {experienceLevel === level.id && (
                        <CheckCircle className="w-4 h-4 text-uvz-orange" />
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">{level.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Step 3: Time Commitment
    if (step === 3) {
      return (
        <div>
          <h3 className="text-base sm:text-lg font-black mb-1 sm:mb-2">How much time can you dedicate?</h3>
          <p className="text-gray-600 text-xs sm:text-base mb-3 sm:mb-6">Be realistic - consistency beats intensity.</p>
          
          <div className="grid gap-2 sm:gap-3">
            {TIME_COMMITMENTS.map(time => (
              <button
                key={time.id}
                onClick={() => setTimeCommitment(time.id)}
                className={`p-3 sm:p-4 border-2 rounded-lg sm:rounded-xl text-left transition-all ${
                  timeCommitment === time.id
                    ? 'border-uvz-orange bg-orange-50 shadow-brutal-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-2xl sm:text-3xl">{time.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base">{time.name}</span>
                      {timeCommitment === time.id && (
                        <CheckCircle className="w-4 h-4 text-uvz-orange" />
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">{time.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-4 sm:mt-6">
            <label className="block text-sm font-bold mb-2">Additional Notes (optional)</label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any specific goals or constraints we should know about?"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl text-sm focus:outline-none focus:border-uvz-orange resize-none"
              rows={3}
            />
          </div>
        </div>
      );
    }

    // Step 4: Product Type Selection
    if (step === 4) {
      const typesToShow = showAllTypes ? PRODUCT_TYPES : recommendedTypes.slice(0, 6);
      
      return (
        <div>
          <h3 className="text-base sm:text-lg font-black mb-1 sm:mb-2">Choose your product type</h3>
          <p className="text-gray-600 text-xs sm:text-base mb-3 sm:mb-6">
            Based on your skills, here are our recommendations. Each product type has its own guided workflow.
          </p>
          
          {recommendedTypes.length > 0 && !showAllTypes && (
            <div className="mb-4 p-3 bg-green-50 border-2 border-green-200 rounded-xl flex items-start gap-2">
              <Star className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-green-800 text-sm">Recommended for you</span>
                <p className="text-xs text-green-700">These match your skills and experience level</p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4">
            {typesToShow.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedProductType(type)}
                className={`p-3 sm:p-4 border-2 rounded-lg sm:rounded-xl text-left transition-all ${
                  selectedProductType?.id === type.id
                    ? 'border-uvz-orange bg-orange-50 shadow-brutal-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-2xl sm:text-3xl">{type.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{type.name}</span>
                      <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full border ${
                        DIFFICULTY_COLORS[type.difficulty as keyof typeof DIFFICULTY_COLORS]
                      }`}>
                        {getDifficultyLabel(type.difficulty)}
                      </span>
                      {selectedProductType?.id === type.id && (
                        <CheckCircle className="w-4 h-4 text-uvz-orange" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{type.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] sm:text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {type.estimatedTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {type.aiTools.length} AI tools
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {!showAllTypes && recommendedTypes.length < PRODUCT_TYPES.length && (
            <button
              onClick={() => setShowAllTypes(true)}
              className="w-full p-3 text-center text-sm font-bold text-gray-500 hover:text-black border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 transition-colors"
            >
              Show all {PRODUCT_TYPES.length} product types
            </button>
          )}
        </div>
      );
    }

    // Step 5: Confirmation
    if (step === 5) {
      return (
        <div>
          <h3 className="text-base sm:text-lg font-black mb-1 sm:mb-2">Ready to start building!</h3>
          <p className="text-gray-600 text-xs sm:text-base mb-4 sm:mb-6">Review your choices before we begin.</p>
          
          <div className="space-y-3 sm:space-y-4">
            {/* Summary Card */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl">
              {selectedProductType && (
                <div className="flex items-center gap-3 sm:gap-4 mb-4 pb-4 border-b border-gray-200">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-uvz-orange/10 rounded-xl flex items-center justify-center">
                    <span className="text-3xl sm:text-4xl">{selectedProductType.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-black text-lg sm:text-xl">{selectedProductType.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-500">{selectedProductType.description}</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Skills</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedSkills.map(skillId => {
                      const skill = SKILLS.find(s => s.id === skillId);
                      return skill ? (
                        <span key={skillId} className="inline-flex items-center gap-1 px-2 py-0.5 bg-uvz-orange/10 text-uvz-orange rounded-full text-xs font-bold">
                          {skill.icon} {skill.name.split(' ')[0]}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Experience</span>
                  <p className="font-bold">{EXPERIENCE_LEVELS.find(l => l.id === experienceLevel)?.name}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Time Commitment</span>
                  <p className="font-bold">{TIME_COMMITMENTS.find(t => t.id === timeCommitment)?.name}</p>
                </div>
                {selectedProductType && (
                  <div>
                    <span className="text-gray-500 text-xs">Estimated Time</span>
                    <p className="font-bold">{selectedProductType.estimatedTime}</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Tools Preview */}
            {selectedProductType && (
              <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span className="font-bold text-sm text-purple-800">AI Tools You&apos;ll Use</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedProductType.aiTools.slice(0, 5).map(toolId => (
                    <span key={toolId} className="px-2 py-1 bg-white text-purple-700 text-xs font-bold rounded-full border border-purple-200 capitalize">
                      {toolId}
                    </span>
                  ))}
                  {selectedProductType.aiTools.length > 5 && (
                    <span className="px-2 py-1 bg-purple-200 text-purple-700 text-xs font-bold rounded-full">
                      +{selectedProductType.aiTools.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Steps Preview */}
            {selectedProductType && (
              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-sm text-blue-800">Your Building Journey</span>
                </div>
                <div className="space-y-2">
                  {selectedProductType.steps.slice(0, 4).map((buildStep, index) => (
                    <div key={buildStep.id} className="flex items-center gap-2 text-sm">
                      <div className="w-5 h-5 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="text-blue-800">{buildStep.name}</span>
                      <ChevronRight className="w-4 h-4 text-blue-400" />
                    </div>
                  ))}
                  {selectedProductType.steps.length > 4 && (
                    <div className="flex items-center gap-2 text-sm text-blue-500">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-xs">
                        ...
                      </div>
                      <span>+{selectedProductType.steps.length - 4} more steps</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  // Embedded mode - render without modal wrapper
  if (embedded) {
    return (
      <div className="flex flex-col">
        {renderContent()}
      </div>
    );
  }

  // Modal mode
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white border-2 sm:border-4 border-black rounded-xl sm:rounded-2xl shadow-brutal max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b-2 border-black bg-gradient-to-r from-uvz-orange to-orange-400">
          <div className="flex items-center gap-2 sm:gap-3">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            <h2 className="text-base sm:text-xl font-black text-white">Product Builder Setup</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
