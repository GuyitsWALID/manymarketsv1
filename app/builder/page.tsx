'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { 
  ArrowLeft, 
  Sparkles, 
  FileText, 
  Video, 
  Code, 
  Users, 
  Book,
  CheckCircle,
  Loader2,
  Rocket,
  Target,
  Lightbulb,
  Zap
} from 'lucide-react';

interface Session {
  id: string;
  title: string;
  phase: string;
  created_at: string;
  last_message_at: string;
}

const PRODUCT_STEPS = [
  { id: 'overview', name: 'Overview', icon: Target },
  { id: 'content', name: 'Content Plan', icon: FileText },
  { id: 'structure', name: 'Structure', icon: Lightbulb },
  { id: 'assets', name: 'Assets', icon: Zap },
  { id: 'launch', name: 'Launch', icon: Rocket },
];

function BuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const sessionId = searchParams.get('session');
  const productId = searchParams.get('product');
  const productType = searchParams.get('type');
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [researchData, setResearchData] = useState<any>(null);
  
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      // Load sessions for sidebar
      try {
        const response = await fetch('/api/sessions');
        if (response.ok) {
          const { sessions: userSessions } = await response.json();
          setSessions(userSessions || []);
        }
      } catch (e) {
        console.error('Failed to load sessions:', e);
      }

      // Load research data from session
      if (sessionId) {
        try {
          const response = await fetch(`/api/sessions/${sessionId}`);
          if (response.ok) {
            const data = await response.json();
            setResearchData(data.session);
          }
        } catch (e) {
          console.error('Failed to load session data:', e);
        }
      }

      setIsLoading(false);
    }
    loadData();
  }, [router, sessionId, supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const createNewChat = () => {
    router.push('/chat');
  };

  const getProductIcon = () => {
    switch (productType) {
      case 'ebook': return Book;
      case 'course': return Video;
      case 'template': return FileText;
      case 'saas': return Code;
      case 'community': return Users;
      default: return Sparkles;
    }
  };

  const ProductIcon = getProductIcon();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-uvz-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-uvz-orange mx-auto mb-4" />
          <p className="font-bold text-gray-600">Loading builder...</p>
        </div>
      </div>
    );
  }

  const isMobile = !isDesktop;

  return (
    <div className="min-h-screen bg-uvz-cream">
      {/* Header */}
      <ChatHeader
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        createNewChat={createNewChat}
        currentUser={currentUser}
        profileMenuOpen={profileMenuOpen}
        setProfileMenuOpen={setProfileMenuOpen}
        setIsLogoutOpen={setIsLogoutOpen}
      />

      {/* Sidebar */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        isMobile={isMobile}
        onClose={() => setIsSidebarOpen(false)}
        createNewChat={createNewChat}
        isLogoutOpen={isLogoutOpen}
        setIsLogoutOpen={setIsLogoutOpen}
        handleLogout={handleLogout}
        sessions={sessions}
        currentSessionId={sessionId}
      />

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 ${isSidebarOpen && !isMobile ? 'ml-72' : ''}`}>
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.push('/chat')}
            className="flex items-center gap-2 text-gray-600 hover:text-black font-bold mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Research
          </button>

          {/* Header */}
          <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-brutal mb-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-uvz-orange to-orange-400 border-2 border-black rounded-xl flex items-center justify-center">
                <ProductIcon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-black mb-1">Product Builder</h1>
                <p className="text-gray-600">
                  Building: <span className="font-bold capitalize">{productType?.replace('_', ' ') || 'Digital Product'}</span>
                </p>
                {researchData && (
                  <p className="text-sm text-gray-500 mt-1">
                    Based on research: {researchData.title}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="bg-white border-2 border-black rounded-xl p-4 mb-8">
            <div className="flex items-center justify-between">
              {PRODUCT_STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => setCurrentStep(index)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                        isActive 
                          ? 'bg-uvz-orange text-white' 
                          : isCompleted 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                      <span className="text-xs font-bold hidden sm:block">{step.name}</span>
                    </button>
                    {index < PRODUCT_STEPS.length - 1 && (
                      <div className={`w-8 h-1 mx-2 rounded ${
                        index < currentStep ? 'bg-green-400' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white border-2 border-black rounded-xl p-8 shadow-brutal">
            {currentStep === 0 && (
              <div>
                <h2 className="text-xl font-black mb-4">Product Overview</h2>
                <p className="text-gray-600 mb-6">
                  Let's define the key aspects of your product based on your research findings.
                </p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Product Name</label>
                    <input
                      type="text"
                      placeholder="Enter your product name"
                      className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-uvz-orange"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">One-Line Description</label>
                    <input
                      type="text"
                      placeholder="What does your product do in one sentence?"
                      className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-uvz-orange"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Target Audience</label>
                    <textarea
                      placeholder="Who is this product for?"
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-uvz-orange resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Problem Solved</label>
                    <textarea
                      placeholder="What specific problem does this solve?"
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-uvz-orange resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div>
                <h2 className="text-xl font-black mb-4">Content Plan</h2>
                <p className="text-gray-600 mb-6">
                  Outline the content structure for your {productType || 'product'}.
                </p>
                
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 text-yellow-800 font-bold mb-2">
                    <Sparkles className="w-5 h-5" />
                    AI Content Assistant
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    Let AI help generate content structure based on your research.
                  </p>
                  <button className="px-4 py-2 bg-yellow-400 text-black font-bold border-2 border-black rounded-lg hover:bg-yellow-500 transition-colors">
                    Generate Content Outline
                  </button>
                </div>
                
                <div className="space-y-4">
                  <p className="text-gray-500 text-center py-8">
                    Content outline will appear here...
                  </p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2 className="text-xl font-black mb-4">Product Structure</h2>
                <p className="text-gray-600 mb-6">
                  Define the modules, chapters, or features of your product.
                </p>
                <div className="space-y-4">
                  <p className="text-gray-500 text-center py-8">
                    Structure builder coming soon...
                  </p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2 className="text-xl font-black mb-4">Assets & Resources</h2>
                <p className="text-gray-600 mb-6">
                  Upload or generate the assets needed for your product.
                </p>
                <div className="space-y-4">
                  <p className="text-gray-500 text-center py-8">
                    Asset manager coming soon...
                  </p>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <h2 className="text-xl font-black mb-4">Launch Checklist</h2>
                <p className="text-gray-600 mb-6">
                  Everything you need to launch your product successfully.
                </p>
                <div className="space-y-4">
                  <p className="text-gray-500 text-center py-8">
                    Launch checklist coming soon...
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-6 py-3 font-bold text-gray-600 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              {currentStep < PRODUCT_STEPS.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-8 py-3 bg-uvz-orange text-white font-bold border-2 border-black rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all"
                >
                  Continue
                </button>
              ) : (
                <button
                  className="px-8 py-3 bg-green-500 text-white font-bold border-2 border-black rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  <Rocket className="w-5 h-5" />
                  Launch Product
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-uvz-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-uvz-orange mx-auto mb-4" />
          <p className="font-bold text-gray-600">Loading builder...</p>
        </div>
      </div>
    }>
      <BuilderContent />
    </Suspense>
  );
}
