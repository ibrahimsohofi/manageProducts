import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ImageIcon,
  ArrowLeft,
  Home,
  DollarSignIcon,
  PackageMinus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product, Category } from "@/types";
import { Navbar } from "./Navbar";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "./SearchBar";
import { api } from "@/services/api";
import { toast } from "sonner";
import { CategoryFilter } from "./CategoryFilter";

interface ViewProductProps {
  product: Product;
  categories: Category[];
}

export function ViewProduct({ product, categories }: ViewProductProps) {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const navigate = useNavigate();
  useEffect(() => {
    setImageError(false);
  }, [product?.image_url]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!product) {
    return null;
  }
  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || t("categories.none");
  };
  const getStockStatus = (stock: number, minLevel: number) => {
    if (stock === 0) {
      return {
        label: t("status.outOfStock"),
        variant: "destructive" as const,
        color: "text-red-600",
      };
    }
    if (stock <= minLevel) {
      return {
        label: t("status.lowStock"),
        variant: "secondary" as const,
        color: "text-amber-600",
      };
    }
    return {
      label: t("status.inStock"),
      variant: "default" as const,
      color: "text-green-600",
    };
  };
  const stockStatus = getStockStatus(
    product.remaining_stock || 0,
    product.min_stock_level || 0
  );
  const stockValue =
    (product.selling_price || 0) * (product.remaining_stock || 0);
  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.getProducts(searchTerm);
      if (response.success) {
        setProducts(response.products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error(t("messages.errorLoading"));
    }
  }, [t]);
  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.getCategories();
      if (response.success) {
        setCategories(response.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error(t("messages.errorLoading"));
    }
  }, [t]);
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);
  const [searchTerm, setSearchTerm] = useState("");
  return (
    <>
      <Navbar />
      <div>
        <Card className="w-full px-6 py-2 rounded-none  shadow-2xl  border-2 border-none gap-1 flex flex-col  bg-white dark:bg-gray-800 ">
          <div className="flex flex-col sm:flex-row  justify-between">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
            >
              <ArrowLeft className="h-4 w-4 " />
              {t("actions.goBack")}
            </Button>
            <div className="flex gap-2 w-fit">
              <div className="w-52">
                <SearchBar value={searchTerm} onChange={setSearchTerm} />{" "}
              </div>
              <div className="w-48">
                <CategoryFilter
                  categories={category}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                />
              </div>
            </div>
          </div>

          <CardContent className="gap-5 p-0 flex">
            {/* Product Image */}
            {product.image_url && !imageError ? (
              <img
                src={product.image_url}
                alt={product.name}
                className=" rounded-lg h-[81vh] w-fit shadow-xl backdrop-blur-sm "
                onError={() => setImageError(true)}
              />
            ) : (
              <div className=" h-full flex items-center justify-center">
                <img src="placeholder.png" alt={product.name} />
              </div>
            )}
            <div className="w-1/2 gap-5 flex flex-col items-left">
              <CardHeader className="text-left p-0">
                <CardTitle className="text-2xl font-bold text-blue-800 dark:text-white ">
                  {product.name}
                </CardTitle>
              </CardHeader>
              {/* Product Details Grid */}
              <div className="grid grid-cols-2 gap-8 text-sm ">
                <div className=" flex items-center ">
                  <DollarSign className="h-9 w-9 text-orange-500" />
                  <div className="flex items-center h-full gap-2">
                    <span className="font-medium text-lg">
                      {t("products.sellingPrice")}:
                    </span>
                    <span className="text-red-500 font-bold  text-xl">
                      {product.selling_price} {t("currency")}
                    </span>
                  </div>
                </div>
                <div className=" flex items-center ">
                  <DollarSign className="h-9 w-9 text-orange-500" />
                  <div className="flex items-center h-full gap-2">
                    <span className="font-medium text-xl">
                      {t("products.purchasePrice")}:
                    </span>
                    <span className="text-green-600 font-bold  text-xl">
                      {product.purchase_price} {t("currency")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center">
                  <DollarSign className="h-9 w-9 text-purple-600" />
                  <div className="flex justify-center gap-2">
                    <span className="font-medium text-lg">
                      {t("stats.stockValue")}:
                    </span>
                    <span className="text-purple-600 font-bold  text-xl">
                      {stockValue.toFixed(2)} {t("currency")}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Package className="h-10 w-10 text-blue-600" />
                    <span className="font-medium text-xl">
                      {t("products.category")}:
                    </span>
                    <span className="text-gray-600 dark:text-gray-300 text-xl ">
                      {getCategoryName(product.category_id)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <TrendingUp className="h-10 w-10 text-blue-600" />
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-lg">
                      {t("products.stock")}:
                    </span>
                    <span
                      className={`font-semibold text-xl  flex items-center ${stockStatus.color}`}
                    >
                      {product.remaining_stock || 0}
                      {(product.remaining_stock || 0) <=
                        (product.min_stock_level || 0) && (
                        <AlertTriangle className="h-10 w-10" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <PackageMinus className="h-10 w-10 text-blue-600" />
                  <span className="font-medium text-xl">
                    {t("products.minStock")}:
                  </span>
                  <span className="font-medium text-lg">
                    {product.min_stock_level || 0}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
