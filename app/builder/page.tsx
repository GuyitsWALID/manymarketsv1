'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
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
  Zap,
  Crown,
  Lock,
  Trash2,
  Save,
  Package,
  Plus,
  MoreHorizontal,
  Upload,
  Image as ImageIcon,
  Eye,
  ExternalLink,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  GripVertical,
  X,
  Check,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface Session {
  id: string;
  title: string;
  phase: string;
  created_at: string;
  last_message_at: string;
}

interface ContentOutline {
  title: string;
  subtitle?: string;
  chapters: Chapter[];
  bonus_content?: BonusContent[];
  estimated_total_pages?: number;
  estimated_word_count?: number;
}

interface Chapter {
  id: string;
  number: number;
  title: string;
  description: string;
  keyPoints: string[];
  estimatedPages?: number;
  sections?: Section[];
  // Generated content fields
  content?: string;
  wordCount?: number;
  readingTimeMinutes?: number;
  keyTakeaways?: string[];
}

interface Section {
  id: string;
  title: string;
  content_type: string;
}

interface BonusContent {
  title: string;
  type: string;
}

interface ProductStructure {
  product_structure: {
    type: string;
    parts: Part[];
    total_modules?: number;
    estimated_completion_time?: string;
    difficulty_progression?: string;
  };
  deliverables?: Deliverable[];
  tech_requirements?: string[];
}

interface Part {
  id: string;
  title: string;
  description: string;
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  learning_objectives?: string[];
  duration_minutes?: number;
  content_items?: ContentItem[];
}

interface ContentItem {
  id: string;
  type: string;
  title: string;
  description?: string;
}

interface Deliverable {
  name: string;
  format: string;
  description: string;
}

interface Asset {
  id: string;
  name: string;
  type: 'image' | 'document' | 'video' | 'audio' | 'other';
  url?: string;
  thumbnailUrl?: string;
  fullUrl?: string;
  prompt?: string;
  file?: File;
  status: 'pending' | 'uploaded' | 'generating' | 'error';
  generatedPrompt?: string;
  category?: 'cover' | 'chapter' | 'illustration' | 'diagram' | 'icon' | 'uploaded';
  aspectRatio?: string;
}

interface ImageSuggestion {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: 'cover' | 'chapter' | 'illustration' | 'diagram' | 'icon';
  priority: number;
  aspectRatio?: string;
  purpose?: string;
}

interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  product_type: string;
  status: string;
  core_features: string[];
  pricing_model: string;
  build_time: string;
  build_difficulty: string;
  revenue_potential: string;
  notes: string;
  price_point?: string;
  raw_analysis?: {
    targetAudience?: string;
    problemSolved?: string;
    skillsMatch?: string[];
    matchScore?: number;
    outline?: ContentOutline;
    structure?: ProductStructure;
    assets?: Asset[];
  };
  created_at: string;
  updated_at: string;
}

const PRODUCT_STEPS = [
  { id: 'overview', name: 'Overview', icon: Target },
  { id: 'content', name: 'Content Plan', icon: FileText },
  { id: 'structure', name: 'Structure', icon: Lightbulb },
  { id: 'assets', name: 'Assets', icon: Zap },
  { id: 'launch', name: 'Launch', icon: Rocket },
];

const PRODUCT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ebook: Book,
  course: Video,
  template: FileText,
  saas: Code,
  community: Users,
  default: Sparkles,
};

function BuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const productId = searchParams.get('product');
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [showProductMenu, setShowProductMenu] = useState<string | null>(null);
  
  // Content generation states
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatingChapterId, setGeneratingChapterId] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());
  
  // Assets state
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const [assetGenerationPrompt, setAssetGenerationPrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageSuggestions, setImageSuggestions] = useState<ImageSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Launch state
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTab, setPreviewTab] = useState<'overview' | 'content' | 'structure' | 'assets'>('overview');
  const [productPrice, setProductPrice] = useState('');
  const [launchChecklist, setLaunchChecklist] = useState({
    contentComplete: false,
    structureComplete: false,
    assetsReady: false,
    pricingSet: false,
    previewReviewed: false,
  });
  const [isLaunching, setIsLaunching] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    targetAudience: '',
    problemSolved: '',
    notes: '',
  });
  
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
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);

    // Check subscription
    try {
      const billingRes = await fetch('/api/billing');
      if (billingRes.ok) {
        const billingData = await billingRes.json();
        const plan = billingData.currentPlan || 'free';
        const hasPro = plan === 'pro' || plan === 'enterprise';
        setIsPro(hasPro);
        
        if (!hasPro) {
          // Not Pro, redirect to upgrade
          router.push('/upgrade');
          return;
        }
      } else {
        setIsPro(false);
        router.push('/upgrade');
        return;
      }
    } catch {
      setIsPro(false);
      router.push('/upgrade');
      return;
    }

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

    // Load all user products
    try {
      const productsRes = await fetch('/api/products');
      if (productsRes.ok) {
        const { products: userProducts } = await productsRes.json();
        setProducts(userProducts || []);
      }
    } catch (e) {
      console.error('Failed to load products:', e);
    }

    // Load specific product if ID provided
    if (productId) {
      try {
        const productRes = await fetch(`/api/products/${productId}`);
        if (productRes.ok) {
          const { product } = await productRes.json();
          setCurrentProduct(product);
          setFormData({
            name: product.name || '',
            tagline: product.tagline || '',
            description: product.description || '',
            targetAudience: product.raw_analysis?.targetAudience || '',
            problemSolved: product.raw_analysis?.problemSolved || '',
            notes: product.notes || '',
          });
          // Set product price
          setProductPrice(product.price_point || '');
        }
      } catch (e) {
        console.error('Failed to load product:', e);
      }
    }

    setIsLoading(false);
  };

  const handleSaveProduct = async () => {
    if (!currentProduct) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/products/${currentProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          tagline: formData.tagline,
          description: formData.description,
          notes: formData.notes,
          price_point: productPrice || null,
          raw_analysis: {
            ...currentProduct.raw_analysis,
            targetAudience: formData.targetAudience,
            problemSolved: formData.problemSolved,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to save');
      
      const { product } = await response.json();
      setCurrentProduct(product);
      
      // Update in list
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');
      
      // Remove from list
      setProducts(prev => prev.filter(p => p.id !== id));
      
      // If deleted current product, clear it
      if (currentProduct?.id === id) {
        setCurrentProduct(null);
        router.push('/builder');
      }
      
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete product');
    }
  };

  // Generate content outline using AI
  const handleGenerateOutline = async () => {
    if (!currentProduct) return;
    
    setIsGeneratingOutline(true);
    try {
      const response = await fetch(`/api/products/${currentProduct.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'outline' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate outline');
      }
      
      const data = await response.json();
      
      // Update current product with the outline
      setCurrentProduct(prev => prev ? {
        ...prev,
        raw_analysis: {
          ...prev.raw_analysis,
          outline: data.outline,
        },
      } : null);
      
      // Also update in products list
      setProducts(prev => prev.map(p => 
        p.id === currentProduct.id 
          ? { ...p, raw_analysis: { ...p.raw_analysis, outline: data.outline } }
          : p
      ));
    } catch (error) {
      console.error('Generate outline error:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate outline');
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  // Generate product structure using AI
  const handleGenerateStructure = async () => {
    if (!currentProduct) return;
    
    setIsGeneratingStructure(true);
    try {
      const response = await fetch(`/api/products/${currentProduct.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'structure' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate structure');
      }
      
      const data = await response.json();
      
      // Update current product with the structure
      setCurrentProduct(prev => prev ? {
        ...prev,
        raw_analysis: {
          ...prev.raw_analysis,
          structure: data.structure,
        },
      } : null);
      
      // Also update in products list
      setProducts(prev => prev.map(p => 
        p.id === currentProduct.id 
          ? { ...p, raw_analysis: { ...p.raw_analysis, structure: data.structure } }
          : p
      ));
    } catch (error) {
      console.error('Generate structure error:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate structure');
    } finally {
      setIsGeneratingStructure(false);
    }
  };

  // Generate ALL chapter content at once
  const handleGenerateAllContent = async () => {
    if (!currentProduct || !currentProduct.raw_analysis?.outline?.chapters) return;
    
    setIsGeneratingContent(true);
    try {
      const response = await fetch(`/api/products/${currentProduct.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'all-chapters' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate content');
      }
      
      const data = await response.json();
      
      // Update current product with the content-filled outline
      setCurrentProduct(prev => prev ? {
        ...prev,
        raw_analysis: {
          ...prev.raw_analysis,
          outline: data.outline,
        },
      } : null);
      
      // Also update in products list
      setProducts(prev => prev.map(p => 
        p.id === currentProduct.id 
          ? { ...p, raw_analysis: { ...p.raw_analysis, outline: data.outline } }
          : p
      ));

      // Mark content as complete in checklist
      setLaunchChecklist(prev => ({ ...prev, contentComplete: true }));
      
      // Show stats
      alert(`✨ Content generated!\n\n📝 ${data.stats.chaptersGenerated} chapters written\n📊 ${data.stats.totalWordCount.toLocaleString()} words\n📖 ~${data.stats.estimatedPages} pages`);
    } catch (error) {
      console.error('Generate content error:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate content');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Generate content for a single chapter
  const handleGenerateChapterContent = async (chapter: Chapter) => {
    if (!currentProduct) return;
    
    setGeneratingChapterId(chapter.id);
    try {
      const response = await fetch(`/api/products/${currentProduct.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'chapter-content',
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          chapterDescription: chapter.description,
          keyPoints: chapter.keyPoints,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate chapter content');
      }
      
      const data = await response.json();
      
      // Update current product with the updated outline
      setCurrentProduct(prev => prev ? {
        ...prev,
        raw_analysis: {
          ...prev.raw_analysis,
          outline: data.outline,
        },
      } : null);
      
      // Also update in products list
      setProducts(prev => prev.map(p => 
        p.id === currentProduct.id 
          ? { ...p, raw_analysis: { ...p.raw_analysis, outline: data.outline } }
          : p
      ));

      // Check if all chapters now have content
      const allHaveContent = data.outline.chapters?.every((ch: Chapter) => ch.content);
      if (allHaveContent) {
        setLaunchChecklist(prev => ({ ...prev, contentComplete: true }));
      }
    } catch (error) {
      console.error('Generate chapter content error:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate chapter content');
    } finally {
      setGeneratingChapterId(null);
    }
  };

  // Handle file upload for assets
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploadingAsset(true);
    
    const newAssets: Asset[] = [];
    for (const file of Array.from(files)) {
      const assetType = file.type.startsWith('image/') ? 'image' 
        : file.type.startsWith('video/') ? 'video'
        : file.type.startsWith('audio/') ? 'audio'
        : file.type.includes('pdf') || file.type.includes('document') ? 'document'
        : 'other';
      
      newAssets.push({
        id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: assetType,
        file: file,
        status: 'pending',
      });
    }
    
    setAssets(prev => [...prev, ...newAssets]);
    
    // TODO: Actually upload to storage (Supabase Storage or similar)
    // For now, simulate upload
    setTimeout(() => {
      setAssets(prev => prev.map(a => 
        newAssets.find(na => na.id === a.id) 
          ? { ...a, status: 'uploaded' as const, url: URL.createObjectURL(a.file!) }
          : a
      ));
      setIsUploadingAsset(false);
    }, 1500);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generate AI image suggestions based on product content
  const handleGetImageSuggestions = async () => {
    if (!currentProduct) return;
    
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(`/api/products/${currentProduct.id}/generate-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suggest' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get suggestions');
      }
      
      const data = await response.json();
      setImageSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Get suggestions error:', error);
      alert(error instanceof Error ? error.message : 'Failed to get image suggestions');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Generate a specific image from a suggestion
  const handleGenerateSuggestedImage = async (suggestion: ImageSuggestion) => {
    if (!currentProduct) return;
    
    setIsGeneratingImage(true);
    
    const prompt = suggestion.prompt;
    const width = 1024;
    const height = 768;
    const thumbnailUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=400&height=300&nologo=true`;
    const fullUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true`;
    
    // Create a new asset
    const newAsset: Asset = {
      id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: suggestion.title,
      type: 'image',
      status: 'uploaded',
      prompt: prompt,
      thumbnailUrl: thumbnailUrl,
      fullUrl: fullUrl,
      url: thumbnailUrl,
      category: suggestion.category,
    };
    
    setAssets(prev => [...prev, newAsset]);
    
    // Remove from suggestions
    setImageSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    setIsGeneratingImage(false);
  };

  // Generate AI image from custom prompt
  const handleGenerateImage = async () => {
    if (!assetGenerationPrompt.trim() || !currentProduct) return;
    
    setIsGeneratingImage(true);
    
    const prompt = assetGenerationPrompt.trim();
    const width = 1024;
    const height = 768;
    const thumbnailUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=400&height=300&nologo=true`;
    const fullUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true`;
    
    const newAsset: Asset = {
      id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Custom: ${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}`,
      type: 'image',
      status: 'uploaded',
      prompt: prompt,
      thumbnailUrl: thumbnailUrl,
      fullUrl: fullUrl,
      url: thumbnailUrl,
      category: 'illustration',
    };
    
    setAssets(prev => [...prev, newAsset]);
    setAssetGenerationPrompt('');
    setIsGeneratingImage(false);
  };

  // Delete asset
  const handleDeleteAsset = (assetId: string) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
  };

  // Handle launch product
  const handleLaunchProduct = async () => {
    if (!currentProduct) return;
    
    setIsLaunching(true);
    try {
      // Update product status to 'launched'
      const response = await fetch(`/api/products/${currentProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'launched' }),
      });

      if (!response.ok) throw new Error('Failed to launch');
      
      const { product } = await response.json();
      setCurrentProduct(product);
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
      
      setShowLaunchModal(false);
      
      // Redirect to marketplace or show success
      alert('🎉 Product launched successfully! It will appear on the marketplace shortly.');
    } catch (error) {
      console.error('Launch error:', error);
      alert('Failed to launch product');
    } finally {
      setIsLaunching(false);
    }
  };

  // Toggle chapter expansion
  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  // Toggle part expansion
  const togglePart = (partId: string) => {
    setExpandedParts(prev => {
      const next = new Set(prev);
      if (next.has(partId)) {
        next.delete(partId);
      } else {
        next.add(partId);
      }
      return next;
    });
  };

  // Check if all launch requirements are met
  const canLaunch = () => {
    return Object.values(launchChecklist).every(Boolean);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const createNewChat = () => {
    router.push('/chat');
  };

  const getProductIcon = (type?: string) => {
    return PRODUCT_ICONS[type || ''] || PRODUCT_ICONS.default;
  };

  if (isLoading || isPro === null) {
    return (
      <div className="min-h-screen bg-uvz-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-uvz-orange mx-auto mb-4" />
          <p className="font-bold text-gray-600">Loading builder...</p>
        </div>
      </div>
    );
  }

  // Not Pro - this shouldn't show due to redirect, but just in case
  if (!isPro) {
    return (
      <div className="min-h-screen bg-uvz-cream flex items-center justify-center">
        <div className="text-center bg-white border-4 border-black rounded-2xl p-8 shadow-brutal max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black mb-2">Pro Feature</h1>
          <p className="text-gray-600 mb-6">
            The Product Builder is a Pro feature. Upgrade to start building and selling your products.
          </p>
          <Link
            href="/upgrade"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold border-2 border-black rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all"
          >
            <Crown className="w-5 h-5" />
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  const isMobile = !isDesktop;
  const ProductIcon = getProductIcon(currentProduct?.product_type);

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
        currentSessionId={null}
      />

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 ${isSidebarOpen && !isMobile ? 'ml-72' : ''}`}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.push('/chat')}
            className="flex items-center gap-2 text-gray-600 hover:text-black font-bold mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Research
          </button>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Products Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white border-2 border-black rounded-xl p-4 shadow-brutal">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black">Your Products</h2>
                  <span className="text-sm text-gray-500">{products.length}</span>
                </div>
                
                {products.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No products yet</p>
                    <p className="text-xs text-gray-400 mt-1">Complete research to get product suggestions</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {products.map(product => {
                      const Icon = getProductIcon(product.product_type);
                      const isActive = currentProduct?.id === product.id;
                      
                      return (
                        <div
                          key={product.id}
                          className={`relative group rounded-lg border-2 transition-all ${
                            isActive 
                              ? 'border-uvz-orange bg-orange-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <button
                            onClick={() => router.push(`/builder?product=${product.id}`)}
                            className="w-full p-3 text-left"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                isActive ? 'bg-uvz-orange text-white' : 'bg-gray-100 text-gray-600'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate">{product.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{product.status}</p>
                              </div>
                            </div>
                          </button>
                          
                          {/* Menu */}
                          <div className="absolute top-2 right-2">
                            <button
                              onClick={() => setShowProductMenu(showProductMenu === product.id ? null : product.id)}
                              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            
                            {showProductMenu === product.id && (
                              <div className="absolute right-0 mt-1 bg-white border-2 border-black rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                                <button
                                  onClick={() => {
                                    setProductToDelete(product.id);
                                    setShowDeleteModal(true);
                                    setShowProductMenu(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <Link
                  href="/chat"
                  className="mt-4 w-full py-2 text-sm font-bold text-gray-600 hover:text-black flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Research
                </Link>
              </div>
            </div>

            {/* Main Builder Area */}
            <div className="lg:col-span-3">
              {!currentProduct ? (
                // No product selected
                <div className="bg-white border-2 border-black rounded-xl p-12 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-xl font-black mb-2">Select a Product</h2>
                  <p className="text-gray-600 mb-6">
                    Choose a product from the sidebar to continue building, or start new research to get product suggestions.
                  </p>
                  <Link
                    href="/chat"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-uvz-orange text-white font-bold border-2 border-black rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all"
                  >
                    <Sparkles className="w-5 h-5" />
                    Start Research
                  </Link>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-brutal mb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-uvz-orange to-orange-400 border-2 border-black rounded-xl flex items-center justify-center">
                          <ProductIcon className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h1 className="text-2xl font-black mb-1">{currentProduct.name}</h1>
                          <p className="text-gray-600 capitalize">
                            {currentProduct.product_type?.replace('_', ' ') || 'Digital Product'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                              currentProduct.status === 'launched' 
                                ? 'bg-green-100 text-green-700' 
                                : currentProduct.status === 'building'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-600'
                            }`}>
                              {currentProduct.status}
                            </span>
                            {currentProduct.build_difficulty && (
                              <span className="px-2 py-0.5 text-xs font-bold bg-yellow-100 text-yellow-700 rounded-full capitalize">
                                {currentProduct.build_difficulty}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleSaveProduct}
                        disabled={isSaving}
                        className="px-4 py-2 bg-uvz-orange text-white font-bold border-2 border-black rounded-lg hover:bg-orange-500 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save
                      </button>
                    </div>
                  </div>

                  {/* Progress Steps */}
                  <div className="bg-white border-2 border-black rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between overflow-x-auto">
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
                              <div className={`w-8 h-1 mx-2 rounded shrink-0 ${
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
                          Define the key aspects of your product.
                        </p>
                        
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Product Name</label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter your product name"
                              className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-uvz-orange"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Tagline</label>
                            <input
                              type="text"
                              value={formData.tagline}
                              onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                              placeholder="What does your product do in one sentence?"
                              className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-uvz-orange"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                            <textarea
                              value={formData.description}
                              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Describe your product in detail..."
                              rows={4}
                              className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-uvz-orange resize-none"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Target Audience</label>
                            <textarea
                              value={formData.targetAudience}
                              onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                              placeholder="Who is this product for?"
                              rows={3}
                              className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-uvz-orange resize-none"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Problem Solved</label>
                            <textarea
                              value={formData.problemSolved}
                              onChange={(e) => setFormData(prev => ({ ...prev, problemSolved: e.target.value }))}
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
                          Outline the content structure for your {currentProduct.product_type || 'product'}.
                        </p>
                        
                        {/* AI Content Generation */}
                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
                          <div className="flex items-center gap-2 text-yellow-800 font-bold mb-2">
                            <Sparkles className="w-5 h-5" />
                            AI Content Assistant
                          </div>
                          <p className="text-sm text-yellow-700 mb-3">
                            Let AI help generate content structure based on your research.
                          </p>
                          <button 
                            onClick={handleGenerateOutline}
                            disabled={isGeneratingOutline}
                            className="px-4 py-2 bg-yellow-400 text-black font-bold border-2 border-black rounded-lg hover:bg-yellow-500 transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            {isGeneratingOutline ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                Generate Content Outline
                              </>
                            )}
                          </button>
                        </div>
                        
                        {/* Display Generated Outline */}
                        {currentProduct.raw_analysis?.outline && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-black text-lg">{currentProduct.raw_analysis.outline.title}</h3>
                              <button
                                onClick={handleGenerateOutline}
                                disabled={isGeneratingOutline}
                                className="text-sm text-uvz-orange hover:underline flex items-center gap-1"
                              >
                                <RefreshCw className={`w-4 h-4 ${isGeneratingOutline ? 'animate-spin' : ''}`} />
                                Regenerate
                              </button>
                            </div>
                            {currentProduct.raw_analysis.outline.subtitle && (
                              <p className="text-gray-600">{currentProduct.raw_analysis.outline.subtitle}</p>
                            )}
                            
                            <div className="flex gap-4 text-sm text-gray-500">
                              {currentProduct.raw_analysis.outline.estimated_total_pages && (
                                <span>📄 ~{currentProduct.raw_analysis.outline.estimated_total_pages} pages</span>
                              )}
                              {currentProduct.raw_analysis.outline.estimated_word_count && (
                                <span>📝 ~{currentProduct.raw_analysis.outline.estimated_word_count.toLocaleString()} words</span>
                              )}
                            </div>
                            
                            {/* Generate Full Content Button */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-bold text-green-800 flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Write Full Content
                                  </h4>
                                  <p className="text-sm text-green-700 mt-1">
                                    Generate the actual written content for all {currentProduct.raw_analysis.outline.chapters?.length || 0} chapters
                                  </p>
                                  {/* Content Progress */}
                                  {currentProduct.raw_analysis.outline.chapters && (
                                    <div className="mt-2 flex items-center gap-2">
                                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-xs">
                                        <div 
                                          className="h-full bg-green-500 transition-all duration-300"
                                          style={{ 
                                            width: `${(currentProduct.raw_analysis.outline.chapters.filter((ch: Chapter) => ch.content).length / currentProduct.raw_analysis.outline.chapters.length) * 100}%` 
                                          }}
                                        />
                                      </div>
                                      <span className="text-xs text-green-700 font-bold">
                                        {currentProduct.raw_analysis.outline.chapters.filter((ch: Chapter) => ch.content).length}/{currentProduct.raw_analysis.outline.chapters.length} written
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={handleGenerateAllContent}
                                  disabled={isGeneratingContent}
                                  className="px-4 py-2 bg-green-500 text-white font-bold border-2 border-black rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0"
                                >
                                  {isGeneratingContent ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Writing...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-4 h-4" />
                                      Write All Chapters
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                            
                            <div className="space-y-3 mt-6">
                              {currentProduct.raw_analysis.outline.chapters?.map((chapter: Chapter) => (
                                <div key={chapter.id} className={`border-2 rounded-xl overflow-hidden ${chapter.content ? 'border-green-300 bg-green-50/30' : 'border-gray-200'}`}>
                                  <button
                                    onClick={() => toggleChapter(chapter.id)}
                                    className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                                  >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${chapter.content ? 'bg-green-500 text-white' : 'bg-uvz-orange text-white'}`}>
                                      {chapter.content ? <CheckCircle className="w-5 h-5" /> : chapter.number}
                                    </div>
                                    <div className="flex-1 text-left">
                                      <p className="font-bold">{chapter.title}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        {chapter.wordCount ? (
                                          <span className="text-xs text-green-600 font-medium">✓ {chapter.wordCount.toLocaleString()} words</span>
                                        ) : chapter.estimatedPages ? (
                                          <span className="text-xs text-gray-500">~{chapter.estimatedPages} pages</span>
                                        ) : null}
                                        {chapter.readingTimeMinutes && (
                                          <span className="text-xs text-gray-500">• {chapter.readingTimeMinutes} min read</span>
                                        )}
                                      </div>
                                    </div>
                                    {!chapter.content && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleGenerateChapterContent(chapter);
                                        }}
                                        disabled={generatingChapterId === chapter.id}
                                        className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-bold rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
                                      >
                                        {generatingChapterId === chapter.id ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <Sparkles className="w-3 h-3" />
                                        )}
                                        Write
                                      </button>
                                    )}
                                    {expandedChapters.has(chapter.id) ? (
                                      <ChevronDown className="w-5 h-5 text-gray-400" />
                                    ) : (
                                      <ChevronRight className="w-5 h-5 text-gray-400" />
                                    )}
                                  </button>
                                  
                                  {expandedChapters.has(chapter.id) && (
                                    <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                                      {/* Chapter Content if generated */}
                                      {chapter.content ? (
                                        <div className="mt-4">
                                          <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-bold text-sm text-green-800">📖 Chapter Content</h4>
                                            <button
                                              onClick={() => handleGenerateChapterContent(chapter)}
                                              disabled={generatingChapterId === chapter.id}
                                              className="text-xs text-green-600 hover:underline flex items-center gap-1"
                                            >
                                              <RefreshCw className={`w-3 h-3 ${generatingChapterId === chapter.id ? 'animate-spin' : ''}`} />
                                              Regenerate
                                            </button>
                                          </div>
                                          <div className="prose prose-sm max-w-none bg-white rounded-lg p-4 border border-green-200">
                                            <div 
                                              className="text-gray-700 whitespace-pre-wrap"
                                              dangerouslySetInnerHTML={{ 
                                                __html: chapter.content
                                                  .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold mt-4 mb-2 text-gray-900">$1</h2>')
                                                  .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold mt-3 mb-2 text-gray-800">$1</h3>')
                                                  .replace(/^\*\*(.*?)\*\*/gm, '<strong class="font-bold">$1</strong>')
                                                  .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
                                                  .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
                                                  .replace(/\n\n/g, '</p><p class="my-2">')
                                              }}
                                            />
                                          </div>
                                          
                                          {/* Key Takeaways */}
                                          {chapter.keyTakeaways && chapter.keyTakeaways.length > 0 && (
                                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                              <h5 className="font-bold text-sm text-blue-800 mb-2">💡 Key Takeaways</h5>
                                              <ul className="space-y-1">
                                                {chapter.keyTakeaways.map((takeaway, i) => (
                                                  <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                                    {takeaway}
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <>
                                          <p className="text-sm text-gray-600 mb-3">{chapter.description}</p>
                                          
                                          {chapter.keyPoints && chapter.keyPoints.length > 0 && (
                                            <div className="mb-3">
                                              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Key Points to Cover</p>
                                              <ul className="space-y-1">
                                                {chapter.keyPoints.map((point, i) => (
                                                  <li key={i} className="flex items-start gap-2 text-sm">
                                                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                                    <span>{point}</span>
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                          
                                          {chapter.sections && chapter.sections.length > 0 && (
                                            <div>
                                              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Sections</p>
                                              <div className="space-y-1">
                                                {chapter.sections.map((section) => (
                                                  <div key={section.id} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded-lg">
                                                    <GripVertical className="w-4 h-4 text-gray-300" />
                                                    <span>{section.title}</span>
                                                    <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full capitalize">
                                                      {section.content_type.replace('_', ' ')}
                                                    </span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* CTA to generate content for this chapter */}
                                          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                            <p className="text-sm text-yellow-800 mb-2">
                                              ✍️ This chapter needs content. Click "Write" to generate the full text.
                                            </p>
                                            <button
                                              onClick={() => handleGenerateChapterContent(chapter)}
                                              disabled={generatingChapterId === chapter.id}
                                              className="px-3 py-1.5 bg-yellow-400 text-black text-sm font-bold rounded-lg hover:bg-yellow-500 transition-colors flex items-center gap-1"
                                            >
                                              {generatingChapterId === chapter.id ? (
                                                <>
                                                  <Loader2 className="w-3 h-3 animate-spin" />
                                                  Writing...
                                                </>
                                              ) : (
                                                <>
                                                  <Sparkles className="w-3 h-3" />
                                                  Generate Chapter Content
                                                </>
                                              )}
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {/* Bonus Content */}
                            {currentProduct.raw_analysis.outline.bonus_content && currentProduct.raw_analysis.outline.bonus_content.length > 0 && (
                              <div className="mt-6 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
                                <h4 className="font-bold text-purple-800 mb-3">🎁 Bonus Content</h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {currentProduct.raw_analysis.outline.bonus_content.map((bonus: BonusContent, i: number) => (
                                    <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-lg text-sm">
                                      <CheckCircle className="w-4 h-4 text-purple-500" />
                                      <span>{bonus.title}</span>
                                      <span className="text-xs text-gray-500 capitalize">({bonus.type})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* MVP Features */}
                        {currentProduct.core_features && currentProduct.core_features.length > 0 && !currentProduct.raw_analysis?.outline && (
                          <div>
                            <h3 className="font-bold mb-3">MVP Features</h3>
                            <ul className="space-y-2">
                              {currentProduct.core_features.map((feature: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div>
                        <h2 className="text-xl font-black mb-4">Product Structure</h2>
                        <p className="text-gray-600 mb-6">
                          Define the modules, chapters, or features of your product.
                        </p>
                        
                        {/* AI Structure Generation */}
                        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 mb-6">
                          <div className="flex items-center gap-2 text-blue-800 font-bold mb-2">
                            <Lightbulb className="w-5 h-5" />
                            AI Structure Generator
                          </div>
                          <p className="text-sm text-blue-700 mb-3">
                            Generate a detailed structure with modules, lessons, and content items.
                          </p>
                          <button 
                            onClick={handleGenerateStructure}
                            disabled={isGeneratingStructure}
                            className="px-4 py-2 bg-blue-400 text-white font-bold border-2 border-black rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            {isGeneratingStructure ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating Structure...
                              </>
                            ) : (
                              <>
                                <Lightbulb className="w-4 h-4" />
                                Generate Product Structure
                              </>
                            )}
                          </button>
                        </div>
                        
                        {/* Display Generated Structure */}
                        {currentProduct.raw_analysis?.structure && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-black text-lg capitalize">
                                {currentProduct.raw_analysis.structure.product_structure?.type || currentProduct.product_type} Structure
                              </h3>
                              <button
                                onClick={handleGenerateStructure}
                                disabled={isGeneratingStructure}
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <RefreshCw className={`w-4 h-4 ${isGeneratingStructure ? 'animate-spin' : ''}`} />
                                Regenerate
                              </button>
                            </div>
                            
                            <div className="flex gap-4 text-sm text-gray-500">
                              {currentProduct.raw_analysis.structure.product_structure?.total_modules && (
                                <span>📦 {currentProduct.raw_analysis.structure.product_structure.total_modules} modules</span>
                              )}
                              {currentProduct.raw_analysis.structure.product_structure?.estimated_completion_time && (
                                <span>⏱️ {currentProduct.raw_analysis.structure.product_structure.estimated_completion_time}</span>
                              )}
                              {currentProduct.raw_analysis.structure.product_structure?.difficulty_progression && (
                                <span>📈 {currentProduct.raw_analysis.structure.product_structure.difficulty_progression}</span>
                              )}
                            </div>
                            
                            {/* Parts/Modules */}
                            <div className="space-y-4 mt-6">
                              {currentProduct.raw_analysis.structure.product_structure?.parts?.map((part) => (
                                <div key={part.id} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                                  <button
                                    onClick={() => togglePart(part.id)}
                                    className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors bg-gradient-to-r from-blue-50 to-transparent"
                                  >
                                    <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center">
                                      <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 text-left">
                                      <p className="font-bold">{part.title}</p>
                                      <p className="text-sm text-gray-500">{part.modules?.length || 0} modules</p>
                                    </div>
                                    {expandedParts.has(part.id) ? (
                                      <ChevronDown className="w-5 h-5 text-gray-400" />
                                    ) : (
                                      <ChevronRight className="w-5 h-5 text-gray-400" />
                                    )}
                                  </button>
                                  
                                  {expandedParts.has(part.id) && (
                                    <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                                      <p className="text-sm text-gray-600 my-3">{part.description}</p>
                                      
                                      <div className="space-y-3">
                                        {part.modules?.map((module, moduleIndex) => (
                                          <div key={module.id} className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                              <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold">
                                                {moduleIndex + 1}
                                              </span>
                                              <div className="flex-1">
                                                <p className="font-bold text-sm">{module.title}</p>
                                                {module.duration_minutes && (
                                                  <p className="text-xs text-gray-500">{module.duration_minutes} min</p>
                                                )}
                                                
                                                {module.learning_objectives && module.learning_objectives.length > 0 && (
                                                  <div className="mt-2">
                                                    <p className="text-xs font-bold text-gray-400 uppercase">Learning Objectives</p>
                                                    <ul className="mt-1 space-y-1">
                                                      {module.learning_objectives.map((obj, i) => (
                                                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                                                          <Target className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                                                          {obj}
                                                        </li>
                                                      ))}
                                                    </ul>
                                                  </div>
                                                )}
                                                
                                                {module.content_items && module.content_items.length > 0 && (
                                                  <div className="mt-2 flex flex-wrap gap-1">
                                                    {module.content_items.map((item) => (
                                                      <span 
                                                        key={item.id} 
                                                        className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded-full capitalize"
                                                      >
                                                        {item.type === 'video' && '🎬'}
                                                        {item.type === 'text' && '📄'}
                                                        {item.type === 'exercise' && '✏️'}
                                                        {item.type === 'quiz' && '❓'}
                                                        {item.type === 'download' && '📥'}
                                                        {' '}{item.title}
                                                      </span>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {/* Deliverables */}
                            {currentProduct.raw_analysis.structure.deliverables && currentProduct.raw_analysis.structure.deliverables.length > 0 && (
                              <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                                <h4 className="font-bold text-green-800 mb-3">📦 Deliverables</h4>
                                <div className="grid gap-2">
                                  {currentProduct.raw_analysis.structure.deliverables.map((deliverable, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                        <Package className="w-4 h-4 text-green-600" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-sm">{deliverable.name}</p>
                                        <p className="text-xs text-gray-500">{deliverable.format} • {deliverable.description}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Tech Requirements */}
                            {currentProduct.raw_analysis.structure.tech_requirements && currentProduct.raw_analysis.structure.tech_requirements.length > 0 && (
                              <div className="mt-4 p-4 bg-gray-100 rounded-xl">
                                <h4 className="font-bold text-gray-700 mb-2">🔧 Technical Requirements</h4>
                                <div className="flex flex-wrap gap-2">
                                  {currentProduct.raw_analysis.structure.tech_requirements.map((req, i) => (
                                    <span key={i} className="text-xs px-3 py-1 bg-white rounded-full border border-gray-200">
                                      {req}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Show placeholder if no structure yet */}
                        {!currentProduct.raw_analysis?.structure && !isGeneratingStructure && (
                          <div className="text-center py-8 text-gray-500">
                            <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Click the button above to generate your product structure</p>
                          </div>
                        )}
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div>
                        <h2 className="text-xl font-black mb-4">Assets & Resources</h2>
                        <p className="text-gray-600 mb-6">
                          Upload or generate the assets needed for your product.
                        </p>
                        
                        {/* AI Auto-Suggest Section */}
                        {currentProduct.raw_analysis?.outline && (
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-black text-purple-800 flex items-center gap-2">
                                  <Sparkles className="w-5 h-5" />
                                  AI Image Suggestions
                                </h3>
                                <p className="text-sm text-purple-600">
                                  Generate images based on your content outline
                                </p>
                              </div>
                              <button
                                onClick={handleGetImageSuggestions}
                                disabled={isLoadingSuggestions}
                                className="px-4 py-2 bg-purple-500 text-white font-bold border-2 border-black rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                              >
                                {isLoadingSuggestions ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Analyzing...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-4 h-4" />
                                    Auto-Suggest Images
                                  </>
                                )}
                              </button>
                            </div>
                            
                            {/* Image Suggestions Grid */}
                            {imageSuggestions.length > 0 && (
                              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                {imageSuggestions.map((suggestion) => (
                                  <div key={suggestion.id} className="bg-white border-2 border-purple-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-bold capitalize">
                                        {suggestion.category}
                                      </span>
                                      <span className="text-xs text-gray-500">Priority: {suggestion.priority}</span>
                                    </div>
                                    <h4 className="font-bold text-sm mb-1">{suggestion.title}</h4>
                                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">{suggestion.description}</p>
                                    <button
                                      onClick={() => handleGenerateSuggestedImage(suggestion)}
                                      disabled={isGeneratingImage}
                                      className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                      <ImageIcon className="w-4 h-4" />
                                      Generate Image
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Upload Section */}
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                          {/* File Upload */}
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-uvz-orange transition-colors">
                            <input
                              ref={fileInputRef}
                              type="file"
                              multiple
                              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                            <Upload className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="font-bold mb-1">Upload Files</p>
                            <p className="text-sm text-gray-500 mb-4">
                              Drag & drop or click to upload images, videos, PDFs
                            </p>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploadingAsset}
                              className="px-4 py-2 bg-gray-100 text-black font-bold border-2 border-black rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              {isUploadingAsset ? 'Uploading...' : 'Choose Files'}
                            </button>
                          </div>
                          
                          {/* Custom AI Image Generation */}
                          <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-6">
                            <div className="flex items-center gap-2 text-purple-800 font-bold mb-2">
                              <ImageIcon className="w-5 h-5" />
                              Custom AI Image
                            </div>
                            <p className="text-sm text-purple-700 mb-3">
                              Generate custom images with your own prompt
                            </p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={assetGenerationPrompt}
                                onChange={(e) => setAssetGenerationPrompt(e.target.value)}
                                placeholder="Describe the image you want..."
                                className="flex-1 px-3 py-2 border-2 border-purple-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                              />
                              <button
                                onClick={handleGenerateImage}
                                disabled={isGeneratingImage || !assetGenerationPrompt.trim()}
                                className="px-4 py-2 bg-purple-500 text-white font-bold border-2 border-black rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                              >
                                {isGeneratingImage ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Sparkles className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Assets Grid */}
                        {assets.length > 0 ? (
                          <div>
                            <h3 className="font-bold mb-3">Your Assets ({assets.length})</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {assets.map((asset) => (
                                <div 
                                  key={asset.id} 
                                  className="relative group border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                                >
                                  {asset.type === 'image' ? (
                                    (asset.thumbnailUrl || asset.url) ? (
                                      <div className="relative">
                                        <img 
                                          src={asset.thumbnailUrl || asset.url} 
                                          alt={asset.name}
                                          className="w-full h-40 object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12">Loading...</text></svg>';
                                          }}
                                        />
                                        {asset.status === 'generating' && (
                                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                            <div className="bg-white rounded-lg px-3 py-2 flex items-center gap-2">
                                              <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                                              <span className="text-sm font-bold">Generating...</span>
                                            </div>
                                          </div>
                                        )}
                                        {asset.fullUrl && (
                                          <button
                                            onClick={() => window.open(asset.fullUrl, '_blank')}
                                            className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded hover:bg-black transition-colors"
                                          >
                                            View Full Size
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                                        <div className="text-center">
                                          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2" />
                                          <span className="text-xs text-purple-600">Generating...</span>
                                        </div>
                                      </div>
                                    )
                                  ) : (
                                    <div className="w-full h-40 bg-gray-100 flex flex-col items-center justify-center">
                                      <FileText className="w-10 h-10 text-gray-400 mb-2" />
                                      <span className="text-xs text-gray-500 capitalize">{asset.type}</span>
                                    </div>
                                  )}
                                  
                                  <div className="p-3">
                                    <p className="text-sm font-bold truncate">{asset.name}</p>
                                    {asset.prompt && (
                                      <p className="text-xs text-gray-500 truncate mt-1" title={asset.prompt}>
                                        "{asset.prompt}"
                                      </p>
                                    )}
                                    <p className={`text-xs capitalize mt-1 ${
                                      asset.status === 'uploaded' ? 'text-green-600' :
                                      asset.status === 'generating' ? 'text-purple-600' :
                                      asset.status === 'error' ? 'text-red-600' :
                                      'text-gray-500'
                                    }`}>
                                      {asset.status === 'generating' ? '🎨 Generating...' : 
                                       asset.status === 'uploaded' ? '✓ Ready' : asset.status}
                                    </p>
                                  </div>
                                  
                                  {/* Delete button */}
                                  <button
                                    onClick={() => handleDeleteAsset(asset.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 shadow"
                                  >
                                    <X className="w-4 h-4 text-red-500" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="font-bold mb-1">No assets yet</p>
                            <p className="text-sm">
                              {currentProduct.raw_analysis?.outline 
                                ? 'Click "Auto-Suggest Images" above to get AI recommendations'
                                : 'Upload files or generate images using the options above'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {currentStep === 4 && (
                      <div>
                        <h2 className="text-xl font-black mb-4">Launch Your Product</h2>
                        <p className="text-gray-600 mb-6">
                          Review everything and launch your product on the marketplace.
                        </p>
                        
                        {/* Pricing Section */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                          <h3 className="font-black mb-4 flex items-center gap-2">
                            💰 Set Your Price
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Product Price</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                <input
                                  type="text"
                                  value={productPrice}
                                  onChange={(e) => {
                                    setProductPrice(e.target.value);
                                    // Auto-check pricing if a valid price is entered
                                    if (e.target.value && parseFloat(e.target.value) > 0) {
                                      setLaunchChecklist(prev => ({ ...prev, pricingSet: true }));
                                    }
                                  }}
                                  placeholder="49.00"
                                  className="w-full pl-8 pr-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-xl font-bold"
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                Suggested: {currentProduct.pricing_model || '$29 - $99'}
                              </p>
                            </div>
                            <div className="flex flex-col justify-center">
                              <div className="space-y-2 text-sm">
                                <p className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  <span>ManyMarkets takes 0% platform fee</span>
                                </p>
                                <p className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  <span>Payment processing: 2.9% + $0.30</span>
                                </p>
                                <p className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  <span>Instant payouts to your account</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Product Preview Card with Preview Button */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-6 mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-gray-600 font-bold">
                              <Eye className="w-5 h-5" />
                              Product Preview
                            </div>
                            <button
                              onClick={() => {
                                setShowPreviewModal(true);
                                setLaunchChecklist(prev => ({ ...prev, previewReviewed: true }));
                              }}
                              className="px-4 py-2 bg-uvz-orange text-white font-bold border-2 border-black rounded-lg hover:bg-orange-500 transition-colors flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Full Preview
                            </button>
                          </div>
                          
                          <div className="bg-white border-2 border-black rounded-xl p-6 shadow-brutal">
                            <div className="flex items-start gap-4">
                              <div className="w-20 h-20 bg-gradient-to-br from-uvz-orange to-orange-400 border-2 border-black rounded-xl flex items-center justify-center">
                                <ProductIcon className="w-10 h-10 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-xl font-black">{currentProduct.name}</h3>
                                <p className="text-gray-600 text-sm mb-2">{currentProduct.tagline || 'No tagline set'}</p>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 text-xs font-bold bg-uvz-orange/10 text-uvz-orange rounded-full capitalize">
                                    {currentProduct.product_type || 'Product'}
                                  </span>
                                  {currentProduct.build_difficulty && (
                                    <span className="px-2 py-0.5 text-xs font-bold bg-gray-100 text-gray-600 rounded-full capitalize">
                                      {currentProduct.build_difficulty}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-black text-uvz-orange">
                                  ${productPrice || '49'}
                                </p>
                                <p className="text-xs text-gray-500">Price</p>
                              </div>
                            </div>
                            
                            {currentProduct.description && (
                              <p className="text-gray-600 mt-4 text-sm line-clamp-2">
                                {currentProduct.description}
                              </p>
                            )}
                            
                            {currentProduct.core_features && currentProduct.core_features.length > 0 && (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {currentProduct.core_features.slice(0, 4).map((feature, i) => (
                                  <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded-lg">
                                    ✓ {feature}
                                  </span>
                                ))}
                                {currentProduct.core_features.length > 4 && (
                                  <span className="text-xs px-2 py-1 text-gray-500">
                                    +{currentProduct.core_features.length - 4} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Launch Checklist */}
                        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
                          <h3 className="font-black mb-4">Launch Checklist</h3>
                          <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={launchChecklist.contentComplete}
                                onChange={(e) => setLaunchChecklist(prev => ({ ...prev, contentComplete: e.target.checked }))}
                                className="w-5 h-5 rounded border-2 border-black accent-green-500"
                              />
                              <div className="flex-1">
                                <p className="font-bold">Content is complete</p>
                                <p className="text-sm text-gray-500">All chapters/modules are written and reviewed</p>
                              </div>
                              {launchChecklist.contentComplete && <Check className="w-5 h-5 text-green-500" />}
                            </label>
                            
                            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={launchChecklist.structureComplete}
                                onChange={(e) => setLaunchChecklist(prev => ({ ...prev, structureComplete: e.target.checked }))}
                                className="w-5 h-5 rounded border-2 border-black accent-green-500"
                              />
                              <div className="flex-1">
                                <p className="font-bold">Structure is finalized</p>
                                <p className="text-sm text-gray-500">Product structure has been reviewed and organized</p>
                              </div>
                              {launchChecklist.structureComplete && <Check className="w-5 h-5 text-green-500" />}
                            </label>
                            
                            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={launchChecklist.assetsReady}
                                onChange={(e) => setLaunchChecklist(prev => ({ ...prev, assetsReady: e.target.checked }))}
                                className="w-5 h-5 rounded border-2 border-black accent-green-500"
                              />
                              <div className="flex-1">
                                <p className="font-bold">Assets are ready</p>
                                <p className="text-sm text-gray-500">Cover images, graphics, and files are uploaded</p>
                              </div>
                              {launchChecklist.assetsReady && <Check className="w-5 h-5 text-green-500" />}
                            </label>
                            
                            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={launchChecklist.pricingSet}
                                onChange={(e) => setLaunchChecklist(prev => ({ ...prev, pricingSet: e.target.checked }))}
                                className="w-5 h-5 rounded border-2 border-black accent-green-500"
                              />
                              <div className="flex-1">
                                <p className="font-bold">Pricing is set</p>
                                <p className="text-sm text-gray-500">You&apos;ve decided on your pricing strategy</p>
                              </div>
                              {launchChecklist.pricingSet && <Check className="w-5 h-5 text-green-500" />}
                            </label>
                            
                            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={launchChecklist.previewReviewed}
                                onChange={(e) => setLaunchChecklist(prev => ({ ...prev, previewReviewed: e.target.checked }))}
                                className="w-5 h-5 rounded border-2 border-black accent-green-500"
                              />
                              <div className="flex-1">
                                <p className="font-bold">Preview reviewed</p>
                                <p className="text-sm text-gray-500">You&apos;ve reviewed how your product will appear</p>
                              </div>
                              {launchChecklist.previewReviewed && <Check className="w-5 h-5 text-green-500" />}
                            </label>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-bold">
                                {Object.values(launchChecklist).filter(Boolean).length} of {Object.keys(launchChecklist).length} complete
                              </span>
                            </div>
                            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 transition-all"
                                style={{ width: `${(Object.values(launchChecklist).filter(Boolean).length / Object.keys(launchChecklist).length) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Notes Section */}
                        <div className="mb-6">
                          <label className="block text-sm font-bold text-gray-700 mb-2">Launch Notes</label>
                          <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Any notes about your launch plan, marketing strategy, etc..."
                            rows={4}
                            className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-uvz-orange resize-none"
                          />
                        </div>
                        
                        {/* Launch Button */}
                        <div className={`rounded-xl p-6 text-center ${
                          canLaunch() 
                            ? 'bg-green-50 border-2 border-green-300' 
                            : 'bg-gray-50 border-2 border-gray-300'
                        }`}>
                          <Rocket className={`w-12 h-12 mx-auto mb-3 ${canLaunch() ? 'text-green-600' : 'text-gray-400'}`} />
                          <h3 className="font-black text-lg mb-2">
                            {canLaunch() ? 'Ready to Launch!' : 'Complete the Checklist'}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">
                            {canLaunch() 
                              ? 'Your product will be listed on the marketplace for others to discover and purchase.'
                              : 'Complete all checklist items above before launching your product.'
                            }
                          </p>
                          
                          {!canLaunch() && (
                            <div className="flex items-center justify-center gap-2 text-yellow-700 bg-yellow-100 rounded-lg p-3 mb-4">
                              <AlertCircle className="w-5 h-5" />
                              <span className="text-sm font-medium">
                                {Object.keys(launchChecklist).length - Object.values(launchChecklist).filter(Boolean).length} items remaining
                              </span>
                            </div>
                          )}
                          
                          <button 
                            onClick={() => setShowLaunchModal(true)}
                            disabled={!canLaunch()}
                            className={`px-8 py-3 font-bold border-2 border-black rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all flex items-center gap-2 mx-auto ${
                              canLaunch()
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed hover:translate-y-0'
                            }`}
                          >
                            <Rocket className="w-5 h-5" />
                            Launch on Marketplace
                          </button>
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
                      
                      <button
                        onClick={() => {
                          handleSaveProduct();
                          if (currentStep < PRODUCT_STEPS.length - 1) {
                            setCurrentStep(currentStep + 1);
                          }
                        }}
                        disabled={isSaving}
                        className="px-8 py-3 bg-uvz-orange text-white font-bold border-2 border-black rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {currentStep < PRODUCT_STEPS.length - 1 ? 'Save & Continue' : 'Save'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white border-4 border-black rounded-2xl p-6 shadow-brutal max-w-md mx-4">
            <h3 className="text-xl font-black mb-2">Delete Product?</h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. The product will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 font-bold border-2 border-black rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => productToDelete && handleDeleteProduct(productToDelete)}
                className="flex-1 px-4 py-2 bg-red-500 text-white font-bold border-2 border-black rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Launch Confirmation Modal */}
      {showLaunchModal && currentProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowLaunchModal(false)} />
          <div className="relative bg-white border-4 border-black rounded-2xl p-8 shadow-brutal max-w-lg mx-4">
            <button
              onClick={() => setShowLaunchModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-black mb-2">Launch Your Product</h3>
              <p className="text-gray-600">
                You&apos;re about to list <strong>{currentProduct.name}</strong> on the ManyMarkets marketplace.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h4 className="font-bold mb-3">What happens next:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  <span>Your product will be visible on the marketplace</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  <span>Buyers can discover and purchase your product</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  <span>You&apos;ll receive notifications for each sale</span>
                </li>
                <li className="flex items-start gap-2">
                  <ExternalLink className="w-5 h-5 text-blue-500 shrink-0" />
                  <span>You can share your product link on social media</span>
                </li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowLaunchModal(false)}
                className="flex-1 px-4 py-3 font-bold border-2 border-black rounded-xl hover:bg-gray-100 transition-colors"
              >
                Not Yet
              </button>
              <button
                onClick={handleLaunchProduct}
                disabled={isLaunching}
                className="flex-1 px-4 py-3 bg-green-500 text-white font-bold border-2 border-black rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLaunching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    Launch Now!
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Product Preview Modal */}
      {showPreviewModal && currentProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPreviewModal(false)} />
          <div className="relative bg-white border-4 border-black rounded-2xl shadow-brutal w-full max-w-4xl max-h-[90vh] mx-4 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-uvz-orange to-orange-400 border-2 border-black rounded-xl flex items-center justify-center">
                  <ProductIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black">{currentProduct.name}</h2>
                  <p className="text-sm text-gray-500 capitalize">{currentProduct.product_type || 'Digital Product'} Preview</p>
                </div>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 px-6">
              <button
                onClick={() => setPreviewTab('overview')}
                className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors ${
                  previewTab === 'overview' 
                    ? 'border-uvz-orange text-uvz-orange' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setPreviewTab('content')}
                className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors ${
                  previewTab === 'content' 
                    ? 'border-uvz-orange text-uvz-orange' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Content Outline
              </button>
              <button
                onClick={() => setPreviewTab('structure')}
                className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors ${
                  previewTab === 'structure' 
                    ? 'border-uvz-orange text-uvz-orange' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Structure
              </button>
              <button
                onClick={() => setPreviewTab('assets')}
                className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors ${
                  previewTab === 'assets' 
                    ? 'border-uvz-orange text-uvz-orange' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Assets
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Overview Tab */}
              {previewTab === 'overview' && (
                <div className="space-y-6">
                  {/* Hero Section Preview */}
                  <div className="bg-gradient-to-br from-uvz-orange/10 to-orange-100 rounded-2xl p-8 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-uvz-orange to-orange-400 border-4 border-black rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-brutal">
                      <ProductIcon className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-3xl font-black mb-2">{currentProduct.name}</h1>
                    <p className="text-lg text-gray-600 mb-4">{currentProduct.tagline || 'Your product tagline will appear here'}</p>
                    <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full border-2 border-black shadow-brutal">
                      <span className="text-2xl font-black text-uvz-orange">${productPrice || '49'}</span>
                      <span className="text-gray-500">one-time purchase</span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div>
                    <h3 className="font-black text-lg mb-3">About This Product</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {currentProduct.description || 'Your product description will appear here. Make sure to write a compelling description that explains the value and benefits of your product.'}
                    </p>
                  </div>
                  
                  {/* Target Audience */}
                  {currentProduct.raw_analysis?.targetAudience && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                      <h3 className="font-bold text-blue-800 mb-2">👥 Who is this for?</h3>
                      <p className="text-blue-700">{currentProduct.raw_analysis.targetAudience}</p>
                    </div>
                  )}
                  
                  {/* Problem Solved */}
                  {currentProduct.raw_analysis?.problemSolved && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                      <h3 className="font-bold text-green-800 mb-2">✨ What problem does it solve?</h3>
                      <p className="text-green-700">{currentProduct.raw_analysis.problemSolved}</p>
                    </div>
                  )}
                  
                  {/* Core Features */}
                  {currentProduct.core_features && currentProduct.core_features.length > 0 && (
                    <div>
                      <h3 className="font-black text-lg mb-3">What&apos;s Included</h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {currentProduct.core_features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Content Tab */}
              {previewTab === 'content' && (
                <div className="space-y-6">
                  {currentProduct.raw_analysis?.outline ? (
                    <>
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-black">{currentProduct.raw_analysis.outline.title}</h3>
                        {currentProduct.raw_analysis.outline.subtitle && (
                          <p className="text-gray-600 mt-2">{currentProduct.raw_analysis.outline.subtitle}</p>
                        )}
                        <div className="flex justify-center gap-4 mt-4 text-sm text-gray-500">
                          {currentProduct.raw_analysis.outline.estimated_total_pages && (
                            <span>📄 {currentProduct.raw_analysis.outline.estimated_total_pages} pages</span>
                          )}
                          {currentProduct.raw_analysis.outline.estimated_word_count && (
                            <span>📝 {currentProduct.raw_analysis.outline.estimated_word_count.toLocaleString()} words</span>
                          )}
                          {currentProduct.raw_analysis.outline.chapters && (
                            <span>📚 {currentProduct.raw_analysis.outline.chapters.length} chapters</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Chapters List */}
                      <div className="space-y-4">
                        {currentProduct.raw_analysis.outline.chapters?.map((chapter) => (
                          <div key={chapter.id} className="bg-white border-2 border-gray-200 rounded-xl p-4">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 bg-uvz-orange text-white rounded-lg flex items-center justify-center font-black shrink-0">
                                {chapter.number}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-lg">{chapter.title}</h4>
                                <p className="text-gray-600 text-sm mt-1">{chapter.description}</p>
                                {chapter.keyPoints && chapter.keyPoints.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {chapter.keyPoints.map((point, i) => (
                                      <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                        • {point}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {chapter.estimatedPages && (
                                <span className="text-sm text-gray-400">{chapter.estimatedPages} pages</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Bonus Content */}
                      {currentProduct.raw_analysis.outline.bonus_content && currentProduct.raw_analysis.outline.bonus_content.length > 0 && (
                        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mt-6">
                          <h3 className="font-black text-purple-800 mb-4">🎁 Bonus Materials</h3>
                          <div className="grid md:grid-cols-2 gap-3">
                            {currentProduct.raw_analysis.outline.bonus_content.map((bonus, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                                <CheckCircle className="w-5 h-5 text-purple-500" />
                                <span className="font-medium">{bonus.title}</span>
                                <span className="text-xs text-gray-500 capitalize">({bonus.type})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="font-bold text-lg text-gray-600 mb-2">No Content Outline Yet</h3>
                      <p className="text-gray-500">Generate a content outline in the Content Plan step to see it here.</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Structure Tab */}
              {previewTab === 'structure' && (
                <div className="space-y-6">
                  {currentProduct.raw_analysis?.structure ? (
                    <>
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-black capitalize">
                          {currentProduct.raw_analysis.structure.product_structure?.type || currentProduct.product_type} Structure
                        </h3>
                        <div className="flex justify-center gap-4 mt-4 text-sm text-gray-500">
                          {currentProduct.raw_analysis.structure.product_structure?.total_modules && (
                            <span>📦 {currentProduct.raw_analysis.structure.product_structure.total_modules} modules</span>
                          )}
                          {currentProduct.raw_analysis.structure.product_structure?.estimated_completion_time && (
                            <span>⏱️ {currentProduct.raw_analysis.structure.product_structure.estimated_completion_time}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Parts/Modules */}
                      <div className="space-y-4">
                        {currentProduct.raw_analysis.structure.product_structure?.parts?.map((part) => (
                          <div key={part.id} className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-50 to-transparent p-4">
                              <h4 className="font-black text-lg">{part.title}</h4>
                              <p className="text-gray-600 text-sm">{part.description}</p>
                            </div>
                            <div className="p-4 space-y-3">
                              {part.modules?.map((module, i) => (
                                <div key={module.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                    {i + 1}
                                  </span>
                                  <div className="flex-1">
                                    <p className="font-medium">{module.title}</p>
                                    {module.duration_minutes && (
                                      <p className="text-xs text-gray-500">{module.duration_minutes} min</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Deliverables */}
                      {currentProduct.raw_analysis.structure.deliverables && currentProduct.raw_analysis.structure.deliverables.length > 0 && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                          <h3 className="font-black text-green-800 mb-4">📦 Deliverables</h3>
                          <div className="space-y-3">
                            {currentProduct.raw_analysis.structure.deliverables.map((d, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                                <Package className="w-5 h-5 text-green-500" />
                                <div>
                                  <p className="font-medium">{d.name}</p>
                                  <p className="text-xs text-gray-500">{d.format} • {d.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="font-bold text-lg text-gray-600 mb-2">No Structure Yet</h3>
                      <p className="text-gray-500">Generate a product structure in the Structure step to see it here.</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Assets Tab */}
              {previewTab === 'assets' && (
                <div className="space-y-6">
                  {assets.length > 0 ? (
                    <>
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-black">Product Assets</h3>
                        <p className="text-gray-600 mt-2">{assets.length} assets ready for your product</p>
                      </div>
                      
                      {/* Images Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {assets.filter(a => a.type === 'image').map((asset) => (
                          <div key={asset.id} className="group relative bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm hover:shadow-lg transition-all">
                            <div className="aspect-[4/3]">
                              {(asset.thumbnailUrl || asset.fullUrl || asset.url) ? (
                                <img 
                                  src={asset.fullUrl || asset.thumbnailUrl || asset.url} 
                                  alt={asset.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="%23f3f4f6" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14">Image Loading...</text></svg>';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                                  <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                                </div>
                              )}
                            </div>
                            <div className="p-3 bg-white">
                              <p className="font-bold text-sm truncate">{asset.name}</p>
                              {asset.prompt && (
                                <p className="text-xs text-gray-500 truncate mt-1" title={asset.prompt}>
                                  "{asset.prompt}"
                                </p>
                              )}
                              <span className={`text-xs font-medium ${
                                asset.status === 'uploaded' ? 'text-green-600' : 'text-purple-600'
                              }`}>
                                {asset.status === 'uploaded' ? '✓ Ready' : '🎨 AI Generated'}
                              </span>
                            </div>
                            {asset.fullUrl && (
                              <button
                                onClick={() => window.open(asset.fullUrl, '_blank')}
                                className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                              >
                                View Full Size
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Other Assets */}
                      {assets.filter(a => a.type !== 'image').length > 0 && (
                        <div>
                          <h4 className="font-bold mb-3">Other Files</h4>
                          <div className="space-y-2">
                            {assets.filter(a => a.type !== 'image').map((asset) => (
                              <div key={asset.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <FileText className="w-5 h-5 text-gray-400" />
                                <span className="flex-1">{asset.name}</span>
                                <span className="text-xs text-gray-500 capitalize">{asset.type}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="font-bold text-lg text-gray-600 mb-2">No Assets Yet</h3>
                      <p className="text-gray-500">Upload images and files in the Assets step to see them here.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  This is how your product will appear on the marketplace
                </p>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-6 py-2 bg-uvz-orange text-white font-bold border-2 border-black rounded-lg hover:bg-orange-500 transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
