'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import confetti from 'canvas-confetti';
import BuilderHeader from '@/components/builder/BuilderHeader';
import BuilderSidebar from '@/components/builder/BuilderSidebar';
import ProductTypeBuilder from '@/components/builder/ProductTypeBuilder';
import AIToolSelector from '@/components/builder/AIToolSelector';
import { PRODUCT_TYPES, ProductTypeConfig } from '@/lib/product-types';
import {
  generateComprehensiveSaaSPrompt, 
  createPromptConfigFromProduct,
  SAAS_TEMPLATES,
  PromptMode
} from '@/lib/prompt-generator';
import { 
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
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  GripVertical,
  X,
  Check,
  RefreshCw,
  Search,
  Archive,
  ArchiveRestore,
  Filter,
  Grid3X3,
  List,
  TrendingUp,
  BarChart3,
  Pencil,
  Wrench,
  Download,
  BookOpen
} from 'lucide-react';
import { ENABLE_PRICING } from '@/lib/config';
import Link from 'next/link';

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
  status: 'pending' | 'uploaded' | 'generating' | 'error' | 'saved';
  generatedPrompt?: string;
  category?: 'cover' | 'chapter' | 'illustration' | 'diagram' | 'icon' | 'uploaded';
  aspectRatio?: string;
  isSelected?: boolean;
  storagePath?: string;
  dbId?: string; // ID from database if saved
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
    overview?: string;
    targetAudience?: string;
    problemSolved?: string;
    skillsMatch?: string[];
    matchScore?: number;
    outline?: ContentOutline;
    structure?: ProductStructure;
    assets?: Asset[];
    generatedFeatures?: string[];
  };
  created_at: string;
  updated_at: string;
}

// Default steps for content-based products (ebook, course, etc.)
const CONTENT_PRODUCT_STEPS = [
  { id: 'overview', name: 'Overview', icon: Target },
  { id: 'content', name: 'Content Plan', icon: FileText },
  { id: 'structure', name: 'Structure', icon: Lightbulb },
  { id: 'assets', name: 'Assets', icon: Zap },
  { id: 'export', name: 'Export', icon: Rocket },
];

// Steps for software/SaaS products (includes assets for cover images)
const SOFTWARE_PRODUCT_STEPS = [
  { id: 'overview', name: 'Overview', icon: Target },
  { id: 'features', name: 'Features', icon: Lightbulb },
  { id: 'build', name: 'Build', icon: Wrench },
  { id: 'assets', name: 'Assets', icon: Zap },
  { id: 'export', name: 'Export', icon: Rocket },
];

// Get steps based on product type
const getProductSteps = (productType: string | undefined) => {
  const softwareTypes = ['saas', 'software-tool', 'mobile-app'];
  if (productType && softwareTypes.includes(productType)) {
    return SOFTWARE_PRODUCT_STEPS;
  }
  return CONTENT_PRODUCT_STEPS;
};

