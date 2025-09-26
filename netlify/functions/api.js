const fs = require('fs').promises;
const path = require('path');

// Simple JSON file storage for demo purposes
const DATA_DIR = '/tmp';
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

// Initialize data files
async function initializeData() {
  try {
    await fs.access(CATEGORIES_FILE);
  } catch {
    const categories = [
      { id: 1, name: 'Outils', description: 'Outils de bricolage et construction', created_at: new Date().toISOString() },
      { id: 2, name: 'Électricité', description: 'Matériel électrique et éclairage', created_at: new Date().toISOString() },
      { id: 3, name: 'Plomberie', description: 'Équipements de plomberie', created_at: new Date().toISOString() },
      { id: 4, name: 'Peinture', description: 'Peintures et accessoires', created_at: new Date().toISOString() },
      { id: 5, name: 'Jardinage', description: 'Outils et produits de jardinage', created_at: new Date().toISOString() }
    ];
    await fs.writeFile(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
  }

  try {
    await fs.access(PRODUCTS_FILE);
  } catch {
    const products = [
      { id: 1, name: 'Marteau 500g', description: 'Marteau à panne fendue 500g', category_id: 1, purchase_price: 25.00, selling_price: 35.00, remaining_stock: 15, min_stock_level: 10, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 2, name: 'Tournevis cruciforme', description: 'Tournevis cruciforme PH2', category_id: 1, purchase_price: 8.00, selling_price: 12.00, remaining_stock: 25, min_stock_level: 10, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 3, name: 'Ampoule LED 9W', description: 'Ampoule LED E27 9W blanc chaud', category_id: 2, purchase_price: 5.00, selling_price: 8.50, remaining_stock: 50, min_stock_level: 10, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 4, name: 'Interrupteur simple', description: 'Interrupteur va-et-vient blanc', category_id: 2, purchase_price: 3.50, selling_price: 6.00, remaining_stock: 30, min_stock_level: 10, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 5, name: 'Robinet mélangeur', description: 'Robinet mélangeur cuisine chromé', category_id: 3, purchase_price: 45.00, selling_price: 75.00, remaining_stock: 8, min_stock_level: 10, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 6, name: 'Peinture blanc mat', description: 'Peinture acrylique blanc mat 2.5L', category_id: 4, purchase_price: 18.00, selling_price: 28.00, remaining_stock: 12, min_stock_level: 10, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 7, name: 'Sécateur', description: 'Sécateur lames franches 20cm', category_id: 5, purchase_price: 15.00, selling_price: 22.00, remaining_stock: 6, min_stock_level: 10, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  }
}

async function getCategories() {
  const data = await fs.readFile(CATEGORIES_FILE, 'utf8');
  return JSON.parse(data);
}

async function getProducts(search = '', category = 'all') {
  const products = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf8'));
  const categories = await getCategories();

  let filtered = products.map(product => {
    const cat = categories.find(c => c.id === product.category_id);
    return { ...product, category_name: cat?.name || 'Aucune' };
  });

  if (search) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
    );
  }

  if (category !== 'all') {
    filtered = filtered.filter(p => p.category_id === parseInt(category));
  }

  return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function saveProducts(products) {
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

exports.handler = async (event, context) => {
  await initializeData();

  const { httpMethod, path: requestPath, queryStringParameters, body } = event;
  const pathSegments = requestPath.split('/').filter(Boolean);
  const endpoint = pathSegments[pathSegments.length - 1] || pathSegments[pathSegments.length - 2];

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    // Categories endpoint
    if (endpoint === 'categories') {
      if (httpMethod === 'GET') {
        const categories = await getCategories();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, categories })
        };
      }
    }

    // Products endpoint
    if (endpoint === 'products') {
      if (httpMethod === 'GET') {
        const search = queryStringParameters?.search || '';
        const category = queryStringParameters?.category || 'all';
        const products = await getProducts(search, category);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, products })
        };
      }

      if (httpMethod === 'POST') {
        const productData = JSON.parse(body);
        const products = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf8'));
        const newId = Math.max(...products.map(p => p.id), 0) + 1;

        const newProduct = {
          ...productData,
          id: newId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        products.push(newProduct);
        await saveProducts(products);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, id: newId })
        };
      }

      if (httpMethod === 'PUT') {
        const productData = JSON.parse(body);
        const products = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf8'));
        const index = products.findIndex(p => p.id === productData.id);

        if (index !== -1) {
          products[index] = {
            ...productData,
            updated_at: new Date().toISOString()
          };
          await saveProducts(products);
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };
      }

      if (httpMethod === 'DELETE') {
        const id = parseInt(queryStringParameters?.id);
        const products = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf8'));
        const filtered = products.filter(p => p.id !== id);
        await saveProducts(filtered);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };
      }
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ success: false, error: 'Endpoint not found' })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
