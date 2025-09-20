import type { Product, Category } from '@/types';

// Local storage keys
const STORAGE_KEYS = {
  PRODUCTS: 'droguerie_products',
  CATEGORIES: 'droguerie_categories',
  SETTINGS: 'droguerie_settings'
};

// Sample data for offline mode
const SAMPLE_CATEGORIES: Category[] = [
  { id: 1, name: 'Droguerie', description: 'Produits chimiques, adhésifs, mastics et composés spécialisés', created_at: new Date().toISOString() },
  { id: 2, name: 'Sanitaire', description: 'Équipements de plomberie, tuyaux, robinets, chauffe-eau, accessoires de salle de bain', created_at: new Date().toISOString() },
  { id: 3, name: 'Peinture', description: 'Peintures, apprêts, pinceaux, rouleaux, accessoires et outils de peinture', created_at: new Date().toISOString() },
  { id: 4, name: 'Quincaillerie', description: 'Fixations, vis, boulons, écrous, charnières, serrures et composants métalliques', created_at: new Date().toISOString() },
  { id: 5, name: 'Outillage', description: 'Outils à main, outils électriques, équipements de mesure et de sécurité', created_at: new Date().toISOString() },
  { id: 6, name: 'Électricité', description: 'Composants électriques, câblage, interrupteurs, prises, luminaires', created_at: new Date().toISOString() }
];

const SAMPLE_PRODUCTS: Product[] = [
  { id: 1, name: 'Colle PVC forte', description: 'Adhésif haute résistance pour tuyaux PVC', category_id: 1, purchase_price: 25.00, selling_price: 35.00, remaining_stock: 50, min_stock_level: 10, image_url: undefined, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category_name: 'Droguerie' },
  { id: 2, name: 'Mastic d\'étanchéité universel', description: 'Mastic étanche pour joints et fissures', category_id: 1, purchase_price: 18.00, selling_price: 28.00, remaining_stock: 75, min_stock_level: 15, image_url: undefined, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category_name: 'Droguerie' },
  { id: 3, name: 'Robinet mélangeur chromé', description: 'Robinet mélangeur pour cuisine et salle de bain', category_id: 2, purchase_price: 150.00, selling_price: 220.00, remaining_stock: 25, min_stock_level: 5, image_url: undefined, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category_name: 'Sanitaire' },
  { id: 4, name: 'Tube PVC Ø100mm', description: 'Tuyau PVC 100mm pour évacuation', category_id: 2, purchase_price: 45.00, selling_price: 65.00, remaining_stock: 100, min_stock_level: 20, image_url: undefined, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category_name: 'Sanitaire' },
  { id: 5, name: 'Peinture murale blanche 10L', description: 'Peinture acrylique blanche pour murs intérieurs', category_id: 3, purchase_price: 180.00, selling_price: 250.00, remaining_stock: 40, min_stock_level: 10, image_url: undefined, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category_name: 'Peinture' },
  { id: 6, name: 'Rouleau de peinture professionnel', description: 'Rouleau pour finitions lisses', category_id: 3, purchase_price: 15.00, selling_price: 25.00, remaining_stock: 80, min_stock_level: 20, image_url: undefined, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category_name: 'Peinture' },
  { id: 7, name: 'Vis à bois 4x40mm (boîte 100)', description: 'Vis pour menuiserie, tête fraisée', category_id: 4, purchase_price: 12.50, selling_price: 18.00, remaining_stock: 200, min_stock_level: 50, image_url: undefined, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category_name: 'Quincaillerie' },
  { id: 8, name: 'Serrure de sécurité 3 points', description: 'Serrure haute sécurité avec 3 clés', category_id: 4, purchase_price: 85.00, selling_price: 125.00, remaining_stock: 15, min_stock_level: 5, image_url: undefined, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category_name: 'Quincaillerie' },
  { id: 9, name: 'Perceuse visseuse 18V', description: 'Perceuse sans fil avec batterie et chargeur', category_id: 5, purchase_price: 280.00, selling_price: 420.00, remaining_stock: 12, min_stock_level: 3, image_url: undefined, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category_name: 'Outillage' },
  { id: 10, name: 'Marteau de charpentier 500g', description: 'Marteau avec manche bois', category_id: 5, purchase_price: 35.00, selling_price: 55.00, remaining_stock: 25, min_stock_level: 8, image_url: undefined, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category_name: 'Outillage' },
  { id: 11, name: 'Câble électrique 2.5mm² (rouleau 100m)', description: 'Câble pour installations électriques', category_id: 6, purchase_price: 85.00, selling_price: 120.00, remaining_stock: 20, min_stock_level: 5, image_url: undefined, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category_name: 'Électricité' },
  { id: 12, name: 'Interrupteur simple blanc', description: 'Interrupteur mural blanc', category_id: 6, purchase_price: 12.00, selling_price: 18.00, remaining_stock: 100, min_stock_level: 25, image_url: undefined, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category_name: 'Électricité' }
];

