import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Package, TrendingUp, AlertTriangle, ArrowLeft, Edit } from "lucide-react";
import { Navbar } from "./components/Navbar";
import { ProductTable } from "./components/ProductTable";
import { ProductForm } from "./components/ProductForm";
import { SearchBar } from "./components/SearchBar";
import { CategoryFilter } from "./components/CategoryFilter";
import { ProductTableSkeleton } from "./components/ProductTableSkeleton";
import { StatsCardsSkeleton } from "./components/StatsCardsSkeleton";
import { PageLoading } from "./components/ui/Spinner";
import { Pagination } from "./components/ui/Pagination";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Toaster, toast } from "sonner";
import type { Product, Category } from "./types";
import { Route, Routes, useParams, useNavigate } from "react-router-dom";
import { ViewProduct } from "./components/ViewProduct";
import { ProductNotFound } from "./components/ProductNotFound";
import { useDebounce } from "./hooks/useDebounce";
import {
  useProducts,
  useCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "./hooks/useProducts";

function ViewProductPage({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const { id } = useParams();
  const productId = Number(id);
  const productToView = products.find((p) => p.id === productId);
  if (!productToView) {
    return <ProductNotFound />;
  }
  return <ViewProduct product={productToView} categories={categories} />;
}

function Dashboard() {
  const { i18n, t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);



  // Debounce search term to avoid excessive API calls
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Use React Query hooks for data fetching and caching
  const {
    data: productsResponse,
    isLoading: productsLoading,
    error: productsError,
  } = useProducts(
    debouncedSearch,
    selectedCategory,
    currentPage,
    50,
    "created_at",
    "DESC"
  );

  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
  } = useCategories();

  // Mutation hooks for CRUD operations
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  // Extract data from responses
  const products = productsResponse?.products || [];
  const categories = categoriesResponse?.categories || [];
  const pagination =
    productsResponse?.pagination || {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 50,
      hasNextPage: false,
      hasPrevPage: false,
    };

  // Mark initial load as complete once we have data
  useEffect(() => {
    if ((productsResponse || categoriesResponse) && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [productsResponse, categoriesResponse, isInitialLoad]);

  // Initialize RTL support based on current language
  useEffect(() => {
    const currentLang = i18n.language;
    document.dir = currentLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = currentLang;
    if (currentLang === "ar") {
      document.body.classList.add("rtl");
    } else {
      document.body.classList.remove("rtl");
    }
  }, [i18n.language]);

  // Reset to first page when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory]);

  // Handle errors
  useEffect(() => {
    if (productsError) {
      console.error("Error fetching products:", productsError);
      toast.error(t("messages.errorLoading"));
    }
  }, [productsError, t]);

  const handleProductSave = async (
    productData: Omit<
      Product,
      "id" | "created_at" | "updated_at" | "category_name"
    >
  ) => {
    try {
      if (editingProduct) {
        await updateProductMutation.mutateAsync({
          ...productData,
          id: editingProduct.id,
        });
      } else {
        await createProductMutation.mutateAsync(productData);
      }
      setIsFormOpen(false);
      setEditingProduct(null);
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error("Error saving product:", error);
    }
  };

  const handleProductDelete = async (productId: number) => {
    try {
      await deleteProductMutation.mutateAsync(productId);
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error("Error deleting product:", error);
    }
  };

  const handleEditProduct = (product: Product) => {
    try {
      console.log("Editing product:", product);

      // Ensure product has all required fields
      if (!product || !product.id) {
        console.error("Invalid product data:", product);
        toast.error(t("messages.errorLoading"));
        return;
      }

      setEditingProduct(product);
      setIsFormOpen(true);
    } catch (error) {
      console.error("Error in handleEditProduct:", error);
      toast.error(t("messages.errorLoading"));
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Memoize expensive calculations
  const stats = useMemo(() => {
    const totalProducts = pagination.totalItems;
    const totalValue = products.reduce((sum, product) => {
      const price = Number(product.selling_price) || 0;
      const stock = Number(product.remaining_stock) || 0;
      return sum + price * stock;
    }, 0);
    const lowStockProducts = products.filter(
      (product) =>
        (Number(product.remaining_stock) || 0) <=
        (Number(product.min_stock_level) || 0)
    ).length;

    return { totalProducts, totalValue, lowStockProducts };
  }, [products, pagination.totalItems]);

  // Show loading state only on initial load, not during search
  if (isInitialLoad && (productsLoading || categoriesLoading)) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-400">
                {t("dashboard.title")}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {t("dashboard.subtitle")}
              </p>
            </div>
            <Button
              disabled
              className="text-white shadow-lg bg-blue-800 dark:bg-blue-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("products.add")}
            </Button>
          </div>

          {/* Stats Cards Skeleton */}
          <StatsCardsSkeleton />

          {/* Filters Skeleton */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
            </div>
            <div className="md:w-64">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
            </div>
          </div>

          {/* Products Table Skeleton */}
          <ProductTableSkeleton />
        </main>
      </div>
    );
  }

  const isMutating =
    createProductMutation.isPending ||
    updateProductMutation.isPending ||
    deleteProductMutation.isPending;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-400">
              {t("dashboard.title")}
            </h1>
          </div>
          <Button
            onClick={handleAddProduct}
            disabled={isMutating}
            className="text-white shadow-lg transition-all duration-300 hover:shadow-xl transform hover:scale-105"
            style={{
              backgroundColor: "#1e40af",
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("products.add")}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 shadow-lg border-blue-800 dark:border-blue-400 dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-400">
                {t("stats.totalProducts")}
              </CardTitle>
              <Package className="h-4 w-4 text-blue-800 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-400">
                {stats.totalProducts}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("stats.totalProductsDesc")}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg border-blue-800 dark:border-blue-400 dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-400">
                {t("stats.stockValue")}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-800 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-400">
                {Number.isNaN(stats.totalValue)
                  ? "0"
                  : stats.totalValue.toLocaleString()}{" "}
                {t("currency")}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("stats.stockValueDesc")}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg border-orange-600 dark:border-orange-400 dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">
                {t("stats.lowStock")}
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.lowStockProducts}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("stats.lowStockDesc")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
          </div>
          <div className="md:w-64">
            <CategoryFilter
              categories={categories}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />
          </div>
        </div>

        {/* Products Table */}
        <Card className="border-2 shadow-lg border-blue-800 dark:border-blue-400 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-400">
              {t("products.list")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Show loading indicator during search without replacing content */}
            {productsLoading && !isInitialLoad && (
              <div className="mb-4 flex items-center justify-center py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                <span className="ml-2 text-sm text-gray-500">{t('common.searching', 'Recherche en cours...')}</span>
              </div>
            )}

            {/* Only show skeleton on initial load */}
            {isInitialLoad && productsLoading ? (
              <ProductTableSkeleton />
            ) : (
              <>
                <ProductTable
                  products={products}
                  categories={categories}
                  onEdit={handleEditProduct}
                  onDelete={handleProductDelete}
                />

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={pagination.currentPage}
                      totalPages={pagination.totalPages}
                      totalItems={pagination.totalItems}
                      itemsPerPage={pagination.itemsPerPage}
                      onPageChange={handlePageChange}
                      showInfo={true}
                      showFirstLast={true}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Product Form Dialog */}
        <ProductForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleProductSave}
          categories={categories}
          editingProduct={editingProduct}
        />
      </main>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/view/product/:id" element={<ViewProductPageWrapper />} />
      <Route path="/edit/product/:id" element={<EditProductPageWrapper />} />
    </Routes>
  );
}

function ViewProductPageWrapper() {
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { id } = useParams();
  const productId = Number(id);

  const fetchData = useCallback(async () => {
    try {
      const { api } = await import("./services/api");

      // Fetch product and categories in parallel
      const [productResponse, categoriesResponse] = await Promise.all([
        api.getProductById(productId),
        api.getCategories()
      ]);

      if (productResponse.success && productResponse.product) {
        setProduct(productResponse.product);
      } else {
        setNotFound(true);
      }

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.categories);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (!productId || Number.isNaN(productId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    fetchData();
  }, [fetchData, productId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <PageLoading />
      </div>
    );
  }

  if (notFound || !product) {
    return <ProductNotFound />;
  }

  return <ViewProduct product={product} categories={categories} />;
}

function EditProductPageWrapper() {
  const { id } = useParams();
  const productId = Number(id);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { api } = await import("./services/api");
      const [productResponse, categoriesResponse] = await Promise.all([
        api.getProductById(productId),
        api.getCategories()
      ]);

      if (productResponse.success && productResponse.product) {
        setProduct(productResponse.product);
      } else {
        setNotFound(true);
      }

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.categories);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (!productId || Number.isNaN(productId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    fetchData();
  }, [fetchData, productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
        <Navbar />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return <ProductNotFound />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("actions.goBack")}
          </Button>
          <div className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Edit: {product.name}
            </span>
          </div>
        </div>

        <ProductForm
          isOpen={true}
          categories={categories}
          editingProduct={product}
          onClose={() => navigate(-1)}
          onSave={async (formData) => {
            // Handle product update here
            console.log('Product update:', formData);
            // TODO: Implement actual update logic with API
            navigate(-1);
          }}
        />
      </div>
    </div>
  );
}

export default App;
