# 🚀 Frontend-Backend Connection Guide
## Complete Guide for Connecting React Frontend with Express Backend

### 📚 **Table of Contents**
1. [Understanding the Connection Methods](#understanding-the-connection-methods)
2. [How Vite Proxy Works](#how-vite-proxy-works)
3. [Complete Setup Guide](#complete-setup-guide)
4. [Project Structure](#project-structure)
5. [Code Examples](#code-examples)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Quick Start Template](#quick-start-template)

---

## 📡 **Understanding the Connection Methods**

### **Method 1: Direct URLs (Basic Approach)**
```javascript
// Direct approach - what beginners usually do
fetch('http://localhost:5000/api/products')
  .then(res => res.json())
  .then(data => console.log(data));
```

**Problems with Direct URLs:**
- ❌ CORS (Cross-Origin Resource Sharing) errors
- ❌ Hard-coded URLs difficult to change for production
- ❌ Browser security issues with different ports
- ❌ Not suitable for production deployment

### **Method 2: Vite Proxy (Professional Approach)**
```javascript
// Proxy approach - clean and professional
fetch('/api/products')  // No localhost:5000 needed!
  .then(res => res.json())
  .then(data => console.log(data));
```

**Benefits of Proxy:**
- ✅ No CORS issues (browser thinks it's same origin)
- ✅ Easy deployment (works in production automatically)
- ✅ Clean code (no hard-coded server URLs)
- ✅ Development convenience (Vite handles everything)

---

## 🔧 **How Vite Proxy Works**

### **The Magic Behind the Scenes**

When you configure Vite proxy:
```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      ws: true,
    },
  },
}
```

**What Actually Happens:**
1. Frontend runs on `http://localhost:5173`
2. Backend runs on `http://localhost:5000`
3. When frontend calls `/api/anything`
4. Vite automatically redirects to `http://localhost:5000/api/anything`
5. Response flows back to frontend seamlessly

### **The Complete Flow**
```
Frontend Component
    ↓ calls
API Service (/api/products)
    ↓ Vite proxy redirects to
Backend Server (localhost:5000/api/products)
    ↓ processes request
Database
    ↓ returns data
Backend Server
    ↓ sends JSON response
Vite proxy forwards back
    ↓ receives response
Frontend Component (updates UI)
```

---

## 🎯 **Complete Setup Guide**

### **Step 1: Frontend Setup**

#### **1.1 Create Vite React Project**
```bash
# Create new project
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
```

#### **1.2 Configure Vite (vite.config.ts)**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',    // Backend server URL
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})
```

#### **1.3 Create API Service Layer (src/services/api.ts)**
```typescript
// API service using proxy
const API_BASE_URL = '/api';  // Uses proxy, not direct URL!

export const api = {
  // GET request example
  getProducts: async () => {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    return response.json();
  },

  // POST request example
  createProduct: async (productData: any) => {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });
    if (!response.ok) {
      throw new Error('Failed to create product');
    }
    return response.json();
  },

  // PUT request example
  updateProduct: async (id: number, productData: any) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });
    if (!response.ok) {
      throw new Error('Failed to update product');
    }
    return response.json();
  },

  // DELETE request example
  deleteProduct: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete product');
    }
    return response.json();
  },

  // File upload example
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData, // Don't set Content-Type for FormData!
    });
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    return response.json();
  },
};
```

#### **1.4 Using API in React Component (src/App.tsx)**
```typescript
import { useState, useEffect } from 'react';
import { api } from './services/api';

