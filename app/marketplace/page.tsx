'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  LayoutList, 
  Star, 
  ExternalLink, 
  Eye,
  Bookmark,
  BookmarkCheck,
  Cloud,
  GraduationCap,
  BookOpen,
  Layout,
  Wrench,
  Users,
  Smartphone,
  Package,
  ChevronDown,
  Sparkles,
  ArrowLeft,
  Menu
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatHeader from '@/components/chat/ChatHeader';

// Icon mapping for categories
const categoryIcons: Record<string, React.ElementType> = {
  Cloud: Cloud,
  GraduationCap: GraduationCap,
  BookOpen: BookOpen,
  Layout: Layout,
  Wrench: Wrench,
  Users: Users,
  Smartphone: Smartphone,
  Package: Package,
};

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  thumbnail_url: string;
  price_type: 'free' | 'one_time' | 'subscription';
  price: number;
  currency: string;
  subscription_interval?: string;
  features: string[];
  is_featured: boolean;
  view_count: number;
  website_url: string;
  purchase_url: string;
  published_at: string;
  seller: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string;
  };
}

interface Session {
  id: string;
  title: string;
  phase: string;
  created_at: string;
  last_message_at: string;
}

function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(searchParams.get('featured') === 'true');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Saved products
  const [savedProducts, setSavedProducts] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
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

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/marketplace/categories');
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }
    fetchCategories();
  }, []);

  // Fetch user and saved products
  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: saves } = await supabase
          .from('marketplace_saves')
          .select('product_id')
          .eq('user_id', user.id);
        
        if (saves) {
          setSavedProducts(new Set(saves.map(s => s.product_id)));
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
      }
    }
    fetchUser();
  }, [supabase]);

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') params.set('category', selectedCategory);
        if (searchQuery) params.set('search', searchQuery);
        if (sortBy) params.set('sort', sortBy);
        if (showFeaturedOnly) params.set('featured', 'true');
        params.set('page', currentPage.toString());
        
        const response = await fetch(`/api/marketplace?${params.toString()}`);
        const data = await response.json();
        
        setProducts(data.products || []);
        setTotalProducts(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [selectedCategory, searchQuery, sortBy, showFeaturedOnly, currentPage]);

  // Toggle save product
  const toggleSave = async (productId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    const isSaved = savedProducts.has(productId);
    
    if (isSaved) {
      await supabase
        .from('marketplace_saves')
        .delete()
        .eq('product_id', productId)
        .eq('user_id', user.id);
      
      setSavedProducts(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    } else {
      await supabase
        .from('marketplace_saves')
        .insert({ product_id: productId, user_id: user.id });
      
      setSavedProducts(prev => new Set(prev).add(productId));
    }
  };

  // Format price
  const formatPrice = (product: Product) => {
    if (product.price_type === 'free') return 'Free';
    const price = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency || 'USD',
    }).format(product.price);
    if (product.price_type === 'subscription') {
      return `${price}/${product.subscription_interval === 'yearly' ? 'yr' : 'mo'}`;
    }
    return price;
  };

  const getCategoryIcon = (iconName: string) => {
    return categoryIcons[iconName] || Package;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const createNewChat = () => {
    router.push('/chat');
  };

  const isMobile = !isDesktop;

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
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-uvz-orange to-orange-500 border-b-2 border-black py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
              Discover Digital Products
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto mb-6">
              Explore products built by entrepreneurs who found their Unique Value Zone.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-black rounded-lg focus:ring-2 focus:ring-white focus:outline-none text-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full font-bold text-sm border-2 border-black whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-uvz-orange text-white shadow-brutal'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              All Products
            </button>
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-4 py-2 rounded-full font-bold text-sm border-2 border-black whitespace-nowrap transition-all flex items-center gap-2 ${
                    selectedCategory === cat.slug
                      ? 'bg-uvz-orange text-white shadow-brutal'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Sort & View */}
          <div className="flex items-center gap-3">
            {/* Featured Toggle */}
            <button
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              className={`px-4 py-2 rounded-lg font-bold text-sm border-2 border-black flex items-center gap-2 transition-all ${
                showFeaturedOnly
                  ? 'bg-yellow-400 text-black shadow-brutal'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Featured
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 bg-white border-2 border-black rounded-lg font-bold text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-uvz-orange"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            </div>

            {/* View Mode */}
            <div className="hidden sm:flex items-center border-2 border-black rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-uvz-orange text-white' : 'bg-white hover:bg-gray-50'}`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-uvz-orange text-white' : 'bg-white hover:bg-gray-50'}`}
              >
                <LayoutList className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-gray-600 mb-6">
          {loading ? 'Loading...' : `${totalProducts} product${totalProducts !== 1 ? 's' : ''} found`}
        </p>

        {/* Products Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-uvz-orange border-t-transparent rounded-full"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your filters or search query</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const CategoryIcon = product.category ? getCategoryIcon(product.category.icon) : Package;
              const isSaved = savedProducts.has(product.id);
              
              return (
                <div
                  key={product.id}
                  className="group bg-white border-2 border-black rounded-lg overflow-hidden shadow-brutal hover:-translate-y-1 transition-transform"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gray-100 border-b-2 border-black overflow-hidden">
                    {product.thumbnail_url ? (
                      <img
                        src={product.thumbnail_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-uvz-orange to-orange-400">
                        <CategoryIcon className="w-12 h-12 text-white/50" />
                      </div>
                    )}
                    
                    {/* Featured Badge */}
                    {product.is_featured && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-400 text-black text-xs font-black rounded border border-black flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Featured
                      </div>
                    )}
                    
                    {/* Save Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSave(product.id);
                      }}
                      className="absolute top-2 right-2 p-2 bg-white rounded-full border-2 border-black shadow-sm hover:scale-110 transition-transform"
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-4 h-4 text-uvz-orange" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Category & Price */}
                    <div className="flex items-center justify-between mb-2">
                      {product.category && (
                        <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                          <CategoryIcon className="w-3 h-3" />
                          {product.category.name}
                        </span>
                      )}
                      <span className={`text-sm font-black ${product.price_type === 'free' ? 'text-green-600' : 'text-uvz-orange'}`}>
                        {formatPrice(product)}
                      </span>
                    </div>

                    {/* Name & Tagline */}
                    <h3 className="font-black text-lg mb-1 line-clamp-1">{product.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{product.tagline}</p>

                    {/* Seller */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-uvz-orange rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {product.seller?.full_name?.charAt(0) || product.seller?.email?.charAt(0) || 'U'}
                      </div>
                      <span className="text-xs text-gray-500 truncate">
                        {product.seller?.full_name || product.seller?.email?.split('@')[0]}
                      </span>
                    </div>

                    {/* Stats & CTA */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {product.view_count}
                        </span>
                      </div>
                      
                      {product.purchase_url || product.website_url ? (
                        <a
                          href={product.purchase_url || product.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded flex items-center gap-1 hover:bg-gray-800 transition-colors"
                        >
                          View
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {products.map((product) => {
              const CategoryIcon = product.category ? getCategoryIcon(product.category.icon) : Package;
              const isSaved = savedProducts.has(product.id);
              
              return (
                <div
                  key={product.id}
                  className="flex gap-4 bg-white border-2 border-black rounded-lg overflow-hidden shadow-brutal hover:-translate-y-0.5 transition-transform p-4"
                >
                  {/* Thumbnail */}
                  <div className="relative w-48 h-32 shrink-0 bg-gray-100 border-2 border-black rounded-lg overflow-hidden">
                    {product.thumbnail_url ? (
                      <img
                        src={product.thumbnail_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-uvz-orange to-orange-400">
                        <CategoryIcon className="w-10 h-10 text-white/50" />
                      </div>
                    )}
                    {product.is_featured && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-yellow-400 text-black text-xs font-black rounded border border-black flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Featured
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {product.category && (
                            <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                              <CategoryIcon className="w-3 h-3" />
                              {product.category.name}
                            </span>
                          )}
                        </div>
                        <h3 className="font-black text-xl mb-1">{product.name}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">{product.tagline}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {product.view_count} views
                          </span>
                          <span>
                            by {product.seller?.full_name || product.seller?.email?.split('@')[0]}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`text-2xl font-black mb-2 ${product.price_type === 'free' ? 'text-green-600' : 'text-uvz-orange'}`}>
                          {formatPrice(product)}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleSave(product.id)}
                            className="p-2 border-2 border-black rounded hover:bg-gray-50"
                          >
                            {isSaved ? (
                              <BookmarkCheck className="w-5 h-5 text-uvz-orange" />
                            ) : (
                              <Bookmark className="w-5 h-5" />
                            )}
                          </button>
                          {(product.purchase_url || product.website_url) && (
                            <a
                              href={product.purchase_url || product.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-uvz-orange text-white font-bold rounded border-2 border-black flex items-center gap-2 hover:-translate-y-0.5 transition-transform shadow-brutal"
                            >
                              View Product
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border-2 border-black rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 border-2 border-black rounded font-bold ${
                    currentPage === pageNum
                      ? 'bg-uvz-orange text-white'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border-2 border-black rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-uvz-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-uvz-orange border-t-transparent rounded-full"></div>
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}
