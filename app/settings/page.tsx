'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, CreditCard, Trash2, Check, Crown, Zap, Building2, AlertTriangle, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatSidebar from '@/components/chat/ChatSidebar';

interface Session {
  id: string;
  title: string;
  phase: string;
  created_at: string;
  last_message_at: string;
}

const pricingPlans = [
  {
    name: "FREE",
    price: "$0",
    period: "forever",
    description: "Perfect for exploring and validating your first niche idea",
    features: [
      "1 AI Research Session",
      "Basic Market Insights",
      "Niche Comparison Tools",
      "Community Access",
      "UVZ Report (Limited)"
    ],
    cta: "Current Plan",
    popular: false,
    icon: Zap,
  },
  {
    name: "PRO",
    price: "$29",
    period: "per month",
    description: "Everything you need to build and launch profitable digital products",
    features: [
      "Unlimited AI Research Sessions",
      "Full Builder Studio Access",
      "Advanced Market Analytics",
      "Unlimited Products",
      "Marketplace Listing",
      "85% Revenue (15% platform fee)",
      "Priority Support",
      "Marketing Asset Generator",
      "Analytics Dashboard"
    ],
    cta: "Upgrade to Pro",
    popular: true,
    icon: Crown,
  },
  {
    name: "ENTERPRISE",
    price: "Custom",
    period: "contact us",
    description: "For agencies, consultants, and teams scaling digital product businesses",
    features: [
      "Everything in Pro",
      "White-Label Options",
      "API Access",
      "Custom Integrations",
      "90% Revenue (10% platform fee)",
      "Dedicated Account Manager",
      "Custom Training",
      "Advanced Analytics",
      "Multi-user Teams"
    ],
    cta: "Contact Sales",
    popular: false,
    icon: Building2,
  }
];

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'danger'>('profile');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPlan] = useState('FREE'); // TODO: Get from database
  
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  // Handle responsive
  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      
      // Load sessions
      try {
        const response = await fetch('/api/sessions');
        if (response.ok) {
          const { sessions: userSessions } = await response.json();
          setSessions(userSessions || []);
        }
      } catch (e) {
        console.error('Failed to load sessions:', e);
      }
      
      setLoading(false);
    }
    getUser();
  }, [router, supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    
    setIsDeleting(true);
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-uvz-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-uvz-orange border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const isMobile = !isDesktop;

  const createNewChat = () => {
    router.push('/chat');
  };

  return (
    <div className="min-h-screen bg-uvz-cream">
      {/* Header */}
      <ChatHeader
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        createNewChat={createNewChat}
        currentUser={user}
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
        currentSessionId={null}
      />

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 ${isSidebarOpen && !isMobile ? 'ml-72' : ''}`}>
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Settings Title */}
          <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
            <Settings className="w-8 h-8" />
            Settings
          </h1>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Settings Navigation */}
            <nav className="w-full lg:w-64 shrink-0">
              <div className="bg-white border-2 border-black rounded shadow-brutal overflow-hidden">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-3 font-bold flex items-center gap-3 transition-colors ${
                    activeTab === 'profile' ? 'bg-uvz-orange text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  <User className="w-5 h-5" />
                  Profile
                </button>
                <div className="border-t border-gray-200" />
                <button
                  onClick={() => setActiveTab('subscription')}
                  className={`w-full text-left px-4 py-3 font-bold flex items-center gap-3 transition-colors ${
                    activeTab === 'subscription' ? 'bg-uvz-orange text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  Subscription
                </button>
                <div className="border-t border-gray-200" />
                <button
                  onClick={() => setActiveTab('danger')}
                  className={`w-full text-left px-4 py-3 font-bold flex items-center gap-3 transition-colors ${
                    activeTab === 'danger' ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Account
                </button>
              </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1">
              {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white border-2 border-black rounded shadow-brutal p-6">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                  <User className="w-6 h-6" />
                  Your Profile
                </h2>
                
                <div className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-uvz-orange border-2 border-black rounded-full flex items-center justify-center text-white text-2xl font-black">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{user?.email}</p>
                      <p className="text-gray-600 text-sm">
                        Member since {new Date(user?.created_at).toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded bg-gray-100 text-gray-600"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">User ID</label>
                        <input
                          type="text"
                          value={user?.id || ''}
                          disabled
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded bg-gray-100 text-gray-600 font-mono text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Current Plan</label>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-uvz-orange text-white font-bold text-sm rounded border-2 border-black">
                            {currentPlan}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <div className="bg-white border-2 border-black rounded shadow-brutal p-6">
                  <h2 className="text-xl font-black mb-2 flex items-center gap-2">
                    <CreditCard className="w-6 h-6" />
                    Manage Subscription
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Choose the plan that works best for you. Upgrade anytime to unlock more features.
                  </p>

                  {/* Current Plan Banner */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded p-4 mb-6">
                    <p className="font-bold text-blue-800">
                      Your current plan: <span className="text-uvz-orange">{currentPlan}</span>
                    </p>
                  </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                  {pricingPlans.map((plan, i) => {
                    const Icon = plan.icon;
                    const isCurrentPlan = plan.name === currentPlan;
                    
                    return (
                      <div
                        key={plan.name}
                        className={`bg-white border-2 border-black rounded shadow-brutal p-6 flex flex-col relative ${
                          plan.popular ? 'ring-4 ring-uvz-orange ring-offset-2' : ''
                        } ${isCurrentPlan ? 'bg-orange-50' : ''}`}
                      >
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-uvz-orange text-white px-4 py-1 text-xs font-black uppercase border-2 border-black rounded">
                            Most Popular
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mb-4">
                          <Icon className={`w-6 h-6 ${plan.popular ? 'text-uvz-orange' : 'text-gray-600'}`} />
                          <h3 className="text-xl font-black">{plan.name}</h3>
                        </div>
                        
                        <div className="mb-4">
                          <span className="text-4xl font-black">{plan.price}</span>
                          <span className="text-gray-600 text-sm font-bold ml-1">/{plan.period}</span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-6">{plan.description}</p>
                        
                        <ul className="space-y-2 mb-6 flex-1">
                          {plan.features.map((feature, fi) => (
                            <li key={fi} className="flex items-start gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        
                        <button
                          disabled={isCurrentPlan}
                          className={`w-full py-3 px-4 font-bold border-2 border-black rounded transition-all ${
                            isCurrentPlan
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : plan.popular
                              ? 'bg-uvz-orange text-white hover:-translate-y-0.5 shadow-brutal'
                              : 'bg-white text-black hover:bg-gray-50 shadow-brutal hover:-translate-y-0.5'
                          }`}
                        >
                          {isCurrentPlan ? 'Current Plan' : plan.cta}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className="bg-white border-2 border-red-500 rounded shadow-brutal p-6">
                <h2 className="text-xl font-black mb-2 flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-6 h-6" />
                  Danger Zone
                </h2>
                <p className="text-gray-600 mb-6">
                  Once you delete your account, there is no going back. Please be certain.
                </p>

                <div className="bg-red-50 border-2 border-red-200 rounded p-4 mb-6">
                  <h3 className="font-bold text-red-800 mb-2">What happens when you delete your account:</h3>
                  <ul className="text-red-700 text-sm space-y-1">
                    <li>• All your chat sessions and research data will be permanently deleted</li>
                    <li>• Your subscription will be cancelled immediately</li>
                    <li>• You will lose access to all your saved UVZ research</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>

                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="px-6 py-3 bg-red-600 text-white font-bold border-2 border-black rounded shadow-brutal hover:-translate-y-0.5 transition-transform"
                >
                  Delete My Account
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      </main>

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-black rounded shadow-brutal p-6 max-w-md w-full">
            <h3 className="text-xl font-black text-red-600 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Delete Account
            </h3>
            
            <p className="text-gray-600 mb-4">
              This action is <strong>permanent</strong> and cannot be undone. All your data will be lost.
            </p>
            
            <p className="text-sm font-bold mb-2">
              Type <span className="text-red-600 font-mono">DELETE</span> to confirm:
            </p>
            
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded mb-4 font-mono"
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 px-4 py-2 border-2 border-black bg-white font-bold rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                className={`flex-1 px-4 py-2 border-2 border-black font-bold rounded ${
                  deleteConfirmText === 'DELETE' && !isDeleting
                    ? 'bg-red-600 text-white hover:-translate-y-0.5 transition-transform'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isDeleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