// Get product type config
const getProductTypeConfig = (productType: string | undefined): ProductTypeConfig | null => {
  if (!productType) return null;
  return PRODUCT_TYPES.find(pt => pt.id === productType) || null;
};

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
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [showProductMenu, setShowProductMenu] = useState<string | null>(null);
  
  // Unsaved changes tracking
  const [originalFormData, setOriginalFormData] = useState<{
    name: string;
    tagline: string;
    description: string;
    targetAudience: string;
    problemSolved: string;
    notes: string;
  } | null>(null);
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'close' | 'switch'; productId?: string } | null>(null);
  
  // Product list states (new redesign)
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isArchiving, setIsArchiving] = useState<string | null>(null);
  
  // Content generation states
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatingChapterId, setGeneratingChapterId] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());
  
  // Prompt mode state for software products
  const [promptMode, setPromptMode] = useState<PromptMode>('full-build');
  
  // Assets state
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const [assetGenerationPrompt, setAssetGenerationPrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageSuggestions, setImageSuggestions] = useState<ImageSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);
  const [isSavingAssets, setIsSavingAssets] = useState(false);
  const [savingAssetId, setSavingAssetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTab, setPreviewTab] = useState<'overview' | 'content' | 'structure' | 'assets'>('overview');
  const [productPrice, setProductPrice] = useState('');
  const [exportChecklist, setExportChecklist] = useState({
    contentComplete: false,
    structureComplete: false,
    assetsReady: false,
    // If pricing is disabled, treat pricing as already set so users can export
    pricingSet: !ENABLE_PRICING,
    previewReviewed: false,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'html' | 'pdf' | 'doc' | 'md'>('html');
  const [showFormatModal, setShowFormatModal] = useState(false);

  // Lazy-load heavy docx helper only on the client when needed
  const generateDocxBlob = async (product: any) => {
    const mod = await import('../../lib/export/docx');
    return mod.generateDocxBlob(product);
  };

  
  // Category state
  const [categories, setCategories] = useState<{id: string; name: string; slug: string; icon: string}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Notification modal state
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    details?: string[];
  }>({ show: false, type: 'info', title: '', message: '' });

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
  };
  
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

  // Computed values for product type
  const isSoftwareProduct = ['software-tool', 'mobile-app', 'saas'].includes(currentProduct?.product_type || '');

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load platform connections and handle OAuth callbacks
  useEffect(() => {
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

    // Check subscription (skip checks if pricing/upgrade disabled)
    if (!ENABLE_PRICING) {
      setIsPro(true);
    } else {
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
          const loadedFormData = {
            name: product.name || '',
            tagline: product.tagline || '',
            description: product.description || '',
            targetAudience: product.raw_analysis?.targetAudience || '',
            problemSolved: product.raw_analysis?.problemSolved || '',
            notes: product.notes || '',
          };
          setFormData(loadedFormData);
          setOriginalFormData(loadedFormData);
          // Set product price
          const loadedPrice = product.price_point || '';
          setProductPrice(loadedPrice);
          setOriginalPrice(loadedPrice);
          
          // Load saved assets for this product
          try {
            const assetsRes = await fetch(`/api/products/${productId}/assets`);
            if (assetsRes.ok) {
              const { assets: savedAssets } = await assetsRes.json();
              // Convert database assets to Asset interface
              const loadedAssets: Asset[] = (savedAssets || []).map((a: { id: string; name: string; type: string; url: string; thumbnail_url?: string; prompt?: string; category?: string; storage_path?: string }) => ({
                id: `saved-${a.id}`,
                dbId: a.id,
                name: a.name,
                type: a.type as Asset['type'],
                url: a.url,
                thumbnailUrl: a.thumbnail_url || a.url,
                fullUrl: a.url,
                prompt: a.prompt,
                status: 'saved' as const,
                category: a.category as Asset['category'],
                storagePath: a.storage_path,
              }));
              setAssets(loadedAssets);
            }
          } catch (e) {
            console.error('Failed to load assets:', e);
          }
        }
      } catch (e) {
        console.error('Failed to load product:', e);
      }
    } else {
      // Clear assets when no product selected
      setAssets([]);
    }

    setIsLoading(false);
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = (): boolean => {
    if (!originalFormData || !currentProduct) return false;
    
    return (
      formData.name !== originalFormData.name ||
      formData.tagline !== originalFormData.tagline ||
      formData.description !== originalFormData.description ||
      formData.targetAudience !== originalFormData.targetAudience ||
      formData.problemSolved !== originalFormData.problemSolved ||
      formData.notes !== originalFormData.notes ||
      productPrice !== originalPrice
    );
  };

  // Handle closing editor with unsaved changes check
  const handleCloseEditor = () => {
    if (hasUnsavedChanges()) {
      setPendingAction({ type: 'close' });
      setShowUnsavedChangesModal(true);
    } else {
      closeEditor();
    }
  };

  // Handle switching to another product with unsaved changes check
  const handleSwitchProduct = (productId: string) => {
    if (currentProduct?.id === productId) {
      // Clicking same product - toggle close
      handleCloseEditor();
    } else if (hasUnsavedChanges()) {
      // Switching to different product with unsaved changes
      setPendingAction({ type: 'switch', productId });
      setShowUnsavedChangesModal(true);
    } else {
      // No unsaved changes, just switch
      router.push(`/builder?product=${productId}`);
    }
  };

  // Close editor without saving
  const closeEditor = () => {
    setCurrentProduct(null);
    setOriginalFormData(null);
    setOriginalPrice('');
    setFormData({
      name: '',
      tagline: '',
      description: '',
      targetAudience: '',
      problemSolved: '',
      notes: '',
    });
    setProductPrice('');
    setAssets([]);
    router.push('/builder');
  };

  // Discard changes and proceed with pending action
  const handleDiscardChanges = () => {
    setShowUnsavedChangesModal(false);
    if (pendingAction?.type === 'close') {
      closeEditor();
    } else if (pendingAction?.type === 'switch' && pendingAction.productId) {
      router.push(`/builder?product=${pendingAction.productId}`);
    }
    setPendingAction(null);
  };

  // Save and proceed with pending action
  const handleSaveAndProceed = async () => {
    await handleSaveProduct();
    setShowUnsavedChangesModal(false);
    if (pendingAction?.type === 'close') {
      closeEditor();
    } else if (pendingAction?.type === 'switch' && pendingAction.productId) {
      router.push(`/builder?product=${pendingAction.productId}`);
    }
    setPendingAction(null);
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
      
      // Update original data to reflect saved state
      setOriginalFormData({ ...formData });
      setOriginalPrice(productPrice);
      
      // Update in list
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    } catch (error) {
      console.error('Save error:', error);
      showNotification('error', 'Save Failed', 'Failed to save product. Please try again.');
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
      showNotification('error', 'Delete Failed', 'Failed to delete product. Please try again.');
    }
  };

  const handleArchiveProduct = async (id: string, archive: boolean) => {
    setIsArchiving(id);
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: archive ? 'archived' : 'idea' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Archive API error:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to update');
      }
      
      // Update products list
      setProducts(prev => prev.map(p => 
        p.id === id ? { ...p, status: archive ? 'archived' : 'idea' } : p
      ));
      
      // If archiving current product, clear selection
      if (archive && currentProduct?.id === id) {
        setCurrentProduct(null);
        router.push('/builder');
      }
      
      showNotification('success', archive ? 'Product Archived' : 'Product Restored', 
        archive ? 'Product moved to archive.' : 'Product restored to active products.');
      setShowProductMenu(null);
    } catch (error) {
      console.error('Archive error:', error);
      showNotification('error', 'Update Failed', 'Failed to update product. Please try again.');
    } finally {
      setIsArchiving(null);
    }
  };

  // Filter products based on current tab, search, and filter
  const filteredProducts = products.filter(product => {
    // Tab filter
    const isArchived = product.status === 'archived';
    if (activeTab === 'active' && isArchived) return false;
    if (activeTab === 'archived' && !isArchived) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!product.name.toLowerCase().includes(query) && 
          !product.tagline?.toLowerCase().includes(query) &&
          !product.product_type?.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Type filter
    if (filterType !== 'all' && product.product_type !== filterType) {
      return false;
    }
    
    return true;
  });

  // Calculate stats
  const productStats = {
    total: products.length,
    active: products.filter(p => p.status !== 'archived').length,
    archived: products.filter(p => p.status === 'archived').length,
    launched: products.filter(p => p.status === 'completed').length,
  };

  // Get unique product types for filter
  const productTypes = [...new Set(products.map(p => p.product_type).filter(Boolean))];

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
      showNotification('error', 'Outline Generation Failed', error instanceof Error ? error.message : 'Failed to generate outline');
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
      showNotification('error', 'Structure Generation Failed', error instanceof Error ? error.message : 'Failed to generate structure');
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
      setExportChecklist(prev => ({ ...prev, contentComplete: true }));
      
      // Show success modal
      showNotification('success', 'Content Generated!', 'Your ebook content has been written successfully.', [
        `📝 ${data.stats.chaptersGenerated} chapters written`,
        `📊 ${data.stats.totalWordCount.toLocaleString()} total words`,
        `📖 ~${data.stats.estimatedPages} pages`
      ]);
    } catch (error) {
      console.error('Generate content error:', error);
      showNotification('error', 'Generation Failed', error instanceof Error ? error.message : 'Failed to generate content');
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
        setExportChecklist(prev => ({ ...prev, contentComplete: true }));
      }
    } catch (error) {
      console.error('Generate chapter content error:', error);
      showNotification('error', 'Chapter Generation Failed', error instanceof Error ? error.message : 'Failed to generate chapter content');
    } finally {
      setGeneratingChapterId(null);
    }
  };

  // Handle file upload for assets
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !currentProduct) return;
    
    setIsUploadingAsset(true);
    
    const uploadedAssets: Asset[] = [];
    
    for (const file of Array.from(files)) {
      const assetType = file.type.startsWith('image/') ? 'image' 
        : file.type.startsWith('video/') ? 'video'
        : file.type.startsWith('audio/') ? 'audio'
        : file.type.includes('pdf') || file.type.includes('document') ? 'document'
        : 'other';
      
      const tempId = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Add as pending first
      const pendingAsset: Asset = {
        id: tempId,
        name: file.name,
        type: assetType,
        file: file,
        status: 'pending',
      };
      setAssets(prev => [...prev, pendingAsset]);
      
      try {
        // Upload to Supabase via API
        const formData = new FormData();
        formData.append('file', file);
        formData.append('assetType', assetType);
        formData.append('name', file.name);
        
        const response = await fetch(`/api/products/${currentProduct.id}/assets`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload file');
        }
        
        const result = await response.json();
        
        // Update asset with saved status
        setAssets(prev => prev.map(a => 
          a.id === tempId 
            ? { 
                ...a, 
                status: 'saved' as const, 
                url: result.publicUrl,
                storagePath: result.storagePath,
                dbId: result.id
              }
            : a
        ));
        
        uploadedAssets.push({
          ...pendingAsset,
          status: 'saved',
          url: result.publicUrl,
          storagePath: result.storagePath,
          dbId: result.id
        });
      } catch (error) {
        console.error('Upload error:', error);
        // Mark as failed
        setAssets(prev => prev.map(a => 
          a.id === tempId 
            ? { ...a, status: 'uploaded' as const, url: URL.createObjectURL(file) }
            : a
        ));
      }
    }
    
    setIsUploadingAsset(false);
    
    if (uploadedAssets.length > 0) {
      showNotification('success', 'Upload Complete', `${uploadedAssets.length} file(s) uploaded and saved to your library`);
    }
    
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
      showNotification('error', 'Image Suggestions Failed', error instanceof Error ? error.message : 'Failed to get image suggestions');
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
    
    // Create a new asset - status is 'uploaded' meaning generated but not saved to storage yet
    const newAsset: Asset = {
      id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: suggestion.title,
      type: 'image',
      status: 'uploaded', // Generated but not saved to storage
      prompt: prompt,
      thumbnailUrl: thumbnailUrl,
      fullUrl: fullUrl,
      url: thumbnailUrl,
      category: suggestion.category,
      isSelected: false,
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
      status: 'uploaded', // Generated but not saved to storage
      prompt: prompt,
      thumbnailUrl: thumbnailUrl,
      fullUrl: fullUrl,
      url: thumbnailUrl,
      category: 'illustration',
      isSelected: false,
    };
    
    setAssets(prev => [...prev, newAsset]);
    setAssetGenerationPrompt('');
    setIsGeneratingImage(false);
  };

  // Toggle asset selection
  const toggleAssetSelection = (assetId: string) => {
    setAssets(prev => prev.map(a => 
      a.id === assetId ? { ...a, isSelected: !a.isSelected } : a
    ));
  };

  // Save a single asset to Supabase storage
  const handleSaveAssetToStorage = async (asset: Asset) => {
    if (!currentProduct || asset.status === 'saved') return;
    
    setSavingAssetId(asset.id);
    try {
      const response = await fetch(`/api/products/${currentProduct.id}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: asset.name,
          type: asset.type,
          category: asset.category,
          url: asset.url,
          thumbnailUrl: asset.thumbnailUrl,
          fullUrl: asset.fullUrl,
          prompt: asset.prompt,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save asset');
      }
      
      const { asset: savedAsset } = await response.json();
      
      // Update the asset in state to mark as saved
      setAssets(prev => prev.map(a => 
        a.id === asset.id ? {
          ...a,
          status: 'saved' as const,
          dbId: savedAsset.id,
          url: savedAsset.url,
          thumbnailUrl: savedAsset.thumbnail_url || savedAsset.url,
          fullUrl: savedAsset.url,
          storagePath: savedAsset.storage_path,
        } : a
      ));
      
      showNotification('success', 'Asset Saved', `"${asset.name}" has been saved to your library.`);
    } catch (error) {
      console.error('Save asset error:', error);
      showNotification('error', 'Save Failed', error instanceof Error ? error.message : 'Failed to save asset');
    } finally {
      setSavingAssetId(null);
    }
  };

  // Save all selected assets to storage
  const handleSaveSelectedAssets = async () => {
    const selectedAssets = assets.filter(a => a.isSelected && a.status !== 'saved');
    if (selectedAssets.length === 0) {
      showNotification('info', 'No Assets Selected', 'Please select assets to save to your library.');
      return;
    }
    
    setIsSavingAssets(true);
    let savedCount = 0;
    
    for (const asset of selectedAssets) {
      try {
        await handleSaveAssetToStorage(asset);
        savedCount++;
      } catch {
        // Error already shown in handleSaveAssetToStorage
      }
    }
    
    setIsSavingAssets(false);
    
    if (savedCount > 0) {
      showNotification('success', 'Assets Saved', `${savedCount} asset(s) saved to your library.`);
    }
    
    // Deselect all
    setAssets(prev => prev.map(a => ({ ...a, isSelected: false })));
  };

  // Delete asset
  const handleDeleteAsset = async (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    
    // If it's saved in storage, delete from API
    if (asset?.dbId && currentProduct) {
      try {
        const response = await fetch(`/api/products/${currentProduct.id}/assets?assetId=${asset.dbId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete from storage');
        }
      } catch (error) {
        console.error('Delete asset error:', error);
        showNotification('error', 'Delete Failed', 'Failed to delete asset from storage.');
        return;
      }
    }
    
    setAssets(prev => prev.filter(a => a.id !== assetId));
  };

  // Generate HTML content for the ebook/product
  const generateProductHTML = () => {
    if (!currentProduct) return '';
    
    const outline = currentProduct.raw_analysis?.outline;
    const productAssets = assets.filter(a => a.category === 'cover' || a.category === 'illustration' || a.category === 'chapter');
    
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${currentProduct.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', serif; line-height: 1.8; color: #333; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .cover { text-align: center; page-break-after: always; padding: 100px 20px; background: linear-gradient(135deg, #ff6b35 0%, #f7c331 100%); color: white; margin: -40px -20px 40px; }
    .cover h1 { font-size: 3em; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
    .cover .tagline { font-size: 1.4em; opacity: 0.9; margin-bottom: 30px; }
    .cover .author { font-size: 1.1em; opacity: 0.8; }
    .toc { page-break-after: always; padding: 40px 0; }
    .toc h2 { font-size: 2em; margin-bottom: 30px; border-bottom: 3px solid #ff6b35; padding-bottom: 10px; }
    .toc-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dotted #ddd; }
    .toc-item:hover { background: #f9f9f9; }
    .chapter { page-break-before: always; padding: 40px 0; }
    .chapter-header { background: linear-gradient(135deg, #ff6b35 0%, #f7c331 100%); color: white; padding: 30px; margin: -40px -20px 30px; }
    .chapter-number { font-size: 0.9em; text-transform: uppercase; letter-spacing: 3px; opacity: 0.8; }
    .chapter-title { font-size: 2.2em; margin-top: 10px; }
    .chapter-content { font-size: 1.1em; }
    .chapter-content h2 { font-size: 1.6em; color: #ff6b35; margin: 30px 0 15px; }
    .chapter-content h3 { font-size: 1.3em; color: #333; margin: 25px 0 12px; }
    .chapter-content p { margin-bottom: 18px; text-align: justify; }
    .chapter-content ul, .chapter-content ol { margin: 15px 0 15px 30px; }
    .chapter-content li { margin-bottom: 8px; }
    .chapter-content strong { color: #ff6b35; }
    .key-takeaways { background: #f0f7ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0; }
    .key-takeaways h4 { color: #1e40af; margin-bottom: 15px; }
    .key-takeaways ul { margin-left: 20px; }
    .key-takeaways li { color: #1e40af; margin-bottom: 8px; }
    .bonus-section { background: #faf5ff; border: 2px solid #a855f7; padding: 30px; margin: 40px 0; border-radius: 12px; }
    .bonus-section h3 { color: #7c3aed; margin-bottom: 20px; }
    .asset-image { max-width: 100%; height: auto; margin: 20px 0; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .footer { text-align: center; padding: 40px 0; margin-top: 60px; border-top: 2px solid #eee; color: #666; }
    @media print {
      .chapter { page-break-before: always; }
      .cover { page-break-after: always; }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover">
    <h1>${currentProduct.name}</h1>
    <p class="tagline">${currentProduct.tagline || ''}</p>
    <p class="author">Created with ManyMarkets</p>
  </div>
`;

    // Table of Contents
    if (outline?.chapters && outline.chapters.length > 0) {
      html += `
  <div class="toc">
    <h2>Table of Contents</h2>
`;
      outline.chapters.forEach((chapter: Chapter) => {
        html += `    <div class="toc-item"><span>Chapter ${chapter.number}: ${chapter.title}</span></div>\n`;
      });
      html += `  </div>\n`;
    }

    // Chapters
    if (outline?.chapters) {
      outline.chapters.forEach((chapter: Chapter) => {
        html += `
  <div class="chapter">
    <div class="chapter-header">
      <div class="chapter-number">Chapter ${chapter.number}</div>
      <h1 class="chapter-title">${chapter.title}</h1>
    </div>
    <div class="chapter-content">
`;
        if (chapter.content) {
          // Convert markdown-style content to HTML
          let content = chapter.content
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/^- (.*$)/gim, '<li>$1</li>')
            .replace(/\n\n/g, '</p><p>');
          
          // Wrap loose li tags in ul
          content = content.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
          
          html += `      <p>${content}</p>\n`;
        } else {
          html += `      <p><em>${chapter.description || 'Content not yet generated.'}</em></p>\n`;
        }

        // Key Takeaways
        if (chapter.keyTakeaways && chapter.keyTakeaways.length > 0) {
          html += `
      <div class="key-takeaways">
        <h4>💡 Key Takeaways</h4>
        <ul>
`;
          chapter.keyTakeaways.forEach((takeaway: string) => {
            html += `          <li>${takeaway}</li>\n`;
          });
          html += `        </ul>\n      </div>\n`;
        }

        html += `    </div>\n  </div>\n`;
      });
    }

    // Bonus Content
    if (outline?.bonus_content && outline.bonus_content.length > 0) {
      html += `
  <div class="bonus-section">
    <h3>🎁 Bonus Materials</h3>
    <ul>
`;
      outline.bonus_content.forEach((bonus: BonusContent) => {
        html += `      <li><strong>${bonus.title}</strong> - ${bonus.type}</li>\n`;
      });
      html += `    </ul>\n  </div>\n`;
    }

    // Footer
    html += `
  <div class="footer">
    <p>Thank you for reading!</p>
    <p>Created with ❤️ using ManyMarkets</p>
  </div>
</body>
</html>`;

    return html;
  };

  // Handle download product
  const handleDownloadProduct = async (confirmed: boolean = false) => {
    if (!currentProduct) return;
    
    setIsExporting(true);
    
    // If not explicitly confirmed (from modal or quick-download), open the format modal instead
    if (!confirmed && !showFormatModal) {
      setShowFormatModal(true);
      setIsExporting(false);
      return;
    }
    // Track whether the download step succeeded so catch block can adjust messaging
    let downloadSucceeded = false;
    try {

      if (exportFormat === 'html') {
        // Generate the HTML content
        const htmlContent = generateProductHTML();

        // Create blob and download
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentProduct.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        downloadSucceeded = true;
      } else if (exportFormat === 'md') {
        // Generate simple Markdown version
        const md = generateProductMarkdown();
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentProduct.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        downloadSucceeded = true;
      } else if (exportFormat === 'doc') {
        // Export as real .docx using the docx helper
        try {
          const blob = await generateDocxBlob(currentProduct);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${currentProduct.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          downloadSucceeded = true;
        } catch (err) {
          console.error('DOCX generation error', err);
          throw err;
        }
      } else if (exportFormat === 'pdf') {
        // Open a print dialog for PDF creation
        const htmlContent = generateProductHTML();
        const url = URL.createObjectURL(new Blob([htmlContent], { type: 'text/html' }));
        const w = window.open(url, '_blank');
        if (w) {
          // Attempt to print after load
          w.addEventListener('load', () => {
            try { w.print(); } catch (e) { /* ignore */ }
          });
          // Revoke temporary URL after a short delay
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          downloadSucceeded = true;
        } else {
          throw new Error('Popup blocked');
        }
      }
      
      // Finalize download: show notifications and mark product completed (non-fatal)
      try {
        const mod = await import('../../lib/export/finalizeDownload');
        await mod.finalizeDownload(downloadSucceeded, supabase, currentProduct.id, showNotification as any);
      } catch (err) {
        console.warn('Failed during finalizeDownload:', err);
      }
      
      // Update local state
      const updatedProduct = { ...currentProduct, status: 'completed' };
      setCurrentProduct(updatedProduct);
      setProducts(prev => prev.map(p => p.id === currentProduct.id ? updatedProduct : p));
      
      // Show celebration with confetti
      setShowCelebration(true);
      
      // Trigger confetti
      const duration = 4000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ff6b35', '#f7c331', '#4ade80', '#3b82f6', '#a855f7'],
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ff6b35', '#f7c331', '#4ade80', '#3b82f6', '#a855f7'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
      
    } catch (error) {
      console.error('Download error:', error);
      if (typeof downloadSucceeded !== 'undefined' && downloadSucceeded) {
        // If the file already downloaded, show a less severe warning
        showNotification('warning', 'Downloaded', 'Downloaded successfully, but an error occurred after the download.');
      } else {
        showNotification('error', 'Download Failed', 'Failed to download product. Please try again.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Generate a simple Markdown version of the product
  const generateProductMarkdown = () => {
    if (!currentProduct) return '';
    let md = `# ${currentProduct.name}\n\n`;
    if (currentProduct.raw_analysis?.overview) {
      md += `## Overview\n\n${currentProduct.raw_analysis.overview}\n\n`;
    }
    const chapters = currentProduct.raw_analysis?.outline?.chapters || [];
    chapters.forEach((ch: any, i: number) => {
      md += `## ${i + 1}. ${ch.title}\n\n`;
      if (ch.content) md += `${ch.content}\n\n`;
      if (ch.parts) {
        ch.parts.forEach((p: any, j: number) => {
          md += `### ${i + 1}.${j + 1} ${p.title}\n\n`;
          if (p.content) md += `${p.content}\n\n`;
        });
      }
    });
    return md;
  };

  // Handle finalize/export product
  const handleExportProduct = async () => {
    if (!currentProduct) return;
    
    setIsExporting(true);
    
    try {
      // Mark product as completed
      const { error } = await supabase
        .from('product_ideas')
        .update({ status: 'completed' })
        .eq('id', currentProduct.id);
      
      if (error) throw error;
      
      // Update local state
      const updatedProduct = { ...currentProduct, status: 'completed' };
      setCurrentProduct(updatedProduct);
      setProducts(prev => prev.map(p => p.id === currentProduct.id ? updatedProduct : p));
      
      setShowExportModal(false);
      
      // Show celebration
      setShowCelebration(true);
      
      // Trigger confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ff6b35', '#f7c331', '#4ade80', '#3b82f6', '#a855f7'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ff6b35', '#f7c331', '#4ade80', '#3b82f6', '#a855f7'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
      
      // Auto-hide celebration after 5 seconds
      setTimeout(() => setShowCelebration(false), 5000);
      
      showNotification('success', 'Product Complete!', 'Your product is ready to sell! Export your content and assets to your preferred platform.');
    } catch (error) {
      console.error('Export error:', error);
      showNotification('error', 'Export Failed', 'Failed to finalize product. Please try again.');
    } finally {
      setIsExporting(false);
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
    return Object.values(exportChecklist).every(Boolean);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
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
      <BuilderHeader
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        currentUser={currentUser}
        profileMenuOpen={profileMenuOpen}
        setProfileMenuOpen={setProfileMenuOpen}
        setIsLogoutOpen={setIsLogoutOpen}
      />

      {/* Sidebar */}
      <BuilderSidebar
        isOpen={isSidebarOpen}
        isMobile={isMobile}
        onClose={() => setIsSidebarOpen(false)}
        isLogoutOpen={isLogoutOpen}
        setIsLogoutOpen={setIsLogoutOpen}
        handleLogout={handleLogout}
        products={products}
        currentProductId={currentProduct?.id}
        onSelectProduct={(id) => router.push(`/builder?product=${id}`)}
        onCreateProduct={() => router.push('/builder/create')}
        productStats={productStats}
      />

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 ${isSidebarOpen && !isMobile ? 'ml-72' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black">Product Builder</h1>
                <p className="text-gray-600 text-sm">Build and manage your digital products</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/builder/create"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-uvz-orange text-white font-bold border-2 border-black rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Create Product
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-black font-bold border-2 border-black rounded-xl hover:bg-gray-50 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Research
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-white border-2 border-black rounded-xl p-3 md:p-4 shadow-brutal">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-black rounded-lg flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-black">{productStats.total}</p>
                  <p className="text-xs md:text-sm text-gray-600">Total Products</p>
                </div>
              </div>
            </div>
            <div className="bg-white border-2 border-black rounded-xl p-3 md:p-4 shadow-brutal">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-green-600 border-2 border-black rounded-lg flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-black">{productStats.active}</p>
                  <p className="text-xs md:text-sm text-gray-600">Active</p>
                </div>
              </div>
            </div>
            <div className="bg-white border-2 border-black rounded-xl p-3 md:p-4 shadow-brutal">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-black rounded-lg flex items-center justify-center shrink-0">
                  <Rocket className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-black">{productStats.launched}</p>
                  <p className="text-xs md:text-sm text-gray-600">Complete</p>
                </div>
              </div>
            </div>
            <div className="bg-white border-2 border-black rounded-xl p-3 md:p-4 shadow-brutal">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-black rounded-lg flex items-center justify-center shrink-0">
                  <Archive className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-black">{productStats.archived}</p>
                  <p className="text-xs md:text-sm text-gray-600">Archived</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-1 gap-6">
            {/* Products Panel */}
            <div className="w-full">
              <div className="bg-white border-2 border-black rounded-xl shadow-brutal overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b-2 border-black">
                  <button
                    onClick={() => setActiveTab('active')}
                    className={`flex-1 px-4 py-3 font-bold text-sm transition-colors ${
                      activeTab === 'active' 
                        ? 'bg-uvz-orange text-white' 
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Active Products ({productStats.active})
                  </button>
                  <button
                    onClick={() => setActiveTab('archived')}
                    className={`flex-1 px-4 py-3 font-bold text-sm transition-colors border-l-2 border-black ${
                      activeTab === 'archived' 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Archive className="w-4 h-4 inline mr-1" />
                    Archived ({productStats.archived})
                  </button>
                </div>

                {/* Search & Filters */}
                <div className="p-3 border-b-2 border-black bg-gray-50">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-uvz-orange"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 text-sm border-2 border-black rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-uvz-orange"
                      >
                        <option value="all">All Types</option>
                        {productTypes.map(type => (
                          <option key={type} value={type} className="capitalize">
                            {type?.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                      <div className="flex border-2 border-black rounded-lg overflow-hidden">
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 ${viewMode === 'list' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                        >
                          <List className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 border-l-2 border-black ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                        >
                          <Grid3X3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products List/Grid */}
                <div className="p-4 max-h-[600px] overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      {activeTab === 'archived' ? (
                        <>
                          <p className="font-bold text-gray-600">No archived products</p>
                          <p className="text-sm text-gray-400 mt-1">Products you archive will appear here</p>
                        </>
                      ) : searchQuery || filterType !== 'all' ? (
                        <>
                          <p className="font-bold text-gray-600">No products found</p>
                          <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-gray-600">No products yet</p>
                          <p className="text-sm text-gray-400 mt-1">Complete research to get product suggestions</p>
                          <Link
                            href="/chat"
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-uvz-orange text-white font-bold text-sm border-2 border-black rounded-lg hover:bg-orange-500 transition-colors"
                          >
                            <Sparkles className="w-4 h-4" />
                            Start Research
                          </Link>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3'}>
                      {filteredProducts.map(product => {
                        const Icon = getProductIcon(product.product_type);
                        const isActive = currentProduct?.id === product.id;
                        const isArchived = product.status === 'archived';
                        
                        return (
                          <div
                            key={product.id}
                            className={`relative group rounded-xl border-2 transition-all ${
                              isActive 
                                ? 'border-uvz-orange bg-orange-50 shadow-brutal-sm' 
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            } ${viewMode === 'grid' ? 'p-4 sm:p-5' : ''}`}
                          >
                            <button
                              onClick={() => {
                                if (!isArchived) {
                                  handleSwitchProduct(product.id);
                                }
                              }}
                              disabled={isArchived}
                              className={`w-full text-left ${viewMode === 'list' ? 'p-3 sm:p-4 pr-20 sm:pr-24' : ''} ${isArchived ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                              <div className={`flex items-start gap-3 ${viewMode === 'grid' ? 'flex-col items-center text-center' : ''}`}>
                                <div className={`${viewMode === 'grid' ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-10 h-10 sm:w-12 sm:h-12'} rounded-xl flex items-center justify-center shrink-0 ${
                                  isActive ? 'bg-uvz-orange text-white' : isArchived ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  <Icon className={viewMode === 'grid' ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-5 h-5 sm:w-6 sm:h-6'} />
                                </div>
                                <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? 'w-full' : ''}`}>
                                  <p className={`font-bold text-sm sm:text-base leading-tight ${viewMode === 'grid' ? 'break-words whitespace-normal' : 'break-words'}`}>{product.name}</p>
                                  {viewMode === 'list' && product.tagline && (
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 break-words">{product.tagline}</p>
                                  )}
                                  <div className={`flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 flex-wrap ${viewMode === 'grid' ? 'justify-center' : ''}`}>
                                    <span className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded-full capitalize ${
                                      product.status === 'launched' 
                                        ? 'bg-green-100 text-green-700' 
                                        : product.status === 'building'
                                          ? 'bg-blue-100 text-blue-700'
                                          : product.status === 'archived'
                                            ? 'bg-gray-200 text-gray-600'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {product.status}
                                    </span>
                                    <span className="text-[10px] sm:text-xs text-gray-400 capitalize">
                                      {product.product_type?.replace('_', ' ')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </button>
                            
                            {/* Action Buttons - Always visible on mobile, hover on desktop */}
                            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                              {!isArchived && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSwitchProduct(product.id);
                                  }}
                                  className={`relative p-1.5 rounded-lg border transition-all group/btn shadow-sm ${
                                    currentProduct?.id === product.id
                                      ? 'bg-blue-100 text-blue-700 border-blue-400'
                                      : 'bg-white hover:bg-blue-50 text-blue-600 border-gray-200 hover:border-blue-300'
                                  }`}
                                  title={currentProduct?.id === product.id ? "Close Editor" : "Edit"}
                                >
                                  {currentProduct?.id === product.id ? (
                                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  ) : (
                                    <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  )}
                                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs font-bold rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden sm:block">
                                    {currentProduct?.id === product.id ? 'Close' : 'Edit'}
                                  </span>
                                </button>
                              )}
                              {isArchived ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchiveProduct(product.id, false);
                                  }}
                                  disabled={isArchiving === product.id}
                                  className="relative p-1.5 rounded-lg bg-white hover:bg-green-50 text-green-600 border border-gray-200 hover:border-green-300 transition-all disabled:opacity-50 group/btn shadow-sm"
                                  title="Restore"
                                >
                                  {isArchiving === product.id ? (
                                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                                  ) : (
                                    <ArchiveRestore className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  )}
                                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs font-bold rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden sm:block">
                                    Restore
                                  </span>
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchiveProduct(product.id, true);
                                  }}
                                  disabled={isArchiving === product.id}
                                  className="relative p-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-500 border border-gray-200 hover:border-gray-300 transition-all disabled:opacity-50 group/btn shadow-sm"
                                  title="Archive"
                                >
                                  {isArchiving === product.id ? (
                                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                                  ) : (
                                    <Archive className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  )}
                                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs font-bold rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden sm:block">
                                    Archive
                                  </span>
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProductToDelete(product.id);
                                  setShowDeleteModal(true);
                                }}
                                className="relative p-1.5 rounded-lg bg-white hover:bg-red-50 text-red-500 border border-gray-200 hover:border-red-300 transition-all group/btn shadow-sm"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs font-bold rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden sm:block">
                                  Delete
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Builder Area - Only shows when product selected */}
          {currentProduct && (
            <div className="mt-6">
                  {/* Header */}
                  <div className="bg-white border-2 sm:border-4 border-black rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-brutal mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-uvz-orange to-orange-400 border-2 border-black rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                          <ProductIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h1 className="text-lg sm:text-2xl font-black mb-1 break-words">{currentProduct.name}</h1>
                          <p className="text-sm sm:text-base text-gray-600 capitalize">
                            {currentProduct.product_type?.replace('_', ' ') || 'Digital Product'}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
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
                        className="w-full sm:w-auto px-4 py-2 bg-uvz-orange text-white font-bold border-2 border-black rounded-lg hover:bg-orange-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
                  <div className="bg-white border-2 border-black rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 overflow-x-auto">
                    <div className="flex items-center justify-between min-w-max sm:min-w-0">
                      {getProductSteps(currentProduct?.product_type).map((step, index) => {
                        const StepIcon = step.icon;
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep;
                        
                        return (
                          <div key={step.id} className="flex items-center">
                            <button
                              onClick={() => setCurrentStep(index)}
                              className={`flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl transition-all ${
                                isActive 
                                  ? 'bg-uvz-orange text-white' 
                                  : isCompleted 
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                              ) : (
                                <StepIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                              )}
                              <span className="text-[10px] sm:text-xs font-bold">{step.name}</span>
                            </button>
                            {index < getProductSteps(currentProduct?.product_type).length - 1 && (
                              <div className={`w-4 sm:w-8 h-1 mx-1 sm:mx-2 rounded shrink-0 ${
                                index < currentStep ? 'bg-green-400' : 'bg-gray-200'
                              }`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 md:p-8 shadow-brutal">
                    {currentStep === 0 && (
                      <div>
                        <h2 className="text-lg sm:text-xl font-black mb-3 sm:mb-4">Product Overview</h2>
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
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-bold text-gray-700 flex items-center gap-1">
                                Target Audience
                                <Sparkles className="w-4 h-4 text-yellow-500" />
                              </label>
                              <button
                                type="button"
                                className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-yellow-700 bg-yellow-100 border border-yellow-300 rounded hover:bg-yellow-200 transition-colors"
                                onClick={async () => {
                                  setIsGeneratingOutline(true);
                                  try {
                                    const response = await fetch('/api/builder/generate', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        taskId: 'targetAudience',
                                        prompt: 'Suggest a target audience for this product based on its name, tagline, and description.',
                                        context: {
                                          name: formData.name,
                                          tagline: formData.tagline,
                                          description: formData.description,
                                        },
                                        productType: currentProduct?.product_type || '',
                                      }),
                                    });
                                    if (response.ok) {
                                      const { content } = await response.json();
                                      let processed = (content || '').trim();
                                      // Ensure response is in first-person. If not, prefix appropriately.
                                      if (!/^(my|i|this)/i.test(processed)) {
                                        processed = `My target audience is ${processed.replace(/^\s*/,'')}`;
                                      }
                                      setFormData(prev => ({ ...prev, targetAudience: processed }));
                                      showNotification('success', 'AI Filled', 'Target audience has been filled using AI.');
                                    } else {
                                      const err = await response.json().catch(() => ({}));
                                      showNotification('error', 'AI Fill Failed', err.error || 'Failed to generate target audience.');
                                    }
                                  } catch (err) {
                                    console.error('AI Fill error:', err);
                                    showNotification('error', 'AI Fill Failed', 'Failed to generate target audience. Please try again.');
                                  } finally {
                                    setIsGeneratingOutline(false);
                                  }
                                }}
                                disabled={isGeneratingOutline}
                              >
                                <Sparkles className="w-3 h-3" />
                                {isGeneratingOutline ? 'Filling...' : 'AI Fill'}
                              </button>
                            </div>
                            <textarea
                              value={formData.targetAudience}
                              onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                              placeholder="Who is this product for?"
                              rows={3}
                              className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-uvz-orange resize-none"
                            />
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-bold text-gray-700 flex items-center gap-1">
                                Problem Solved
                                <Sparkles className="w-4 h-4 text-yellow-500" />
                              </label>
                              <button
                                type="button"
                                className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-yellow-700 bg-yellow-100 border border-yellow-300 rounded hover:bg-yellow-200 transition-colors"
                                onClick={async () => {
                                  setIsGeneratingOutline(true);
                                  try {
                                    const response = await fetch('/api/builder/generate', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        taskId: 'problemSolved',
                                        prompt: 'Suggest the main problem this product solves based on its name, tagline, and description.',
                                        context: {
                                          name: formData.name,
                                          tagline: formData.tagline,
                                          description: formData.description,
                                        },
                                        productType: currentProduct?.product_type || '',
                                      }),
                                    });
                                    if (response.ok) {
                                      const { content } = await response.json();
                                      let processed = (content || '').trim();
                                      // Ensure first-person phrasing that describes the problem the product solves
                                      if (!/^(this product|my product|my|i|it)/i.test(processed)) {
                                        processed = `This product solves ${processed.replace(/^\s*/,'')}`;
                                      }
                                      setFormData(prev => ({ ...prev, problemSolved: processed }));
                                      showNotification('success', 'AI Filled', 'Problem statement has been filled using AI.');
                                    } else {
                                      const err = await response.json().catch(() => ({}));
                                      showNotification('error', 'AI Fill Failed', err.error || 'Failed to generate problem statement.');
                                    }
                                  } catch (err) {
                                    console.error('AI Fill error:', err);
                                    showNotification('error', 'AI Fill Failed', 'Failed to generate problem statement. Please try again.');
                                  } finally {
                                    setIsGeneratingOutline(false);
                                  }
                                }}
                                disabled={isGeneratingOutline}
                              >
                                <Sparkles className="w-3 h-3" />
                                {isGeneratingOutline ? 'Filling...' : 'AI Fill'}
                              </button>
                            </div>
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

                    {/* Step 1: Content Plan (for content products) or Features (for software) */}
                    {currentStep === 1 && !['saas', 'software-tool', 'mobile-app'].includes(currentProduct.product_type || '') && (
                      <div>
                        <h2 className="text-xl font-black mb-4">Content Plan</h2>
                        <p className="text-gray-600 mb-6">
                          Outline the content structure for your {currentProduct.product_type || 'product'}.
                        </p>
                        
                        {/* AI Content Generation */}
                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                          <div className="flex items-center gap-2 text-yellow-800 font-bold mb-2">
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-sm sm:text-base">AI Content Assistant</span>
                          </div>
                          <p className="text-xs sm:text-sm text-yellow-700 mb-3">
                            Let AI help generate content structure based on your research.
                          </p>
                          <button 
                            onClick={handleGenerateOutline}
                            disabled={isGeneratingOutline}
                            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-yellow-400 text-black font-bold text-sm border-2 border-black rounded-lg hover:bg-yellow-500 transition-colors flex items-center justify-center sm:justify-start gap-2 disabled:opacity-50"
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
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-3 sm:p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                                <div className="flex-1">
                                  <h4 className="font-bold text-green-800 flex items-center gap-2 text-sm sm:text-base">
                                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                                    Write Full Content
                                  </h4>
                                  <p className="text-xs sm:text-sm text-green-700 mt-1">
                                    Generate content for all {currentProduct.raw_analysis.outline.chapters?.length || 0} chapters
                                  </p>
                                  {/* Content Progress */}
                                  {currentProduct.raw_analysis.outline.chapters && (
                                    <div className="mt-2 flex items-center gap-2">
                                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[200px] sm:max-w-xs">
                                        <div 
                                          className="h-full bg-green-500 transition-all duration-300"
                                          style={{ 
                                            width: `${(currentProduct.raw_analysis.outline.chapters.filter((ch: Chapter) => ch.content).length / currentProduct.raw_analysis.outline.chapters.length) * 100}%` 
                                          }}
                                        />
                                      </div>
                                      <span className="text-xs text-green-700 font-bold whitespace-nowrap">
                                        {currentProduct.raw_analysis.outline.chapters.filter((ch: Chapter) => ch.content).length}/{currentProduct.raw_analysis.outline.chapters.length} written
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={handleGenerateAllContent}
                                  disabled={isGeneratingContent}
                                  className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-500 text-white font-bold text-sm border-2 border-black rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                  {isGeneratingContent ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Writing...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-4 h-4" />
                                      Write All
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                            
                            <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-6">
                              {currentProduct.raw_analysis.outline.chapters?.map((chapter: Chapter) => (
                                <div key={chapter.id} className={`border-2 rounded-xl overflow-hidden ${chapter.content ? 'border-green-300 bg-green-50/30' : 'border-gray-200'}`}>
                                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                                    <div 
                                      onClick={() => toggleChapter(chapter.id)}
                                      className="flex-1 flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0"
                                    >
                                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 ${chapter.content ? 'bg-green-500 text-white' : 'bg-uvz-orange text-white'}`}>
                                        {chapter.content ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : chapter.number}
                                      </div>
                                      <div className="flex-1 text-left min-w-0">
                                        <p className="font-bold text-sm sm:text-base break-words">{chapter.title}</p>
                                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5">
                                          {chapter.wordCount ? (
                                            <span className="text-[10px] sm:text-xs text-green-600 font-medium">✓ {chapter.wordCount.toLocaleString()} words</span>
                                          ) : chapter.estimatedPages ? (
                                            <span className="text-[10px] sm:text-xs text-gray-500">~{chapter.estimatedPages} pages</span>
                                          ) : null}
                                          {chapter.readingTimeMinutes && (
                                            <span className="text-[10px] sm:text-xs text-gray-500">• {chapter.readingTimeMinutes} min</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {!chapter.content && (
                                      <button
                                        onClick={() => handleGenerateChapterContent(chapter)}
                                        disabled={generatingChapterId === chapter.id}
                                        className="px-2 sm:px-3 py-1 sm:py-1.5 bg-green-100 text-green-700 text-xs sm:text-sm font-bold rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1 shrink-0"
                                      >
                                        {generatingChapterId === chapter.id ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <Sparkles className="w-3 h-3" />
                                        )}
                                        <span className="hidden sm:inline">Write</span>
                                      </button>
                                    )}
                                    <div 
                                      onClick={() => toggleChapter(chapter.id)}
                                      className="cursor-pointer p-1 shrink-0"
                                    >
                                      {expandedChapters.has(chapter.id) ? (
                                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                      )}
                                    </div>
                                  </div>
                                  
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
                                          
                                          {/* Chapter Assets Section */}
                                          <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                            <div className="flex items-center justify-between mb-2">
                                              <h5 className="font-bold text-sm text-purple-800 flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4" />
                                                Chapter Assets
                                              </h5>
                                              <button
                                                onClick={() => {
                                                  const prompt = `Professional illustration for ebook chapter: "${chapter.title}" - ${chapter.description?.slice(0, 100) || 'Key concepts and visuals'}. Style: Clean, modern, educational`;
                                                  setAssetGenerationPrompt(prompt);
                                                  const thumbnailUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=400&height=300&nologo=true`;
                                                  const fullUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=768&nologo=true`;
                                                  const newAsset: Asset = {
                                                    id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                                    name: `${chapter.title} - Illustration`,
                                                    type: 'image',
                                                    status: 'uploaded',
                                                    prompt: prompt,
                                                    thumbnailUrl: thumbnailUrl,
                                                    fullUrl: fullUrl,
                                                    url: thumbnailUrl,
                                                    category: 'chapter',
                                                    isSelected: false,
                                                  };
                                                  setAssets(prev => [...prev, newAsset]);
                                                }}
                                                className="text-xs px-2 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1"
                                              >
                                                <Sparkles className="w-3 h-3" />
                                                Generate Image
                                              </button>
                                            </div>
                                            
                                            {/* Display chapter-specific assets */}
                                            {assets.filter(a => a.category === 'chapter' && a.name?.includes(chapter.title)).length > 0 ? (
                                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                                                {assets.filter(a => a.category === 'chapter' && a.name?.includes(chapter.title)).map((asset) => (
                                                  <div key={asset.id} className="relative group rounded-lg overflow-hidden border border-purple-200">
                                                    <img 
                                                      src={asset.thumbnailUrl || asset.url} 
                                                      alt={asset.name}
                                                      className="w-full h-20 object-cover"
                                                    />
                                                    <button
                                                      onClick={() => handleDeleteAsset(asset.id)}
                                                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                      <X className="w-3 h-3" />
                                                    </button>
                                                    {asset.status !== 'saved' && (
                                                      <button
                                                        onClick={() => handleSaveAssetToStorage(asset)}
                                                        className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                      >
                                                        Save
                                                      </button>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-xs text-purple-600">No assets for this chapter yet. Click "Generate Image" to create one.</p>
                                            )}
                                          </div>
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

                    {/* Step 1: Features (for software products) */}
                    {currentStep === 1 && ['saas', 'software-tool', 'mobile-app'].includes(currentProduct.product_type || '') && (
                      <div>
                        <h2 className="text-xl font-black mb-4">Features & Requirements</h2>
                        <p className="text-gray-600 mb-6">
                          Define the core features and requirements for your {currentProduct.product_type?.replace('-', ' ') || 'software'}.
                        </p>
                        
                        {/* AI Features Generation */}
                        <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-4 mb-6">
                          <div className="flex items-center gap-2 text-purple-800 font-bold mb-2">
                            <Sparkles className="w-5 h-5" />
                            AI Feature Planner
                          </div>
                          <p className="text-sm text-purple-700 mb-3">
                            Let AI help you plan features based on your product description and target audience.
                          </p>
                          <button 
                            onClick={async () => {
                              setIsGeneratingOutline(true);
                              try {
                                const response = await fetch('/api/builder/generate', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    taskId: 'features',
                                    prompt: 'Generate a list of 5-7 core MVP features for this software product. Format as a simple numbered list.',
                                    context: {
                                      name: formData.name,
                                      tagline: formData.tagline,
                                      description: formData.description,
                                      targetAudience: formData.targetAudience,
                                      problemSolved: formData.problemSolved,
                                    },
                                    productType: currentProduct?.product_type || 'saas',
                                  }),
                                });
                                if (response.ok) {
                                  const { content } = await response.json();
                                  // Parse features from the response
                                  const features = content.split('\n').filter((line: string) => line.trim()).slice(0, 7);
                                  // Update raw_analysis with features
                                  const updatedAnalysis = {
                                    ...currentProduct.raw_analysis,
                                    generatedFeatures: features,
                                  };
                                  await fetch(`/api/products/${currentProduct.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ raw_analysis: updatedAnalysis }),
                                  });
                                  setCurrentProduct(prev => prev ? { ...prev, raw_analysis: updatedAnalysis } : null);
                                }
                              } finally {
                                setIsGeneratingOutline(false);
                              }
                            }}
                            disabled={isGeneratingOutline}
                            className="px-4 py-2 bg-purple-500 text-white font-bold text-sm border-2 border-black rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            {isGeneratingOutline ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                Generate Features
                              </>
                            )}
                          </button>
                        </div>

                        {/* Display Generated Features */}
                        {currentProduct.raw_analysis?.generatedFeatures && (
                          <div className="space-y-3 mb-6">
                            <h3 className="font-bold">Generated Features</h3>
                            <ul className="space-y-2">
                              {currentProduct.raw_analysis.generatedFeatures.map((feature: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                  <CheckCircle className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                                  <span className="text-sm">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Existing MVP Features */}
                        {currentProduct.core_features && currentProduct.core_features.length > 0 && (
                          <div>
                            <h3 className="font-bold mb-3">Core Features (from research)</h3>
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

                    {/* Step 2: Build (for software products) */}
                    {currentStep === 2 && ['saas', 'software-tool', 'mobile-app'].includes(currentProduct.product_type || '') && (
                      <div>
                        <h2 className="text-xl font-black mb-4">Build Your Product</h2>
                        <p className="text-gray-600 mb-6">
                          Use AI-powered tools to build your {currentProduct.product_type?.replace('-', ' ') || 'software'}. 
                          Select a prompt mode and we&apos;ll generate a comprehensive build prompt.
                        </p>
                        
                        {/* Prompt Mode Selector */}
                        <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 text-purple-800 font-bold mb-3">
                            <Zap className="w-5 h-5" />
                            Prompt Mode
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {[
                              { mode: 'full-build' as PromptMode, label: 'Full Build', desc: 'Complete app with all features', icon: '🚀' },
                              { mode: 'spec-only' as PromptMode, label: 'Spec Only', desc: 'Detailed product specification', icon: '📋' },
                              { mode: 'database-design' as PromptMode, label: 'Database', desc: 'Generate database schema', icon: '🗃️' },
                              { mode: 'api-design' as PromptMode, label: 'API Design', desc: 'Design API endpoints', icon: '🔌' },
                              { mode: 'ui-design' as PromptMode, label: 'UI Design', desc: 'Generate UI components', icon: '🎨' },
                            ].map(({ mode, label, desc, icon }) => (
                              <button
                                key={mode}
                                onClick={() => setPromptMode(mode)}
                                className={`p-3 rounded-lg border-2 text-left transition-all ${
                                  promptMode === mode
                                    ? 'border-purple-500 bg-purple-100 shadow-md'
                                    : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{icon}</span>
                                  <span className="font-bold text-sm">{label}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {(() => {
                          const productTypeConfig = getProductTypeConfig(currentProduct.product_type);
                          
                          // Create comprehensive prompt config from product data
                          const promptConfig = createPromptConfigFromProduct(
                            {
                              name: currentProduct.name,
                              description: formData.description || currentProduct.description || '',
                              targetAudience: formData.targetAudience,
                              problemSolved: formData.problemSolved,
                              coreFeatures: currentProduct.core_features || [],
                              additionalFeatures: currentProduct.raw_analysis?.generatedFeatures || [],
                              productType: currentProduct.product_type || 'saas',
                            },
                            promptMode
                          );
                          
                          // Generate the comprehensive SaaS prompt
                          const buildPrompt = generateComprehensiveSaaSPrompt(promptConfig);

                          return (
                            <AIToolSelector
                              recommendedTools={productTypeConfig?.aiTools || ['lovable', 'v0', 'bolt', 'cursor', 'replit', 'claude']}
                              buildPrompt={buildPrompt}
                              productName={currentProduct.name}
                              productType={currentProduct.product_type || 'SaaS'}
                              onToolSelect={(tool) => console.log('Selected tool:', tool)}
                            />
                          );
                        })()}
                      </div>
                    )}

                    {/* Step 2: Structure (for content products) */}
                    {currentStep === 2 && !['saas', 'software-tool', 'mobile-app'].includes(currentProduct.product_type || '') && (
                      <div>
                        <h2 className="text-xl font-black mb-4">Product Structure</h2>
                        <p className="text-gray-600 mb-6">
                          Define the modules, chapters, or features of your product.
                        </p>
                        
                        {/* AI Structure Generation */}
                        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                          <div className="flex items-center gap-2 text-blue-800 font-bold mb-2 text-sm sm:text-base">
                            <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />
                            AI Structure Generator
                          </div>
                          <p className="text-xs sm:text-sm text-blue-700 mb-3">
                            Generate a detailed structure with modules, lessons, and content items.
                          </p>
                          <button 
                            onClick={handleGenerateStructure}
                            disabled={isGeneratingStructure}
                            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-400 text-white font-bold text-sm border-2 border-black rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center sm:justify-start gap-2 disabled:opacity-50"
                          >
                            {isGeneratingStructure ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Lightbulb className="w-4 h-4" />
                                Generate Structure
                              </>
                            )}
                          </button>
                        </div>
                        
                        {/* Display Generated Structure */}
                        {currentProduct.raw_analysis?.structure && (
                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <h3 className="font-black text-base sm:text-lg capitalize">
                                {currentProduct.raw_analysis.structure.product_structure?.type || currentProduct.product_type} Structure
                              </h3>
                              <button
                                onClick={handleGenerateStructure}
                                disabled={isGeneratingStructure}
                                className="text-xs sm:text-sm text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isGeneratingStructure ? 'animate-spin' : ''}`} />
                                Regenerate
                              </button>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
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
                            <div className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
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

                    {/* Step 3: Assets (for all product types) */}
                    {currentStep === 3 && (
                      <div>
                        <h2 className="text-xl font-black mb-4">
                          {isSoftwareProduct ? 'Product Assets' : 'Assets & Resources'}
                        </h2>
                        <p className="text-gray-600 mb-6">
                          {isSoftwareProduct 
                            ? 'Upload cover images and screenshots for your product listing.'
                            : 'Upload or generate the assets needed for your product.'
                          }
                        </p>
                        
                        {/* Software Product - Simple Cover/Screenshot Upload */}
                        {isSoftwareProduct && (
                          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4 sm:p-6 mb-6">
                            <h3 className="font-black text-indigo-800 flex items-center gap-2 mb-3">
                              <ImageIcon className="w-5 h-5" />
                              Cover Image & Screenshots
                            </h3>
                            <p className="text-sm text-indigo-700 mb-4">
                              Upload a cover image and screenshots to showcase your app.
                            </p>
                            
                            {/* Upload Area */}
                            <div 
                              className="border-2 border-dashed border-indigo-300 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer bg-white"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                              <p className="font-bold text-indigo-700 mb-1">Click to upload images</p>
                              <p className="text-xs text-gray-500">PNG, JPG, WebP (recommended: 1200x630 for cover)</p>
                            </div>
                            
                            {/* Display uploaded images */}
                            {assets.filter(a => a.type === 'image').length > 0 && (
                              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {assets.filter(a => a.type === 'image').map((asset) => (
                                  <div key={asset.id} className="relative group rounded-lg overflow-hidden border-2 border-indigo-200">
                                    <img 
                                      src={asset.thumbnailUrl || asset.url} 
                                      alt={asset.name}
                                      className="w-full h-24 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteAsset(asset.id);
                                        }}
                                        className="p-2 bg-red-500 text-white rounded-full"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                    {asset.status === 'saved' && (
                                      <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-green-500 text-white text-xs font-bold rounded">
                                        ✓
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Save unsaved assets button */}
                            {assets.filter(a => a.type === 'image' && a.status !== 'saved').length > 0 && (
                              <button
                                onClick={handleSaveSelectedAssets}
                                disabled={isSavingAssets}
                                className="mt-4 w-full py-2 bg-indigo-500 text-white font-bold text-sm border-2 border-black rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
                              >
                                {isSavingAssets ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                                Save Images to Library
                              </button>
                            )}
                            
                            {/* AI Image Generation for Software Products */}
                            <div className="mt-4 bg-purple-50 border-2 border-purple-300 rounded-xl p-4">
                              <div className="flex items-center gap-2 text-purple-800 font-bold mb-2 text-sm">
                                <ImageIcon className="w-4 h-4" />
                                Generate with AI
                              </div>
                              <p className="text-xs text-purple-700 mb-3">
                                Create custom cover images or screenshots with AI
                              </p>
                              <div className="flex flex-col sm:flex-row gap-2">
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
                                  className="w-full sm:w-auto px-4 py-2 bg-purple-500 text-white font-bold border-2 border-black rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                  {isGeneratingImage ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-4 h-4" />
                                  )}
                                  <span>Generate</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Content Products - AI Auto-Suggest Section */}
                        {!isSoftwareProduct && currentProduct.raw_analysis?.outline && (
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                              <div>
                                <h3 className="font-black text-purple-800 flex items-center gap-2 text-sm sm:text-base">
                                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                                  AI Image Suggestions
                                </h3>
                                <p className="text-xs sm:text-sm text-purple-600">
                                  Generate images based on your content outline
                                </p>
                              </div>
                              <button
                                onClick={handleGetImageSuggestions}
                                disabled={isLoadingSuggestions}
                                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-purple-500 text-white font-bold text-sm border-2 border-black rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4">
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
                        
                        {/* Custom AI Image Generation - for content products */}
                        {!isSoftwareProduct && (
                          <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                            <div className="flex items-center gap-2 text-purple-800 font-bold mb-2 text-sm sm:text-base">
                              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                              Custom AI Image
                            </div>
                            <p className="text-xs sm:text-sm text-purple-700 mb-3">
                              Generate custom images with your own prompt
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={assetGenerationPrompt}
                                onChange={(e) => setAssetGenerationPrompt(e.target.value)}
                                placeholder="Describe the image..."
                                className="flex-1 px-3 py-2 border-2 border-purple-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                              />
                              <button
                                onClick={handleGenerateImage}
                                disabled={isGeneratingImage || !assetGenerationPrompt.trim()}
                                className="w-full sm:w-auto px-4 py-2 bg-purple-500 text-white font-bold border-2 border-black rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {isGeneratingImage ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Sparkles className="w-4 h-4" />
                                )}
                                <span>Generate</span>
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Assets Grid */}
                        {assets.length > 0 ? (
                          <div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                              <h3 className="font-bold text-sm sm:text-base">Your Assets ({assets.length})</h3>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                {assets.some(a => a.status !== 'saved') && (
                                  <>
                                    <span className="text-xs sm:text-sm text-gray-500">
                                      {assets.filter(a => a.isSelected && a.status !== 'saved').length} selected
                                    </span>
                                    <button
                                      onClick={handleSaveSelectedAssets}
                                      disabled={isSavingAssets || !assets.some(a => a.isSelected && a.status !== 'saved')}
                                      className="px-3 sm:px-4 py-2 bg-green-500 text-white font-bold text-xs sm:text-sm border-2 border-black rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                      {isSavingAssets ? (
                                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                                      ) : (
                                        <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                                      )}
                                      <span className="hidden sm:inline">Save Selected to Library</span>
                                      <span className="sm:hidden">Save Selected</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                              {assets.map((asset) => (
                                <div 
                                  key={asset.id} 
                                  className={`relative group border-2 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all cursor-pointer ${
                                    asset.isSelected ? 'border-green-500 ring-2 ring-green-200' : 
                                    asset.status === 'saved' ? 'border-green-300' : 'border-gray-200'
                                  }`}
                                  onClick={() => asset.status !== 'saved' && toggleAssetSelection(asset.id)}
                                >
                                  {/* Selection checkbox for unsaved assets */}
                                  {asset.status !== 'saved' && (
                                    <div className="absolute top-2 left-2 z-10">
                                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                        asset.isSelected ? 'bg-green-500 border-green-500' : 'bg-white/90 border-gray-300'
                                      }`}>
                                        {asset.isSelected && <Check className="w-4 h-4 text-white" />}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Saved badge */}
                                  {asset.status === 'saved' && (
                                    <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                                      <Check className="w-3 h-3" />
                                      Saved
                                    </div>
                                  )}
                                  
                                  {asset.type === 'image' ? (
                                    (asset.thumbnailUrl || asset.url) ? (
                                      <div className="relative">
                                        <img 
                                          src={asset.thumbnailUrl || asset.url} 
                                          alt={asset.name}
                                          className="w-full h-32 sm:h-40 object-cover"
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
                                        {savingAssetId === asset.id && (
                                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                            <div className="bg-white rounded-lg px-3 py-2 flex items-center gap-2">
                                              <Loader2 className="w-4 h-4 animate-spin text-green-500" />
                                              <span className="text-sm font-bold">Saving...</span>
                                            </div>
                                          </div>
                                        )}
                                        {asset.fullUrl && asset.status === 'saved' && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.open(asset.fullUrl, '_blank');
                                            }}
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
                                    <div className="flex items-center justify-between mt-2">
                                      <p className={`text-xs capitalize ${
                                        asset.status === 'saved' ? 'text-green-600' :
                                        asset.status === 'uploaded' ? 'text-orange-600' :
                                        asset.status === 'generating' ? 'text-purple-600' :
                                        asset.status === 'error' ? 'text-red-600' :
                                        'text-gray-500'
                                      }`}>
                                        {asset.status === 'generating' ? '🎨 Generating...' : 
                                         asset.status === 'saved' ? '✓ In Library' :
                                         asset.status === 'uploaded' ? '⏳ Not Saved' : asset.status}
                                      </p>
                                      {asset.status !== 'saved' && asset.status !== 'generating' && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSaveAssetToStorage(asset);
                                          }}
                                          disabled={savingAssetId === asset.id}
                                          className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                                        >
                                          {savingAssetId === asset.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <Save className="w-3 h-3" />
                                          )}
                                          Save
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Delete button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAsset(asset.id);
                                    }}
                                    className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 shadow"
                                  >
                                    <X className="w-4 h-4 text-red-500" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 sm:py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
                            <p className="font-bold mb-1 text-sm sm:text-base">No assets yet</p>
                            <p className="text-xs sm:text-sm px-4">
                              {currentProduct.raw_analysis?.outline 
                                ? 'Click "Auto-Suggest Images" above to get AI recommendations'
                                : 'Upload files or generate images using the options above'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 4: Deploy (for software products) */}
                    {currentStep === 4 && isSoftwareProduct && (
                      <div>
                        <h2 className="text-lg sm:text-xl font-black mb-3 sm:mb-4">Deploy Your App</h2>
                        <p className="text-gray-600 mb-6">
                          Connect your deployed application and finalize your product.
                        </p>
                        
                        {/* Production URL Section */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                          <h3 className="font-black mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                            🌐 Production URL
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Enter the URL where your app is deployed. This is where customers will access your product.
                          </p>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">App URL</label>
                              <input
                                type="url"
                                value={formData.notes?.includes('Production URL:') 
                                  ? formData.notes.split('Production URL:')[1]?.split('\n')[0]?.trim() || ''
                                  : ''}
                                onChange={(e) => {
                                  const url = e.target.value;
                                  setFormData(prev => ({
                                    ...prev,
                                    notes: prev.notes?.includes('Production URL:') 
                                      ? prev.notes.replace(/Production URL:.*(\n|$)/, `Production URL: ${url}\n`)
                                      : `Production URL: ${url}\n${prev.notes || ''}`
                                  }));
                                  if (url) {
                                    setExportChecklist(prev => ({ ...prev, assetsReady: true }));
                                  }
                                }}
                                placeholder="https://your-app.vercel.app"
                                className="w-full px-4 py-2.5 sm:py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Deploy to Vercel, Railway, or any host</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>We&apos;ll redirect customers to your app</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Pricing Section */}
                        {ENABLE_PRICING ? (
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                            <h3 className="font-black mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                              💰 Set Your Price
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Product Price</label>
                                <div className="relative">
                                  <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                  <input
                                    type="text"
                                    value={productPrice}
                                    onChange={(e) => {
                                      setProductPrice(e.target.value);
                                      if (e.target.value && parseFloat(e.target.value) > 0) {
                                        setExportChecklist(prev => ({ ...prev, pricingSet: true }));
                                      }
                                    }}
                                    placeholder="49.00"
                                    className="w-full pl-7 sm:pl-8 pr-4 py-2.5 sm:py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-lg sm:text-xl font-bold"
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  Suggested: {currentProduct.pricing_model || '$29 - $199/mo'}
                                </p>
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Pricing Model</label>
                                <select
                                  className="w-full px-4 py-2.5 sm:py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-bold"
                                  defaultValue="one-time"
                                >
                                  <option value="one-time">One-time Purchase</option>
                                  <option value="subscription">Monthly Subscription</option>
                                  <option value="freemium">Freemium + Premium</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-100 border-2 border-gray-200 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 text-center">
                            <h3 className="font-black mb-2">💰 Pricing Disabled</h3>
                            <p className="text-sm text-gray-600">Pricing and checkout are temporarily disabled. All products will be free to create and export. You can set pricing later when billing is re-enabled.</p>
                          </div>
                        )}

                        {/* Category Section */}
                        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                          <h3 className="font-black mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                            🏷️ Product Category
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Choose a category for your product.
                          </p>
                          <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Category</label>
                            <select
                              value={selectedCategory}
                              onChange={(e) => setSelectedCategory(e.target.value)}
                              className="w-full px-4 py-2.5 sm:py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                            >
                              <option value="">Select a category...</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.icon} {cat.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Preview & Launch */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
                          <div className="flex items-center gap-2 text-gray-600 font-bold text-sm sm:text-base mb-4">
                            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                            Product Preview
                          </div>
                          
                          <div className="bg-white border-2 border-black rounded-xl p-4 sm:p-6 shadow-brutal">
                            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                              {/* App Icon or Cover Image */}
                              {assets.filter(a => a.type === 'image').length > 0 ? (
                                <div className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-black rounded-xl overflow-hidden shrink-0">
                                  <img 
                                    src={assets.filter(a => a.type === 'image')[0]?.thumbnailUrl || assets.filter(a => a.type === 'image')[0]?.url} 
                                    alt="Cover"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-indigo-500 border-2 border-black rounded-xl flex items-center justify-center shrink-0">
                                  <Code className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg sm:text-xl font-black break-words">{currentProduct.name}</h3>
                                <p className="text-gray-600 text-xs sm:text-sm mb-2">{currentProduct.tagline || 'No tagline set'}</p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-700 rounded-full capitalize">
                                    {currentProduct.product_type?.replace('-', ' ') || 'Software'}
                                  </span>
                                  {selectedCategory && categories.find(c => c.id === selectedCategory) && (
                                    <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-full">
                                      {categories.find(c => c.id === selectedCategory)?.icon} {categories.find(c => c.id === selectedCategory)?.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="w-full sm:w-auto text-left sm:text-right mt-2 sm:mt-0">
                                <p className="text-xl sm:text-2xl font-black text-green-600">
                                  ${productPrice || '0'}
                                </p>
                                <p className="text-xs text-gray-500">Price</p>
                              </div>
                            </div>
                            
                            {/* Description Preview */}
                            {currentProduct.description && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-sm text-gray-600 line-clamp-2">{currentProduct.description}</p>
                              </div>
                            )}
                            
                            {/* Features Preview */}
                            {currentProduct.core_features && currentProduct.core_features.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-xs font-bold text-gray-500 mb-2">KEY FEATURES</p>
                                <div className="flex flex-wrap gap-2">
                                  {currentProduct.core_features.slice(0, 4).map((feature, i) => (
                                    <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                      ✓ {feature}
                                    </span>
                                  ))}
                                  {currentProduct.core_features.length > 4 && (
                                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-500">
                                      +{currentProduct.core_features.length - 4} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-500 mt-3 text-center">
                            Preview how your product will look to buyers
                          </p>
                        </div>

                        {/* Launch Button - Opens Platform Selection Modal */}
                        <div className="flex justify-center">
                          <button
                            onClick={() => setShowExportModal(true)}
                            disabled={!productPrice}
                            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-lg border-2 border-black rounded-xl shadow-brutal hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                          >
                            <Rocket className="w-6 h-6" />
                            Finalize Product
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Export (for content products only) */}
                    {currentStep === 4 && !isSoftwareProduct && (
                      <div>
                        <h2 className="text-lg sm:text-xl font-black mb-3 sm:mb-4 flex items-center gap-2">
                          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-uvz-orange" />
                          Export Your Product
                        </h2>
                        <p className="text-gray-600 mb-6">
                          Preview your completed product and download it as a beautifully formatted file.
                        </p>

                        {/* Book-Like Preview */}
                        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-4 border-black rounded-2xl overflow-hidden shadow-brutal mb-6">
                          {/* Book Cover */}
                          <div className="bg-gradient-to-br from-uvz-orange to-orange-600 p-8 sm:p-12 text-center text-white relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10">
                              <div className="absolute top-4 left-4 w-32 h-32 border-4 border-white rounded-full" />
                              <div className="absolute bottom-4 right-4 w-24 h-24 border-4 border-white rounded-full" />
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-4 border-white rounded-full" />
                            </div>
                            <div className="relative">
                              {assets.filter(a => a.category === 'cover' || a.type === 'image').length > 0 ? (
                                <div className="w-32 h-40 sm:w-40 sm:h-52 mx-auto mb-6 border-4 border-white rounded-lg overflow-hidden shadow-2xl">
                                  <img 
                                    src={assets.filter(a => a.category === 'cover' || a.type === 'image')[0]?.thumbnailUrl || assets.filter(a => a.category === 'cover' || a.type === 'image')[0]?.url} 
                                    alt="Cover"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-32 h-40 sm:w-40 sm:h-52 mx-auto mb-6 bg-white/20 border-4 border-white/50 rounded-lg flex items-center justify-center">
                                  <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-white/70" />
                                </div>
                              )}
                              <h1 className="text-2xl sm:text-4xl font-black mb-3 drop-shadow-lg">{currentProduct.name}</h1>
                              <p className="text-lg sm:text-xl opacity-90 mb-4">{currentProduct.tagline || 'Your Digital Product'}</p>
                              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm font-bold">
                                <span className="capitalize">{currentProduct.product_type?.replace('-', ' ') || 'Digital Product'}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Book Stats */}
                          {currentProduct.raw_analysis?.outline && (
                            <div className="bg-white border-b-2 border-black p-4 sm:p-6">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                                <div>
                                  <p className="text-2xl sm:text-3xl font-black text-uvz-orange">
                                    {currentProduct.raw_analysis.outline.chapters?.length || 0}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Chapters</p>
                                </div>
                                <div>
                                  <p className="text-2xl sm:text-3xl font-black text-uvz-orange">
                                    {currentProduct.raw_analysis.outline.estimated_word_count?.toLocaleString() || '—'}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Words</p>
                                </div>
                                <div>
                                  <p className="text-2xl sm:text-3xl font-black text-uvz-orange">
                                    {currentProduct.raw_analysis.outline.estimated_total_pages || '—'}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Pages</p>
                                </div>
                                <div>
                                  <p className="text-2xl sm:text-3xl font-black text-green-600">
                                    {currentProduct.raw_analysis.outline.chapters?.filter((ch: Chapter) => ch.content).length || 0}/{currentProduct.raw_analysis.outline.chapters?.length || 0}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Complete</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Table of Contents */}
                          <div className="bg-white p-4 sm:p-6">
                            <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                              📚 Table of Contents
                            </h3>
                            {currentProduct.raw_analysis?.outline?.chapters ? (
                              <div className="space-y-2">
                                {currentProduct.raw_analysis.outline.chapters.map((chapter: Chapter, index: number) => (
                                  <div 
                                    key={chapter.id} 
                                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                                      chapter.content 
                                        ? 'border-green-300 bg-green-50' 
                                        : 'border-gray-200 bg-gray-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                        chapter.content 
                                          ? 'bg-green-500 text-white' 
                                          : 'bg-gray-300 text-gray-600'
                                      }`}>
                                        {chapter.content ? <Check className="w-4 h-4" /> : index + 1}
                                      </div>
                                      <div>
                                        <p className="font-bold text-sm sm:text-base">{chapter.title}</p>
                                        {chapter.wordCount && (
                                          <p className="text-xs text-gray-500">{chapter.wordCount.toLocaleString()} words</p>
                                        )}
                                      </div>
                                    </div>
                                    {chapter.content && (
                                      <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                        Ready
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-center py-8">No chapters generated yet. Go back to the Content step to generate your outline.</p>
                            )}
                          </div>
                          
                          {/* Generated Assets Preview */}
                          {assets.filter(a => a.category === 'illustration' || a.category === 'cover' || a.category === 'chapter').length > 0 && (
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-t-2 border-black p-4 sm:p-6">
                              <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                                🎨 Included Assets
                              </h3>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {assets.filter(a => a.category === 'illustration' || a.category === 'cover' || a.category === 'chapter').map((asset) => (
                                  <div key={asset.id} className="bg-white border-2 border-gray-200 rounded-lg p-2 text-center">
                                    {asset.type === 'image' ? (
                                      <div className="aspect-square rounded overflow-hidden mb-2">
                                        <img 
                                          src={asset.thumbnailUrl || asset.url} 
                                          alt={asset.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <div className="aspect-square rounded bg-gray-100 flex items-center justify-center mb-2">
                                        <FileText className="w-8 h-8 text-gray-400" />
                                      </div>
                                    )}
                                    <p className="text-xs font-medium truncate">{asset.name}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Bonus Content */}
                          {currentProduct.raw_analysis?.outline?.bonus_content && currentProduct.raw_analysis.outline.bonus_content.length > 0 && (
                            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-t-2 border-black p-4 sm:p-6">
                              <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                                🎁 Bonus Materials
                              </h3>
                              <div className="grid sm:grid-cols-2 gap-3">
                                {currentProduct.raw_analysis.outline.bonus_content.map((bonus: BonusContent, i: number) => (
                                  <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-amber-200">
                                    <CheckCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                    <div>
                                      <p className="font-bold text-sm">{bonus.title}</p>
                                      <p className="text-xs text-gray-500 capitalize">{bonus.type}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Export Actions */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-4 border-green-500 rounded-2xl p-6 sm:p-8 text-center">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <Download className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                          </div>
                          <h3 className="text-xl sm:text-2xl font-black mb-2">Ready to Download!</h3>
                          <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            Your product has been compiled and is ready to export. Choose a format and download it; HTML opens in the browser, PDF uses your print dialog, Word (.doc) opens in Word, and Markdown (.md) is perfect for repos or editing.
                          </p>
                          <div className="mb-4 flex items-center justify-center gap-2">
                            <label className="text-sm font-medium mr-2">Select format:</label>
                            <select
                              value={exportFormat}
                              onChange={(e) => setExportFormat(e.target.value as any)}
                              className="px-3 py-2 rounded-lg border bg-white"
                              aria-label="Export format"
                            >
                              <option value="html">HTML</option>
                              <option value="pdf">PDF (Print to PDF)</option>
                              <option value="doc">Word (.docx)</option>
                              <option value="md">Markdown (.md)</option>
                            </select>
                          </div>
                          
                          {/* Content Status */}
                          {currentProduct.raw_analysis?.outline?.chapters && (
                            <div className="mb-6 p-4 bg-white rounded-xl border-2 border-green-200 inline-block">
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${
                                    currentProduct.raw_analysis.outline.chapters.every((ch: Chapter) => ch.content) 
                                      ? 'bg-green-500' 
                                      : 'bg-yellow-500'
                                  }`} />
                                  <span className="font-medium">
                                    {currentProduct.raw_analysis.outline.chapters.filter((ch: Chapter) => ch.content).length} of {currentProduct.raw_analysis.outline.chapters.length} chapters written
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <button
                            onClick={() => setShowFormatModal(true)}
                            disabled={isExporting}
                            className="px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-lg sm:text-xl border-4 border-black rounded-2xl shadow-brutal hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000000] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mx-auto"
                          >
                            {isExporting ? (
                              <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Preparing Download...
                              </>
                            ) : (
                              <>
                                <Download className="w-6 h-6" />
                                Export & Download
                              </>
                            )}
                          </button>
                          
                          <p className="text-xs text-gray-500 mt-4">
                            Download in HTML, PDF (print), Word, or Markdown • Sell on Gumroad, Payhip, or your own site
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                      <button
                        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0}
                        className="w-full sm:w-auto order-2 sm:order-1 px-6 py-2.5 sm:py-3 font-bold text-gray-600 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      
                      <button
                        onClick={() => {
                          handleSaveProduct();
                          if (currentStep < getProductSteps(currentProduct?.product_type).length - 1) {
                            setCurrentStep(currentStep + 1);
                          }
                        }}
                        disabled={isSaving}
                        className="w-full sm:w-auto order-1 sm:order-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-uvz-orange text-white font-bold text-sm sm:text-base border-2 border-black rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {currentStep < getProductSteps(currentProduct?.product_type).length - 1 ? 'Save & Continue' : 'Save'}
                      </button>
                    </div>
                  </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white border-2 sm:border-4 border-black rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-brutal w-full max-w-md">
            <h3 className="text-lg sm:text-xl font-black mb-2">Delete Product?</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              This action cannot be undone. The product will be permanently deleted.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 font-bold text-sm sm:text-base border-2 border-black rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => productToDelete && handleDeleteProduct(productToDelete)}
                className="flex-1 px-4 py-2 bg-red-500 text-white font-bold text-sm sm:text-base border-2 border-black rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation Modal */}
      {showUnsavedChangesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowUnsavedChangesModal(false)} />
          <div className="relative bg-white border-2 sm:border-4 border-black rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-brutal w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black">Unsaved Changes</h3>
                <p className="text-sm text-gray-500">Your changes haven&apos;t been saved</p>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              You have unsaved changes that will be lost if you continue. Would you like to save them first?
            </p>
            <div className="flex flex-col gap-2 sm:gap-3">
              <button
                onClick={handleSaveAndProceed}
                disabled={isSaving}
                className="w-full px-4 py-2.5 bg-uvz-orange text-white font-bold text-sm sm:text-base border-2 border-black rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
              <button
                onClick={handleDiscardChanges}
                className="w-full px-4 py-2.5 bg-red-50 text-red-600 font-bold text-sm sm:text-base border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                Discard Changes
              </button>
              <button
                onClick={() => {
                  setShowUnsavedChangesModal(false);
                  setPendingAction(null);
                }}
                className="w-full px-4 py-2 font-bold text-sm sm:text-base text-gray-600 hover:text-black transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Product Modal */}
      {showExportModal && currentProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowExportModal(false)} />
          <div className="relative bg-white border-4 border-black rounded-2xl p-6 sm:p-8 shadow-brutal w-full max-w-md">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-black mb-2">Finalize Your Product</h3>
              <p className="text-gray-600">
                Mark <strong className="text-black">{currentProduct.name}</strong> as complete and ready to sell.
              </p>
            </div>
            
            {/* What's Next */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-2">Next Steps After Export:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 shrink-0" />
                  Download your content and assets
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 shrink-0" />
                  Upload to your preferred selling platform (Gumroad, Payhip, etc.)
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 shrink-0" />
                  Set up your payment processing
                </li>
              </ul>
            </div>

            {/* Quick Download */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Download now</label>
              <div className="flex gap-3">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="px-3 py-2 rounded-lg border flex-1"
                >
                  <option value="html">HTML</option>
                  <option value="pdf">PDF (Print)</option>
                  <option value="doc">Word (.docx)</option>
                  <option value="md">Markdown (.md)</option>
                </select>
                <button
                  onClick={() => handleDownloadProduct(true)}
                  disabled={isExporting}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white font-bold"
                >
                  {isExporting ? 'Preparing...' : 'Download'}
                </button>
              </div>
            </div>

            {/* Price Display */}
            {productPrice && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4 border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Suggested Price</span>
                  <span className="font-black text-xl text-green-600">${productPrice}</span>
                </div>
              </div>
            )}
            
            {/* Finalize Button */}
            <button
              onClick={handleExportProduct}
              disabled={isExporting}
              className="w-full py-4 font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Finalizing...
                </>
              ) : (
                <>
                  <Rocket className="w-6 h-6" />
                  Mark as Complete
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Format Selection Modal (for export/download) */}
      {showFormatModal && currentProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFormatModal(false)} />
          <div className="relative bg-white border-4 border-black rounded-2xl p-6 sm:p-8 shadow-brutal w-full max-w-md">
            <button
              onClick={() => setShowFormatModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <h3 className="text-xl font-black mb-2">Choose Export Format</h3>
              <p className="text-sm text-gray-600 mb-4">Select the file type you'd like to download.</p>
            </div>

            <div className="mb-6">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="w-full px-4 py-3 rounded-lg border"
                aria-label="Choose export format"
              >
                <option value="html">HTML</option>
                <option value="pdf">PDF (Print to PDF)</option>
                <option value="doc">Word (.docx)</option>
                <option value="md">Markdown (.md)</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button className="px-4 py-2 rounded-lg border" onClick={() => setShowFormatModal(false)}>Cancel</button>
              <button
                className="px-6 py-2 rounded-lg bg-green-600 text-white font-bold"
                onClick={async () => {
                  setShowFormatModal(false);
                  await handleDownloadProduct(true);
                }}
              >
                {isExporting ? 'Preparing...' : 'Download'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCelebration(false)} />
          <div className="relative bg-white border-4 border-black rounded-3xl p-8 sm:p-12 shadow-brutal max-w-md text-center transform animate-bounce-in">
            <button
              onClick={() => setShowCelebration(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Celebration Icon */}
            <div className="text-8xl mb-6 animate-bounce">
              🎉
            </div>
            
            {/* Success Message */}
            <h2 className="text-3xl sm:text-4xl font-black mb-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
              Download Complete!
            </h2>
            
            <p className="text-lg text-gray-600 mb-4">
              Congratulations! Your product has been downloaded and is ready to sell! 🚀
            </p>
            
            {/* Download Success Icon */}
            <div className="flex items-center justify-center gap-2 mb-6 text-green-600">
              <Check className="w-6 h-6" />
              <span className="font-bold">File saved to your Downloads folder</span>
            </div>
            
            {/* Next Steps */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-200 text-left">
              <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                <Rocket className="w-4 h-4" />
                What&apos;s Next?
              </h4>
              <ul className="text-sm text-green-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  Upload to Gumroad, Payhip, or your website
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  Set your price and payment options
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  Start promoting and earning! 💰
                </li>
              </ul>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCelebration(false)}
                className="flex-1 py-3 font-bold border-2 border-black rounded-xl hover:bg-gray-100 transition-colors"
              >
                Back to Builder
              </button>
              <button
                onClick={() => {
                  setShowCelebration(false);
                  window.location.href = '/builder';
                }}
                className="flex-1 py-3 font-bold bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                Create Another
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
                        {/* Content completion status */}
                        {currentProduct.raw_analysis.outline.chapters && (
                          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-sm">
                              {currentProduct.raw_analysis.outline.chapters.filter((ch: Chapter) => ch.content).length}/{currentProduct.raw_analysis.outline.chapters.length} chapters written
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Full Content Preview - Ebook Style */}
                      <div className="space-y-8">
                        {currentProduct.raw_analysis.outline.chapters?.map((chapter: Chapter) => (
                          <div key={chapter.id} className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gradient-to-r from-uvz-orange/10 to-transparent p-4 border-b">
                              <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-black text-lg shrink-0 ${chapter.content ? 'bg-green-500 text-white' : 'bg-uvz-orange text-white'}`}>
                                  {chapter.content ? <CheckCircle className="w-6 h-6" /> : chapter.number}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-xl">{chapter.title}</h4>
                                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                    {chapter.wordCount && <span>{chapter.wordCount.toLocaleString()} words</span>}
                                    {chapter.readingTimeMinutes && <span>• {chapter.readingTimeMinutes} min read</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="p-6">
                              {chapter.content ? (
                                <>
                                  {/* Rendered Content */}
                                  <div className="prose prose-gray max-w-none">
                                    <div 
                                      className="text-gray-700 leading-relaxed"
                                      dangerouslySetInnerHTML={{ 
                                        __html: chapter.content
                                          .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3 text-gray-900">$1</h2>')
                                          .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2 text-gray-800">$1</h3>')
                                          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
                                          .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc my-1">$1</li>')
                                          .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc my-1">$1</li>')
                                          .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="my-3">$&</ul>')
                                          .replace(/\n\n/g, '</p><p class="my-3">')
                                      }}
                                    />
                                  </div>
                                  
                                  {/* Key Takeaways */}
                                  {chapter.keyTakeaways && chapter.keyTakeaways.length > 0 && (
                                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                      <h5 className="font-bold text-blue-800 mb-3">💡 Key Takeaways</h5>
                                      <ul className="space-y-2">
                                        {chapter.keyTakeaways.map((takeaway, i) => (
                                          <li key={i} className="text-blue-700 flex items-start gap-2">
                                            <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                            {takeaway}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                  <p className="font-medium">Content not yet generated</p>
                                  <p className="text-sm">{chapter.description}</p>
                                  {chapter.keyPoints && chapter.keyPoints.length > 0 && (
                                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                                      {chapter.keyPoints.slice(0, 3).map((point, i) => (
                                        <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                          • {point}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
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
                            {currentProduct.raw_analysis.outline.bonus_content.map((bonus: BonusContent, i: number) => (
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
                  Preview how your product will look to buyers
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

      {/* Notification Modal */}
      {notification.show && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border-4 border-black shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className={`p-6 ${
              notification.type === 'success' ? 'bg-gradient-to-r from-green-50 to-emerald-50' :
              notification.type === 'error' ? 'bg-gradient-to-r from-red-50 to-rose-50' :
              'bg-gradient-to-r from-blue-50 to-indigo-50'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  notification.type === 'success' ? 'bg-green-500' :
                  notification.type === 'error' ? 'bg-red-500' :
                  'bg-blue-500'
                }`}>
                  {notification.type === 'success' && <CheckCircle className="w-8 h-8 text-white" />}
                  {notification.type === 'error' && <X className="w-8 h-8 text-white" />}
                  {notification.type === 'info' && <Sparkles className="w-8 h-8 text-white" />}
                </div>
                <div>
                  <h3 className="text-xl font-black">{notification.title}</h3>
                  <p className="text-gray-600 mt-1">{notification.message}</p>
                </div>
              </div>
            </div>
            
            {/* Details */}
            {notification.details && notification.details.length > 0 && (
              <div className="p-6 border-t border-gray-100">
                <div className="space-y-2">
                  {notification.details.map((detail, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-700">
                      <div className={`w-2 h-2 rounded-full ${
                        notification.type === 'success' ? 'bg-green-500' :
                        notification.type === 'error' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`} />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                className={`w-full py-3 font-bold border-2 border-black rounded-xl transition-colors ${
                  notification.type === 'success' ? 'bg-green-500 hover:bg-green-600 text-white' :
                  notification.type === 'error' ? 'bg-red-500 hover:bg-red-600 text-white' :
                  'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {notification.type === 'success' ? 'Awesome!' : notification.type === 'error' ? 'Got it' : 'OK'}
              </button>
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