// Helper functions for localStorage
const getStoredData = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const setStoredData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Initialize data if not exists
const initializeData = () => {
  const categories = getStoredData(STORAGE_KEYS.CATEGORIES, []);
  const products = getStoredData(STORAGE_KEYS.PRODUCTS, []);

  if (categories.length === 0) {
    setStoredData(STORAGE_KEYS.CATEGORIES, SAMPLE_CATEGORIES);
  }

  if (products.length === 0) {
    setStoredData(STORAGE_KEYS.PRODUCTS, SAMPLE_PRODUCTS);
  }
};

// Initialize data on import
initializeData();

// Offline API implementation
export const offlineApi = {
  // Categories
  getCategories: async (): Promise<{ success: boolean; categories: Category[] }> => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    const categories = getStoredData(STORAGE_KEYS.CATEGORIES, SAMPLE_CATEGORIES);
    return { success: true, categories };
  },

  // Products
  getProducts: async (search = '', category = 'all'): Promise<{ success: boolean; products: Product[] }> => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay

    let products = getStoredData(STORAGE_KEYS.PRODUCTS, SAMPLE_PRODUCTS);
    const categories = getStoredData(STORAGE_KEYS.CATEGORIES, SAMPLE_CATEGORIES);

    // Add category names to products
    products = products.map(product => ({
      ...product,
      category_name: categories.find(c => c.id === product.category_id)?.name || 'Unknown'
    }));

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        (product.description?.toLowerCase().includes(searchLower))
      );
    }

    if (category !== 'all') {
      products = products.filter(product => product.category_id === Number.parseInt(category));
    }

    // Sort by created_at desc
    products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { success: true, products };
  },

  createProduct: async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category_name'>): Promise<{ success: boolean; id?: number; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay

    try {
      const products: Product[] = getStoredData(STORAGE_KEYS.PRODUCTS, SAMPLE_PRODUCTS);
      const newId = Math.max(...products.map(p => p.id), 0) + 1;

      const newProduct: Product = {
        ...productData,
        id: newId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category_name: '' // Will be populated when fetched
      };

      products.push(newProduct);
      setStoredData(STORAGE_KEYS.PRODUCTS, products);

      return { success: true, id: newId };
    } catch (error) {
      return { success: false, error: 'Failed to create product' };
    }
  },

  updateProduct: async (productData: Omit<Product, 'created_at' | 'updated_at' | 'category_name'>): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay

    try {
      const products: Product[] = getStoredData(STORAGE_KEYS.PRODUCTS, []);
      const index = products.findIndex(p => p.id === productData.id);

      if (index === -1) {
        return { success: false, error: 'Product not found' };
      }

      products[index] = {
        ...products[index],
        ...productData,
        updated_at: new Date().toISOString()
      };

      setStoredData(STORAGE_KEYS.PRODUCTS, products);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update product' };
    }
  },

  deleteProduct: async (id: number): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay

    try {
      const products: Product[] = getStoredData(STORAGE_KEYS.PRODUCTS, []);
      const filteredProducts = products.filter(p => p.id !== id);

      if (products.length === filteredProducts.length) {
        return { success: false, error: 'Product not found' };
      }

      setStoredData(STORAGE_KEYS.PRODUCTS, filteredProducts);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete product' };
    }
  },

  uploadImage: async (file: File): Promise<{ success: boolean; imageUrl?: string; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate upload delay

    try {
      // Convert file to base64 for offline storage
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const imageUrl = reader.result as string;
          resolve({ success: true, imageUrl });
        };
        reader.onerror = () => {
          resolve({ success: false, error: 'Failed to process image' });
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      return { success: false, error: 'Failed to upload image' };
    }
  },

  deleteImage: async (imageUrl: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    // For offline mode, we don't need to actually delete base64 images
    return { success: true };
  },

  // Additional offline utilities
  exportData: () => {
    const categories = getStoredData(STORAGE_KEYS.CATEGORIES, []);
    const products = getStoredData(STORAGE_KEYS.PRODUCTS, []);
    return { categories, products, exportDate: new Date().toISOString() };
  },

  importData: (data: { categories: Category[], products: Product[] }) => {
    setStoredData(STORAGE_KEYS.CATEGORIES, data.categories);
    setStoredData(STORAGE_KEYS.PRODUCTS, data.products);
  },

  resetData: () => {
    setStoredData(STORAGE_KEYS.CATEGORIES, SAMPLE_CATEGORIES);
    setStoredData(STORAGE_KEYS.PRODUCTS, SAMPLE_PRODUCTS);
  }
};
