'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, CreditCard, Trash2, Check, Crown, Zap, Building2, AlertTriangle, Settings, ChevronDown, Loader2, Camera } from 'lucide-react';
import PaddleCheckoutButton from '@/components/billing/PaddleCheckoutButton';
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
    id: "free",
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
    id: "pro",
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
    id: "enterprise",
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

import { ENABLE_PRICING } from '@/lib/config';

function SettingsContent() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState<'profile' | 'subscription' | 'danger' | null>('profile');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const toggleSection = (section: 'profile' | 'subscription' | 'danger') => {
    setOpenSection(openSection === section ? null : section);
  };

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
      }
      try {
        const billingResponse = await fetch('/api/billing');
        if (billingResponse.ok) {
          const billingData = await billingResponse.json();
          setCurrentPlan(billingData.currentPlan || 'free');
        }
      } catch (e) {
        console.error('Failed to load billing:', e);
      }
      
      setLoading(false);
    }
    getUser();
    
    // Check for success/cancel from Paddle checkout
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    if (success) {
      // Refresh billing state after successful checkout
      fetch('/api/billing').then(res => res.json()).then(data => {
        setCurrentPlan(data.currentPlan || 'free');
      });
    }
  }, [router, supabase.auth, searchParams]);

  const handleUpgrade = async (planId: string) => {
    if (!ENABLE_PRICING) {
      alert('Billing is currently disabled. Upgrades are unavailable at this time.');
      return;
    }

    if (planId === 'enterprise') {
      // Open contact form or email for enterprise
      window.location.href = 'mailto:contact@manymarkets.com?subject=Enterprise Plan Inquiry';
      return;
    }
    
    setUpgrading(planId);
    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout', productId: planId }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else if (data.preview) {
        // Payment on file, need to confirm
        const confirmUpgrade = confirm(`Confirm upgrade to ${planId.toUpperCase()}?`);
        if (confirmUpgrade) {
          const attachResponse = await fetch('/api/billing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'attach', productId: planId }),
          });
          if (attachResponse.ok) {
            setCurrentPlan(planId);
            alert('Successfully upgraded!');
          }
        }
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to process upgrade. Please try again.');
    } finally {
      setUpgrading(null);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileSaved(false);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: displayName,
          avatar_url: avatarUrl,
        }
      });
      if (error) throw error;
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      setAvatarUrl(publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar. Please try again or use a URL instead.');
    }
  };

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
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Settings Title */}
          <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
            <Settings className="w-8 h-8" />
            Settings
          </h1>

          {/* Accordion Sections */}
          <div className="space-y-4">
            
            {/* Profile Section */}
            <div className="bg-white border-2 border-black rounded-lg shadow-brutal overflow-hidden">
              <button
                onClick={() => toggleSection('profile')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-uvz-orange rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-black">Profile</h2>
                    <p className="text-sm text-gray-500">Manage your account information</p>
                  </div>
                </div>
                <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${openSection === 'profile' ? 'rotate-180' : ''}`} />
              </button>
              
              {openSection === 'profile' && (
                <div className="px-6 pb-6 border-t-2 border-gray-100">
                  <div className="pt-6 space-y-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="relative">
                        {avatarUrl ? (
                          <img 
                            src={avatarUrl} 
                            alt="Avatar" 
                            className="w-20 h-20 border-2 border-black rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-uvz-orange border-2 border-black rounded-full flex items-center justify-center text-white text-2xl font-black">
                            {displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-uvz-blue border-2 border-black rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
                          <Camera className="w-4 h-4 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div>
                        <p className="font-bold text-lg">{displayName || user?.email}</p>
                        <p className="text-gray-600 text-sm">
                          Member since {new Date(user?.created_at).toLocaleDateString('en-US', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Display Name</label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your name"
                          className="w-full px-4 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-uvz-orange"
                        />
                      </div>
                      
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
                        <label className="block text-sm font-bold text-gray-700 mb-1">Current Plan</label>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-uvz-orange text-white font-bold text-sm rounded border-2 border-black uppercase">
                            {currentPlan}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="px-6 py-2 bg-uvz-orange text-white font-bold border-2 border-black rounded hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {savingProfile ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                      {profileSaved && (
                        <span className="text-green-600 font-bold flex items-center gap-1">
                          <Check className="w-4 h-4" /> Saved!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Subscription Section */}
            <div className="bg-white border-2 border-black rounded-lg shadow-brutal overflow-hidden">
              <button
                onClick={() => toggleSection('subscription')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-black">Subscription</h2>
                    <p className="text-sm text-gray-500">Manage your plan and billing</p>
                  </div>
                </div>
                <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${openSection === 'subscription' ? 'rotate-180' : ''}`} />
              </button>
              
              {openSection === 'subscription' && (
                <div className="px-6 pb-6 border-t-2 border-gray-100">
                  <div className="pt-6">
                    {/* Current Plan Banner */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded p-4 mb-6">
                      <p className="font-bold text-blue-800">
                        Your current plan: <span className="text-uvz-orange">{currentPlan.toUpperCase()}</span>
                      </p>
                    </div>

                    {/* Pricing Cards */}
                    {!ENABLE_PRICING ? (
                      <div className="bg-gray-100 border-2 border-gray-200 rounded p-6 text-center">
                        <p className="font-bold mb-2">Billing Temporarily Disabled</p>
                        <p className="text-sm text-gray-600">All accounts are currently on the free plan. Paid plans and upgrades are disabled for now.</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid md:grid-cols-3 gap-4">
                          {pricingPlans.map((plan) => {
                        const Icon = plan.icon;
                        const isCurrentPlan = plan.id === currentPlan;
                        const isUpgrading = upgrading === plan.id;
                        
                        return (
                          <div
                            key={plan.id}
                            className={`border-2 border-black rounded p-4 flex flex-col relative ${
                              plan.popular ? 'ring-2 ring-uvz-orange ring-offset-1' : ''
                            } ${isCurrentPlan ? 'bg-orange-50' : 'bg-white'}`}
                          >
                            {plan.popular && (
                              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-uvz-orange text-white px-3 py-0.5 text-xs font-black uppercase border-2 border-black rounded">
                                Popular
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 mb-3">
                              <Icon className={`w-5 h-5 ${plan.popular ? 'text-uvz-orange' : 'text-gray-600'}`} />
                              <h3 className="text-lg font-black">{plan.name}</h3>
                            </div>
                            
                            <div className="mb-3">
                              <span className="text-2xl font-black">{plan.price}</span>
                              <span className="text-gray-600 text-xs font-bold ml-1">/{plan.period}</span>
                            </div>
                            
                            <p className="text-gray-600 text-xs mb-4">{plan.description}</p>
                            
                            <ul className="space-y-1.5 mb-4 flex-1">
                              {plan.features.slice(0, 4).map((feature, fi) => (
                                <li key={fi} className="flex items-start gap-1.5 text-xs">
                                  <Check className="w-3 h-3 text-green-600 shrink-0 mt-0.5" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                              {plan.features.length > 4 && (
                                <li className="text-xs text-gray-500">+{plan.features.length - 4} more</li>
                              )}
                            </ul>
                            
                            <button
                              onClick={() => !isCurrentPlan && handleUpgrade(plan.id)}
                              disabled={isCurrentPlan || isUpgrading}
                              className={`w-full py-2 px-3 font-bold border-2 border-black rounded text-sm transition-all flex items-center justify-center gap-2 ${
                                isCurrentPlan
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  : plan.popular
                                  ? 'bg-uvz-orange text-white hover:-translate-y-0.5 shadow-brutal'
                                  : 'bg-white text-black hover:bg-gray-50 shadow-brutal hover:-translate-y-0.5'
                              }`}
                            >
                              {isUpgrading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Processing...
                                </>
                              ) : isCurrentPlan ? (
                                'Current'
                              ) : (
                                plan.cta
                              )}
                            </button>
                          </div>
                        );
                      })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Danger Zone Section */}
            <div className="bg-white border-2 border-red-500 rounded-lg shadow-brutal overflow-hidden">
              <button
                onClick={() => toggleSection('danger')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-black text-red-600">Danger Zone</h2>
                    <p className="text-sm text-red-400">Delete your account permanently</p>
                  </div>
                </div>
                <ChevronDown className={`w-6 h-6 text-red-500 transition-transform duration-300 ${openSection === 'danger' ? 'rotate-180' : ''}`} />
              </button>
              
              {openSection === 'danger' && (
                <div className="px-6 pb-6 border-t-2 border-red-100">
                  <div className="pt-6">
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

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-uvz-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-uvz-orange border-t-transparent rounded-full"></div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
