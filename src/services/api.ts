import type { Product, Category } from '@/types';


const API_BASE_URL = '/api';

// Detect if running in mobile app (Capacitor)
const isCapacitor = () => {
  return !!(window as any).Capacitor;
};
export const api = {
  // Categories
  getCategories: async (): Promise<{ success: boolean; categories: Category[] }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      return response.json();
    } catch (error) {
      console.log('Falling back to offline mode for categories');
      return {success:false,categories:[]};
    }
  },

  // Products
  getProducts: async (
    search = '',
    category = 'all',
    page = 1,
    limit = 50,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  ): Promise<{
    success: boolean;
    products: Product[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    }
  }> => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category !== 'all') params.append('category', category);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const response = await fetch(`${API_BASE_URL}/products?${params}`);
      return response.json();
    } catch (error) {
      console.log("Error:" ,error );
      return {success:false,products:[]};
    }
  },
  createProduct: async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category_name'>): Promise<{ success: boolean; id?: number; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      return response.json();
    } catch (error) {
      console.log('Falling back to offline mode for create product');
      return {success:false,error:'Falling back to offline mode for create product',id:0};
    }
  },

  updateProduct: async (productData: Omit<Product, 'created_at' | 'updated_at' | 'category_name'>): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      return response.json();
    } catch (error) {
      console.log('Falling back to offline mode for update product');
      return {success:false,error:'Falling back to offline mode for update product'};
    }
  },

  deleteProduct: async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/products?id=${id}`, {
        method: 'DELETE',
      });
      return response.json();
    } catch (error) {
      console.log('Falling back to offline mode for delete product');
      return  {success:false,error:'Falling back to offline mode for update product'};
    }
  },

  uploadImage: async (file: File): Promise<{ success: boolean; imageUrl?: string; error?: string }> => {
   try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      return response.json();
    } catch (error) {
      console.log('Falling back to offline mode for image upload');
      return  {success:false,error:'Falling back to offline mode for update product'};;
    }
  },

  deleteImage: async (imageUrl: string): Promise<{ success: boolean; error?: string }> => {
 try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });
      return response.json();
    } catch (error) {
      console.log('Falling back to offline mode for delete image');
      return  {success:false,error:'Falling back to offline mode for update product'};
    }
  },


};
