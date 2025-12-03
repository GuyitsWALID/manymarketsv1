'use client';

import { useState } from 'react';
import { X, CheckCircle, Loader2, Sparkles } from 'lucide-react';

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
  { id: 'beginner', name: 'Beginner', description: 'Just starting out' },
  { id: 'intermediate', name: 'Intermediate', description: '1-3 years experience' },
  { id: 'advanced', name: 'Advanced', description: '3+ years experience' },
  { id: 'expert', name: 'Expert', description: 'Industry professional' },
];

const TIME_COMMITMENTS = [
  { id: 'minimal', name: 'Side Project', description: '5-10 hrs/week' },
  { id: 'moderate', name: 'Part-time', description: '10-20 hrs/week' },
  { id: 'full', name: 'Full-time', description: '20+ hrs/week' },
];

export interface SkillsData {
  skills: string[];
  experienceLevel: string;
  timeCommitment: string;
  additionalNotes: string;
}

interface SkillsAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SkillsData) => void;
  isLoading?: boolean;
}

export default function SkillsAssessmentModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: SkillsAssessmentModalProps) {
  const [step, setStep] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [timeCommitment, setTimeCommitment] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  if (!isOpen) return null;

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(s => s !== skillId)
        : [...prev, skillId]
    );
  };

  const handleSubmit = () => {
    onSubmit({
      skills: selectedSkills,
      experienceLevel,
      timeCommitment,
      additionalNotes,
    });
  };

  const canProceed = () => {
    if (step === 1) return selectedSkills.length > 0;
    if (step === 2) return experienceLevel !== '';
    if (step === 3) return timeCommitment !== '';
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white border-4 border-black rounded-2xl shadow-brutal max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-gradient-to-r from-uvz-orange to-orange-400">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-white" />
            <h2 className="text-xl font-black text-white">Match Your Skills to Products</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between text-sm font-bold text-gray-500 mb-2">
            <span>Step {step} of 4</span>
            <span>{Math.round((step / 4) * 100)}% Complete</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-uvz-orange transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Skills Selection */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-black mb-2">What are your strongest skills?</h3>
              <p className="text-gray-600 mb-6">Select all that apply. We'll match you with product types that leverage your abilities.</p>
              
              <div className="grid grid-cols-2 gap-3">
                {SKILLS.map(skill => (
                  <button
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      selectedSkills.includes(skill.id)
                        ? 'border-uvz-orange bg-orange-50 shadow-brutal'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{skill.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{skill.name}</span>
                          {selectedSkills.includes(skill.id) && (
                            <CheckCircle className="w-4 h-4 text-uvz-orange shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{skill.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Experience Level */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-black mb-2">What's your experience level?</h3>
              <p className="text-gray-600 mb-6">This helps us suggest products that match your current capabilities.</p>
              
              <div className="space-y-3">
                {EXPERIENCE_LEVELS.map(level => (
                  <button
                    key={level.id}
                    onClick={() => setExperienceLevel(level.id)}
                    className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                      experienceLevel === level.id
                        ? 'border-uvz-orange bg-orange-50 shadow-brutal'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold">{level.name}</span>
                        <p className="text-sm text-gray-500">{level.description}</p>
                      </div>
                      {experienceLevel === level.id && (
                        <CheckCircle className="w-5 h-5 text-uvz-orange" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Time Commitment */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-black mb-2">How much time can you invest?</h3>
              <p className="text-gray-600 mb-6">We'll recommend products that fit your available time.</p>
              
              <div className="space-y-3">
                {TIME_COMMITMENTS.map(time => (
                  <button
                    key={time.id}
                    onClick={() => setTimeCommitment(time.id)}
                    className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                      timeCommitment === time.id
                        ? 'border-uvz-orange bg-orange-50 shadow-brutal'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold">{time.name}</span>
                        <p className="text-sm text-gray-500">{time.description}</p>
                      </div>
                      {timeCommitment === time.id && (
                        <CheckCircle className="w-5 h-5 text-uvz-orange" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Additional Notes */}
          {step === 4 && (
            <div>
              <h3 className="text-lg font-black mb-2">Anything else we should know?</h3>
              <p className="text-gray-600 mb-6">Optional: Share any additional context about your goals or constraints.</p>
              
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="E.g., I have a background in healthcare, I prefer passive income, I want to start with low investment..."
                className="w-full h-32 p-4 border-2 border-black rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-uvz-orange"
              />

              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
                <h4 className="font-bold mb-3">Your Profile Summary:</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-500">Skills:</span>{' '}
                    <span className="font-medium">
                      {selectedSkills.map(s => SKILLS.find(sk => sk.id === s)?.name).join(', ')}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-500">Experience:</span>{' '}
                    <span className="font-medium">
                      {EXPERIENCE_LEVELS.find(l => l.id === experienceLevel)?.name}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-500">Time:</span>{' '}
                    <span className="font-medium">
                      {TIME_COMMITMENTS.find(t => t.id === timeCommitment)?.name}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t-2 border-gray-200 bg-gray-50">
          <button
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
            className="px-6 py-2 font-bold text-gray-600 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>
          
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="px-8 py-3 bg-uvz-orange text-white font-bold border-2 border-black rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-8 py-3 bg-uvz-orange text-white font-bold border-2 border-black rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Get Product Suggestions
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
