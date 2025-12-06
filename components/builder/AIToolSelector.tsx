'use client';

import { useState } from 'react';
import { ExternalLink, Copy, Check, Sparkles, Info } from 'lucide-react';
import { AI_TOOLS, AITool } from '@/lib/product-types';

interface AIToolSelectorProps {
  recommendedTools: string[];
  buildPrompt: string;
  productName: string;
  productType: string;
  onToolSelect?: (tool: AITool) => void;
}

// Tool icon slugs from lobehub icons CDN (https://lobehub.com/icons)
// Using colorful PNG version: https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/light/[SLUG].png
const LOBEHUB_ICON_SLUGS: Record<string, string> = {
  lovable: 'lovable',
  v0: 'v0',
  replit: 'replit',
  cursor: 'cursor',
  bolt: 'bolt',
  claude: 'claude-color',
  chatgpt: 'openai',
  gemini: 'gemini-color',
  manus: 'manus',
  canva: 'canva-color',
  midjourney: 'midjourney-color',
  figma: 'figma-color',
};

// Fallback emoji icons for when images fail to load
const TOOL_EMOJI: Record<string, string> = {
  lovable: '❤️',
  v0: '▲',
  replit: '🔄',
  cursor: '▶️',
  bolt: '⚡',
  claude: '🧠',
  chatgpt: '💬',
  gemini: '✨',
  manus: '🤖',
  canva: '🎨',
  midjourney: '🖼️',
  figma: '🎯',
};

// Tool Logo Component using lobehub CDN icons
function ToolLogo({ toolId, size = 'md' }: { toolId: string; size?: 'sm' | 'md' | 'lg' }) {
  const [imageError, setImageError] = useState(false);
  const iconSlug = LOBEHUB_ICON_SLUGS[toolId];
  const emoji = TOOL_EMOJI[toolId] || '🛠️';
  
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12 sm:w-14 sm:h-14',
    lg: 'w-14 h-14',
  };
  
  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 40,
  };

  if (!iconSlug || imageError) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-100 rounded-xl flex items-center justify-center text-2xl`}>
        {emoji}
      </div>
    );
  }

  const iconUrl = `https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/light/${iconSlug}.png`;

  return (
    <div className={`${sizeClasses[size]} bg-white rounded-xl flex items-center justify-center overflow-hidden p-2 border border-gray-100`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={iconUrl}
        alt={toolId}
        width={iconSizes[size]}
        height={iconSizes[size]}
        className="object-contain"
        onError={() => setImageError(true)}
      />
    </div>
  );
}

export default function AIToolSelector({
  recommendedTools,
  buildPrompt,
  productName,
  productType,
  onToolSelect,
}: AIToolSelectorProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);
  const [showFullPrompt, setShowFullPrompt] = useState(false);

  const tools = AI_TOOLS.filter(t => recommendedTools.includes(t.id));
  const otherTools = AI_TOOLS.filter(t => !recommendedTools.includes(t.id));

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(buildPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleToolClick = (tool: AITool) => {
    setSelectedTool(tool);
    onToolSelect?.(tool);
  };

  const handleOpenTool = (tool: AITool) => {
    window.open(tool.url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl sm:text-2xl font-black mb-2">Ready to Build? Choose Your AI Tool</h3>
        <p className="text-gray-600 text-sm sm:text-base">
          Copy your prompt and paste it into any of these AI builders to bring your idea to life.
        </p>
      </div>

      {/* Your Build Prompt */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-uvz-orange" />
            <span className="font-bold text-sm">Your {productType} Prompt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFullPrompt(!showFullPrompt)}
              className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-black rounded-lg hover:bg-gray-100 transition-colors"
            >
              {showFullPrompt ? 'Collapse' : 'Expand'}
            </button>
            <button
              onClick={handleCopyPrompt}
              className={`flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                copiedPrompt
                  ? 'bg-green-500 text-white'
                  : 'bg-uvz-orange text-white hover:bg-orange-600'
              }`}
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Prompt
                </>
              )}
            </button>
          </div>
        </div>
        <div className={`p-4 font-mono text-sm text-gray-700 overflow-auto ${showFullPrompt ? 'max-h-96' : 'max-h-32'} transition-all`}>
          <pre className="whitespace-pre-wrap">{buildPrompt}</pre>
        </div>
      </div>

      {/* Recommended Tools */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="font-bold text-sm">Recommended AI Tools</span>
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
            Best for {productType}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tools.map(tool => (
            <div
              key={tool.id}
              className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                selectedTool?.id === tool.id
                  ? 'border-uvz-orange bg-orange-50 shadow-brutal-sm'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => handleToolClick(tool)}
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-2">
                  <ToolLogo toolId={tool.id} size="md" />
                </div>
                <span className="font-bold text-sm">{tool.name}</span>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1 line-clamp-2">
                  {tool.description}
                </p>
              </div>
              {selectedTool?.id === tool.id && (
                <div className="absolute top-2 right-2">
                  <Check className="w-4 h-4 text-uvz-orange" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Other Tools */}
      {otherTools.length > 0 && (
        <div>
          <span className="font-bold text-sm text-gray-500 mb-3 block">Other AI Tools</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {otherTools.slice(0, 4).map(tool => (
              <div
                key={tool.id}
                className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md opacity-80 hover:opacity-100 ${
                  selectedTool?.id === tool.id
                    ? 'border-uvz-orange bg-orange-50 shadow-brutal-sm'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => handleToolClick(tool)}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-2">
                    <ToolLogo toolId={tool.id} size="md" />
                  </div>
                  <span className="font-bold text-sm">{tool.name}</span>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1 line-clamp-2">
                    {tool.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Tool Action */}
      {selectedTool && (
        <div className="bg-gradient-to-r from-uvz-orange/10 to-orange-50 border-2 border-uvz-orange rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="border-2 border-black rounded-xl shadow-brutal-sm overflow-hidden">
                <ToolLogo toolId={selectedTool.id} size="lg" />
              </div>
              <div>
                <h4 className="font-black text-lg">{selectedTool.name}</h4>
                <p className="text-sm text-gray-600">{selectedTool.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTool.bestFor.map(item => (
                    <span key={item} className="px-2 py-0.5 bg-white text-xs font-medium rounded-full border border-gray-200">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleOpenTool(selectedTool)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
            >
              Open {selectedTool.name}
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-4 pt-4 border-t border-uvz-orange/30">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-uvz-orange shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold mb-1">How to use:</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Click "Copy Prompt" above to copy your detailed build instructions</li>
                  <li>Click "Open {selectedTool.name}" to open the AI tool</li>
                  <li>Paste your prompt and let the AI build your {productName}</li>
                  <li>Review, iterate, and refine until you're happy with the result</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-bold text-sm text-blue-800 mb-2">💡 Pro Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Start with the recommended tools - they're best suited for your product type</li>
          <li>• If you hit limits with one tool, try another with the same prompt</li>
          <li>• For complex products, break your prompt into smaller tasks</li>
          <li>• Save your generated content and iterate on it</li>
        </ul>
      </div>
    </div>
  );
}