interface Product {
  id: number;
  name: string;
  price: number;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await api.getProducts();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Add new product
  const handleAddProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      const result = await api.createProduct(productData);
      if (result.success) {
        // Refresh products list
        const updatedData = await api.getProducts();
        setProducts(updatedData.products || []);
      }
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  // Test connection button
  const testConnection = async () => {
    try {
      const result = await api.getProducts();
      console.log('Connection successful:', result);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>My App</h1>
      <button onClick={testConnection}>Test Backend Connection</button>

      <div>
        <h2>Products ({products.length})</h2>
        {products.map(product => (
          <div key={product.id}>
            {product.name} - ${product.price}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
```

### **Step 2: Backend Setup**

#### **2.1 Create Backend Directory**
```bash
mkdir backend
cd backend
npm init -y
```

#### **2.2 Install Dependencies**
```bash
npm install express cors dotenv
npm install -D nodemon
```

#### **2.3 Create Server (backend/server.js)**
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sample data (replace with database)
let products = [
  { id: 1, name: 'Product 1', price: 10.99 },
  { id: 2, name: 'Product 2', price: 20.99 },
];

// API Routes
app.get('/api/products', (req, res) => {
  res.json({
    success: true,
    products: products
  });
});

app.post('/api/products', (req, res) => {
  const { name, price } = req.body;
  const newProduct = {
    id: products.length + 1,
    name,
    price: parseFloat(price)
  };
  products.push(newProduct);

  res.json({
    success: true,
    product: newProduct,
    message: 'Product created successfully'
  });
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, price } = req.body;

  const productIndex = products.findIndex(p => p.id === parseInt(id));
  if (productIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Product not found'
    });
  }

  products[productIndex] = {
    ...products[productIndex],
    name: name || products[productIndex].name,
    price: price !== undefined ? parseFloat(price) : products[productIndex].price
  };

  res.json({
    success: true,
    product: products[productIndex],
    message: 'Product updated successfully'
  });
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const productIndex = products.findIndex(p => p.id === parseInt(id));

  if (productIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Product not found'
    });
  }

  products.splice(productIndex, 1);
  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at: http://localhost:${PORT}/api`);
});
```

#### **2.4 Add Scripts to package.json**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

---

## 📂 **Project Structure**

```
my-project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   │   └── api.ts          # ← API service layer
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts          # ← Proxy configuration
│   └── package.json
├── backend/
│   ├── server.js               # ← Express server
│   ├── .env                    # ← Environment variables
│   └── package.json
└── README.md
```

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Cannot GET /api/..."**
```
❌ Error: Cannot GET /api/products
```
**Causes & Solutions:**
```javascript
// ❌ Problem: Missing /api prefix in backend route
app.get('/products', (req, res) => {  // Wrong!

// ✅ Solution: Add /api prefix
app.get('/api/products', (req, res) => {  // Correct!
```

### **Issue 2: CORS Errors**
```
❌ Error: Access to fetch at 'http://localhost:5000/api/products' from origin 'http://localhost:5173' has been blocked by CORS policy
```
**Solution:**
```javascript
// ✅ Add CORS middleware in backend
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### **Issue 3: "Connection Refused"**
```
❌ Error: Failed to fetch
```
**Solutions:**
1. ✅ Make sure backend is running on port 5000
2. ✅ Check proxy target URL matches backend port
3. ✅ Ensure no firewall blocking the ports

### **Issue 4: Proxy Not Working**
```
❌ Error: Calls to /api/* not being proxied
```
**Solutions:**
1. ✅ Restart Vite dev server after changing config
2. ✅ Check proxy configuration syntax
3. ✅ Verify target URL is correct

### **Issue 5: JSON Parsing Errors**
```
❌ Error: Unexpected token < in JSON at position 0
```
**Solution:**
```javascript
// ✅ Check response status before parsing
const response = await fetch('/api/products');
if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}
const data = await response.json();
```

---

## ⚡ **Quick Start Template**

### **Minimal Working Example**

#### **Frontend (vite.config.ts):**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000'  // Simple version
    }
  }
})
```

#### **Frontend (src/App.tsx):**
```typescript
import { useState, useEffect } from 'react'

function App() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hello');  // Proxy magic!
      const data = await res.json();
      setMessage(data.message);
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Fetch on component mount
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Frontend-Backend Connection Test</h1>
      <button onClick={fetchData} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch from Backend'}
      </button>
      <p><strong>Response:</strong> {message}</p>
    </div>
  );
}

export default App;
```

#### **Backend (server.js):**
```javascript
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple API endpoint
app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from backend! Connection successful! 🎉',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 Test the API: http://localhost:${PORT}/api/hello`);
});
```

### **Testing Your Setup**

#### **Step 1: Start Both Servers**
```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Should see: "🚀 Backend server running on http://localhost:5000"

# Terminal 2 - Frontend
cd frontend
npm run dev
# Should see: "Local: http://localhost:5173"
```

#### **Step 2: Verify Connection**
1. Open browser: `http://localhost:5173`
2. Click "Fetch from Backend" button
3. Should see: "Hello from backend! Connection successful! 🎉"

#### **Step 3: Test API Directly (Optional)**
```bash
# Test backend directly
curl http://localhost:5000/api/hello

# Should return:
# {"message":"Hello from backend! Connection successful! 🎉","timestamp":"2024-..."}
```

---

## 🎯 **Production Deployment Notes**

### **Environment Variables**
```bash
# backend/.env
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://your-frontend-domain.com
```

### **Build Commands**
```bash
# Frontend build
npm run build

# Backend for production
npm start
```

### **Proxy vs Production**
- **Development**: Vite proxy handles routing
- **Production**: Use environment variables for API URLs
- **Frontend build**: Proxy only works in development

### **Production API Service**
```typescript
// src/services/api.ts - Production ready
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-backend-domain.com/api'  // Production
  : '/api';  // Development (uses proxy)

export const api = {
  // Your API methods...
};
```

---

## 📝 **Summary Checklist**

For a successful frontend-backend connection, you need:

- ✅ **Vite proxy configuration** in vite.config.ts
- ✅ **Backend server** running on the target port (5000)
- ✅ **API routes** with correct /api prefix
- ✅ **CORS middleware** in backend
- ✅ **API service layer** in frontend
- ✅ **Both servers running** simultaneously
- ✅ **Error handling** in API calls
- ✅ **Environment variables** for different environments

The proxy configuration alone is **not enough** - you need the complete setup with both frontend and backend properly configured!

---

## 🔗 **Additional Resources**

- [Vite Proxy Configuration](https://vitejs.dev/config/server-options.html#server-proxy)
- [Express.js Documentation](https://expressjs.com/)
- [CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Fetch API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

---

**Happy Coding! 🚀**

*This guide covers everything you need to know about connecting React frontend with Express backend using Vite proxy. Keep this file handy for future projects!*
