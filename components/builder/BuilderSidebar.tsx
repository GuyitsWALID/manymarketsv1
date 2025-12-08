'use client';

import Link from 'next/link';
import { 
  Package, 
  Lightbulb, 
  MessageSquare,
  Zap,
  BarChart3,
  Sparkles,
  Crown,
  Plus,
  FolderOpen
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  product_type: string;
  status: string;
}

interface BuilderSidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  isLogoutOpen: boolean;
  setIsLogoutOpen: (open: boolean) => void;
  handleLogout: () => void;
  products?: Product[];
  currentProductId?: string | null;
  onSelectProduct?: (productId: string) => void;
  onCreateProduct?: () => void;
  productStats?: {
    total: number;
    active: number;
    launched: number;
    archived: number;
  };
}

export default function BuilderSidebar({
  isOpen,
  isMobile,
  onClose,
  isLogoutOpen,
  setIsLogoutOpen,
  handleLogout,
  products = [],
  currentProductId,
  onSelectProduct,
  onCreateProduct,
  productStats,
}: BuilderSidebarProps) {
  if (!isOpen) return null;

  const recentProducts = products.filter(p => p.status !== 'archived').slice(0, 5);

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobile && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 bg-gray-50 border-r-2 border-black transition-all duration-300 w-72 flex flex-col ${
          isMobile ? 'shadow-2xl' : 'top-16'
        }`}
      >
        <div className="flex-1 overflow-y-auto p-4 pt-20 md:pt-4">
          {/* Create New Product Button */}
          <button
            onClick={() => {
              onCreateProduct?.();
              if (isMobile) onClose();
            }}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 px-4 border-2 border-black shadow-brutal hover:-translate-y-0.5 transition-transform font-bold flex items-center justify-center gap-2 rounded"
          >
            <Plus className="w-5 h-5 shrink-0" />
            <span>New Product</span>
          </button>

          {/* Product Stats */}
          {productStats && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-white border-2 border-black rounded p-2 text-center">
                <p className="text-lg font-black text-purple-600">{productStats.active}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
              <div className="bg-white border-2 border-black rounded p-2 text-center">
                <p className="text-lg font-black text-green-600">{productStats.launched}</p>
                <p className="text-xs text-gray-500">Launched</p>
              </div>
            </div>
          )}

          {/* Recent Products */}
          {recentProducts.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-2">
                <FolderOpen className="w-3 h-3" />
                Recent Products
              </h3>
              <div className="space-y-2">
                {recentProducts.map((product) => {
                  const isActive = currentProductId === product.id;
                  
                  return (
                    <button
                      key={product.id}
                      onClick={() => {
                        onSelectProduct?.(product.id);
                        if (isMobile) onClose();
                      }}
                      className={`w-full text-left bg-white border-2 border-black rounded p-3 cursor-pointer transition-all hover:shadow-brutal ${
                        isActive ? 'ring-2 ring-purple-500 shadow-brutal' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Package className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{product.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 capitalize">
                              {product.product_type?.replace('-', ' ') || 'Product'}
                            </span>
                            {product.status === 'launched' && (
                              <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                Live
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Product Suggestions */}
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-2">
              <Lightbulb className="w-3 h-3" />
              Product Ideas
            </h3>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800 mb-1">Need inspiration?</p>
                  <p className="text-xs text-amber-700">Chat with AI to discover product ideas based on your skills.</p>
                </div>
              </div>
              <Link
                href="/chat"
                onClick={() => isMobile && onClose()}
                className="mt-2 w-full flex items-center justify-center gap-2 text-xs font-bold py-2 bg-amber-500 text-white border border-amber-600 rounded hover:bg-amber-600 transition-colors"
              >
                <MessageSquare className="w-3 h-3" />
                Start Discovery Chat
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                href="/idea-score"
                onClick={() => isMobile && onClose()}
                className="flex items-center justify-center gap-2 text-sm font-bold text-center py-2 bg-uvz-orange text-white border-2 border-black rounded hover:shadow-brutal transition-shadow"
              >
                <Zap className="w-4 h-4" />
                Idea Score
              </Link>
              <Link
                href="/chat"
                onClick={() => isMobile && onClose()}
                className="flex items-center justify-center gap-2 text-sm font-bold text-center py-2 bg-white border-2 border-black rounded hover:shadow-brutal transition-shadow"
              >
                <MessageSquare className="w-4 h-4" />
                Research Chat
              </Link>
            </div>
          </div>

          {/* Analytics Teaser */}
          <div className="mt-6">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded p-3">
              <div className="flex items-start gap-2">
                <BarChart3 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-purple-800 mb-1">Product Analytics</p>
                  <p className="text-xs text-purple-700">Track views, sales, and revenue for your products.</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-purple-600">
                <Crown className="w-3 h-3" />
                <span className="font-medium">Coming soon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t-2 border-black">
          <button
            onClick={() => setIsLogoutOpen(true)}
            className="w-full bg-white text-black py-3 px-4 border-2 border-black font-bold rounded hover:bg-gray-100 transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {isLogoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            onClick={() => setIsLogoutOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative bg-white border-4 border-black p-6 w-full max-w-sm mx-4 shadow-brutal rounded-lg">
            <h2 className="text-xl font-black mb-2 text-center">Are you sure you want to leave?</h2>
            <p className="text-sm text-gray-600 mb-6 text-center">
              You&apos;ll need to log in again to continue building.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsLogoutOpen(false)}
                className="flex-1 px-4 py-3 bg-gray-100 border-2 border-black rounded-lg font-bold hover:bg-gray-200 transition-colors"
              >
                No, stay
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-3 bg-red-500 text-white border-2 border-black rounded-lg font-bold hover:bg-red-600 hover:-translate-y-0.5 transition-all"
              >
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
