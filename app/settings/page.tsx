'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, CreditCard, Trash2, Check, Crown, Zap, AlertTriangle, Settings, ChevronDown, Loader2, Camera, Gift, Star, Infinity, MessageCircle } from 'lucide-react';
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

const PRO_FEATURES = [
  'Product Builder Studio',
  'Marketplace Listing',
  'Unlimited AI Sessions',
  'Advanced Analytics',
  'Priority Support',
  'Early Access Features'
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
    
    setUpgrading(planId);
    // Redirect to upgrade page with the selected plan
    router.push(`/upgrade?plan=${planId}`);
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
                    ) : currentPlan === 'pro' || currentPlan === 'lifetime' ? (
                      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-uvz-orange to-pink-500 rounded-full flex items-center justify-center">
                            <Crown className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-black text-lg">You're on Pro!</h3>
                            <p className="text-sm text-gray-600">Enjoy unlimited access to all features</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {PRO_FEATURES.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-600" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Plan Toggle Cards */}
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Monthly Plan */}
                          <div className="border-2 border-black rounded-xl p-5 bg-white hover:shadow-brutal transition-all">
                            <div className="flex items-center gap-2 mb-3">
                              <Star className="w-5 h-5 text-uvz-orange" />
                              <span className="font-bold text-sm uppercase tracking-wide text-gray-600">Pro Monthly</span>
                            </div>
                            <div className="flex items-baseline gap-2 mb-2">
                              <span className="text-xl font-bold text-red-500 line-through">$10</span>
                              <span className="text-3xl font-black">$8</span>
                              <span className="text-gray-500 font-bold">/month</span>
                            </div>
                            <div className="text-sm text-gray-500 mb-4">
                              <p>✓ Cancel anytime</p>
                              <p>✓ No hidden fees</p>
                            </div>
                            <button
                              onClick={() => handleUpgrade('monthly')}
                              disabled={upgrading === 'monthly'}
                              className="w-full py-2 px-4 bg-white text-black font-bold border-2 border-black rounded-lg hover:bg-gray-50 hover:-translate-y-0.5 shadow-brutal transition-all flex items-center justify-center gap-2"
                            >
                              {upgrading === 'monthly' ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                              ) : (
                                'Subscribe Monthly'
                              )}
                            </button>
                          </div>

                          {/* Lifetime Plan */}
                          <div className="border-2 border-black rounded-xl p-5 bg-gradient-to-br from-orange-50 to-pink-50 relative ring-2 ring-uvz-orange ring-offset-2 hover:shadow-brutal transition-all">
                            <div className="absolute -top-2.5 right-4 bg-green-500 text-white px-3 py-0.5 text-xs font-black uppercase rounded-full">
                              BEST VALUE
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              <Gift className="w-5 h-5 text-uvz-orange" />
                              <span className="font-bold text-sm uppercase tracking-wide text-gray-600">Lifetime Deal</span>
                            </div>
                            <div className="flex items-baseline gap-2 mb-2">
                              <span className="text-xl font-bold text-red-500 line-through">$97</span>
                              <span className="text-3xl font-black">$12</span>
                              <span className="text-gray-500 font-bold">one-time</span>
                            </div>
                            <p className="text-sm text-green-600 font-bold mb-2">🎉 Save $85 - Pay once, own forever!</p>
                            <div className="text-sm text-gray-500 mb-4">
                              <p>✓ Never pay again</p>
                              <p>✓ All future updates</p>
                            </div>
                            <button
                              onClick={() => handleUpgrade('lifetime')}
                              disabled={upgrading === 'lifetime'}
                              className="w-full py-2 px-4 bg-gradient-to-r from-uvz-orange to-pink-500 text-white font-bold border-2 border-black rounded-lg hover:-translate-y-0.5 shadow-brutal transition-all flex items-center justify-center gap-2"
                            >
                              {upgrading === 'lifetime' ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                              ) : (
                                <>Get Lifetime Access<Gift className="w-4 h-4" /></>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Features List */}
                        <div className="bg-white border-2 border-black rounded-xl p-5">
                          <h4 className="font-black mb-3">Everything included in Pro:</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {PRO_FEATURES.map((feature, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-600" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Lifetime Bonuses */}
                        <div className="bg-gradient-to-r from-orange-50 to-pink-50 border-2 border-orange-200 rounded-xl p-5">
                          <h4 className="font-black mb-3 flex items-center gap-2">
                            <Gift className="w-5 h-5 text-uvz-orange" />
                            Exclusive Lifetime Bonuses:
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Infinity className="w-4 h-4 text-uvz-orange" />
                              <span><strong>Lifetime Updates</strong> - Get all future features forever</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Crown className="w-4 h-4 text-uvz-orange" />
                              <span><strong>Founding Member Badge</strong> - Exclusive profile badge</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <MessageCircle className="w-4 h-4 text-uvz-orange" />
                              <span><strong>1-on-1 Onboarding Call</strong> - 30-min strategy session</span>
                            </div>
                          </div>
                        </div>
                      </div>
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
