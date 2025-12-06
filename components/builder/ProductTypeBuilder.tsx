'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Loader2, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  Check,
  RefreshCw,
  Target,
  Lightbulb,
  Rocket,
  Settings
} from 'lucide-react';
import { ProductTypeConfig, BuilderStep, BuilderTask, AI_TOOLS } from '@/lib/product-types';
import AIToolSelector from './AIToolSelector';

interface ProductTypeBuilderProps {
  productConfig: ProductTypeConfig;
  productData: Record<string, string>;
  onUpdateData: (data: Record<string, string>) => void;
  onComplete: (finalPrompt: string) => void;
  onBack: () => void;
}

export default function ProductTypeBuilder({
  productConfig,
  productData,
  onUpdateData,
  onComplete,
  onBack,
}: ProductTypeBuilderProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});
  const [showFinalPrompt, setShowFinalPrompt] = useState(false);
  const [copiedTask, setCopiedTask] = useState<string | null>(null);

  const currentStep = productConfig.steps[currentStepIndex];
  const isLastStep = currentStepIndex === productConfig.steps.length - 1;
  const totalEstimatedMinutes = productConfig.steps.reduce((acc, step) => acc + step.estimatedMinutes, 0);

  // Check if current step is complete
  const isStepComplete = (step: BuilderStep): boolean => {
    const requiredTasks = step.tasks.filter(t => t.required);
    return requiredTasks.every(task => {
      const value = productData[task.id] || generatedContent[task.id];
      return value && value.trim().length > 0;
    });
  };

  // Generate AI content for a task
  const handleGenerateContent = async (task: BuilderTask) => {
    if (!task.aiPrompt) return;

    setIsGenerating(task.id);
    
    try {
      // Build context from current data
      const context = {
        productType: productConfig.name,
        productName: productData['name'] || productData['title'] || '',
        ...productData,
        ...generatedContent,
      };

      const response = await fetch('/api/builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          prompt: task.aiPrompt,
          context,
          productType: productConfig.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate content');

      const { content } = await response.json();
      
      setGeneratedContent(prev => ({
        ...prev,
        [task.id]: content,
      }));

      // Also update main data
      onUpdateData({
        ...productData,
        [task.id]: content,
      });
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(null);
    }
  };

  // Handle input change
  const handleInputChange = (taskId: string, value: string) => {
    onUpdateData({
      ...productData,
      [taskId]: value,
    });
  };

  // Copy content to clipboard
  const handleCopyContent = async (taskId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedTask(taskId);
      setTimeout(() => setCopiedTask(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Navigate to next step
  const handleNextStep = () => {
    if (isStepComplete(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep.id]));
      if (isLastStep) {
        setShowFinalPrompt(true);
      } else {
        setCurrentStepIndex(prev => prev + 1);
      }
    }
  };

  // Navigate to previous step
  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else {
      onBack();
    }
  };

  // Generate final build prompt
  const generateFinalPrompt = (): string => {
    let prompt = productConfig.promptTemplate;
    
    // Replace all placeholders with actual data
    const allData = { ...productData, ...generatedContent };
    Object.entries(allData).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      prompt = prompt.replace(placeholder, value || '');
    });

    // Clean up any remaining placeholders
    prompt = prompt.replace(/\{\{[^}]+\}\}/g, '[To be filled]');

    return prompt;
  };

  // Render a single task
  const renderTask = (task: BuilderTask) => {
    const value = productData[task.id] || generatedContent[task.id] || '';

    switch (task.type) {
      case 'input':
        return (
          <div key={task.id} className="space-y-2">
            <label className="block">
              <span className="font-bold text-sm">
                {task.title}
                {task.required && <span className="text-red-500 ml-1">*</span>}
              </span>
              {task.description && (
                <span className="block text-xs text-gray-500 mt-0.5">{task.description}</span>
              )}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleInputChange(task.id, e.target.value)}
              placeholder={task.placeholder}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-uvz-orange transition-colors"
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={task.id} className="space-y-2">
            <label className="block">
              <span className="font-bold text-sm">
                {task.title}
                {task.required && <span className="text-red-500 ml-1">*</span>}
              </span>
              {task.description && (
                <span className="block text-xs text-gray-500 mt-0.5">{task.description}</span>
              )}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleInputChange(task.id, e.target.value)}
              placeholder={task.placeholder}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-uvz-orange transition-colors resize-none"
            />
          </div>
        );

      case 'select':
        return (
          <div key={task.id} className="space-y-2">
            <label className="block">
              <span className="font-bold text-sm">
                {task.title}
                {task.required && <span className="text-red-500 ml-1">*</span>}
              </span>
              {task.description && (
                <span className="block text-xs text-gray-500 mt-0.5">{task.description}</span>
              )}
            </label>
            <select
              value={value}
              onChange={(e) => handleInputChange(task.id, e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-uvz-orange transition-colors bg-white"
            >
              <option value="">Select an option...</option>
              {task.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );

      case 'ai-generate':
        return (
          <div key={task.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block">
                <span className="font-bold text-sm flex items-center gap-2">
                  {task.title}
                  {task.required && <span className="text-red-500">*</span>}
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full">
                    AI-Powered
                  </span>
                </span>
                {task.description && (
                  <span className="block text-xs text-gray-500 mt-0.5">{task.description}</span>
                )}
              </label>
              {value && (
                <button
                  onClick={() => handleCopyContent(task.id, value)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-black transition-colors"
                >
                  {copiedTask === task.id ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>
            
            {value ? (
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-xl">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 max-h-60 overflow-y-auto">
                    {value}
                  </pre>
                </div>
                <button
                  onClick={() => handleGenerateContent(task)}
                  disabled={isGenerating === task.id}
                  className="absolute top-2 right-2 flex items-center gap-1 px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-medium text-purple-700 hover:bg-purple-50 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isGenerating === task.id ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleGenerateContent(task)}
                disabled={isGenerating === task.id}
                className="w-full p-6 border-2 border-dashed border-purple-300 rounded-xl bg-purple-50/50 hover:bg-purple-50 transition-colors flex flex-col items-center justify-center gap-2"
              >
                {isGenerating === task.id ? (
                  <>
                    <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                    <span className="text-sm font-medium text-purple-700">Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 text-purple-500" />
                    <span className="text-sm font-medium text-purple-700">Generate with AI</span>
                    <span className="text-xs text-purple-500">{task.aiPrompt}</span>
                  </>
                )}
              </button>
            )}
          </div>
        );

      case 'checklist':
        return (
          <div key={task.id} className="space-y-2">
            <label className="block">
              <span className="font-bold text-sm">
                {task.title}
                {task.required && <span className="text-red-500 ml-1">*</span>}
              </span>
              {task.description && (
                <span className="block text-xs text-gray-500 mt-0.5">{task.description}</span>
              )}
            </label>
            <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value === 'completed'}
                  onChange={(e) => handleInputChange(task.id, e.target.checked ? 'completed' : '')}
                  className="w-5 h-5 rounded border-2 border-gray-300 text-uvz-orange focus:ring-uvz-orange"
                />
                <span className="text-sm">Mark as completed</span>
              </label>
            </div>
          </div>
        );

      case 'file-upload':
        return (
          <div key={task.id} className="space-y-2">
            <label className="block">
              <span className="font-bold text-sm">
                {task.title}
                {task.required && <span className="text-red-500 ml-1">*</span>}
              </span>
              {task.description && (
                <span className="block text-xs text-gray-500 mt-0.5">{task.description}</span>
              )}
            </label>
            <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl text-center">
              <p className="text-sm text-gray-500">File upload coming soon</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Show final prompt and tool selector
  if (showFinalPrompt) {
    const finalPrompt = generateFinalPrompt();
    
    return (
      <div className="space-y-6">
        <AIToolSelector
          recommendedTools={productConfig.aiTools}
          buildPrompt={finalPrompt}
          productName={productData['name'] || productData['title'] || productConfig.name}
          productType={productConfig.name}
          onToolSelect={(tool) => console.log('Selected tool:', tool)}
        />
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowFinalPrompt(false)}
            className="flex items-center gap-2 px-4 py-2 font-bold text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Steps
          </button>
          <button
            onClick={() => onComplete(finalPrompt)}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            Complete & Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="bg-white border-2 border-black rounded-xl p-4 shadow-brutal-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{productConfig.icon}</span>
            <div>
              <h3 className="font-black text-lg">{productConfig.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>~{Math.round(totalEstimatedMinutes / 60)} hours total</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-500">Step {currentStepIndex + 1} of {productConfig.steps.length}</span>
            <div className="font-bold text-uvz-orange">{Math.round(((currentStepIndex + 1) / productConfig.steps.length) * 100)}%</div>
          </div>
        </div>
        
        {/* Step indicators */}
        <div className="flex gap-1">
          {productConfig.steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStepIndex(index)}
              className={`flex-1 h-2 rounded-full transition-all ${
                completedSteps.has(step.id)
                  ? 'bg-green-500'
                  : index === currentStepIndex
                    ? 'bg-uvz-orange'
                    : 'bg-gray-200'
              }`}
              title={step.name}
            />
          ))}
        </div>
      </div>

      {/* Current Step */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        {/* Step Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-black text-lg">{currentStep.name}</h4>
                {currentStep.aiAssisted && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI-Assisted
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{currentStep.description}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>~{currentStep.estimatedMinutes} min</span>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="p-6 space-y-6">
          {currentStep.tasks.map(task => renderTask(task))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevStep}
          className="flex items-center gap-2 px-4 py-2 font-bold text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentStepIndex === 0 ? 'Back' : 'Previous'}
        </button>
        
        <button
          onClick={handleNextStep}
          disabled={!isStepComplete(currentStep)}
          className="flex items-center gap-2 px-6 py-3 bg-uvz-orange text-white font-bold rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {isLastStep ? (
            <>
              Generate Build Prompt
              <Rocket className="w-5 h-5" />
            </>
          ) : (
            <>
              Next Step
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
