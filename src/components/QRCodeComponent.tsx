import { useTranslation } from "react-i18next";
import { X, Package, Download, Copy } from "lucide-react";
import { Button } from "./ui/button";
import type { Product } from "@/types";

// QR Code component - KEPT FOR FUTURE USE
// TODO: Implement actual QR code generation library (e.g., qrcode.js)
export function ProductQRCode({ product, isVisible, onClose }: {
  product: Product;
  isVisible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  if (!isVisible) return null;

  const productData = JSON.stringify({
    id: product.id,
    name: product.name,
    price: product.selling_price,
    stock: product.remaining_stock
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Product QR Code</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center space-y-4">
          <div className="bg-white p-4 rounded-lg border mx-auto w-fit">
            {/* QR Code would be generated here - for demo, showing placeholder */}
            <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Package className="h-16 w-16 text-gray-400" />
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium">{product.name}</p>
            <p>ID: {product.id}</p>
            <p>Price: {product.selling_price} {t("currency")}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
