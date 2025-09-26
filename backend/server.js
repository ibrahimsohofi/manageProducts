const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs").promises;
const mysql = require("mysql2/promise");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// MySQL setup
let pool;

// Initialize MySQL connection pool
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'droguerie_jamal_inventory',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  console.log('MySQL connection pool created');
} catch (error) {
  console.error("Failed to create MySQL connection pool:", error);
  process.exit(1);
}

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Create categories table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        name_ar VARCHAR(255),
        name_fr VARCHAR(255),
        description TEXT,
        description_ar TEXT,
        description_fr TEXT,
        icon VARCHAR(50),
        color VARCHAR(7) DEFAULT '#0f766e',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category_name (name)
      ) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create products table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        name_ar VARCHAR(255),
        name_fr VARCHAR(255),
        description TEXT,
        description_ar TEXT,
        description_fr TEXT,
        category_id INT,
        purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        selling_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        remaining_stock INT DEFAULT 0,
        min_stock_level INT DEFAULT 10,
        max_stock_level INT DEFAULT 1000,
        unit VARCHAR(50) DEFAULT 'piece',
        barcode VARCHAR(100),
        sku VARCHAR(100),
        brand VARCHAR(100),
        supplier VARCHAR(255),
        location VARCHAR(255),
        weight DECIMAL(8,2),
        dimensions VARCHAR(100),
        image_url VARCHAR(500),
        warranty_months INT DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        is_featured BOOLEAN DEFAULT 0,
        tags TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX idx_product_name (name),
        INDEX idx_product_category (category_id),
        INDEX idx_stock_level (remaining_stock, min_stock_level),
        FULLTEXT KEY idx_search_fulltext (name, description)
      ) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create stock_movements table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        movement_type ENUM('IN', 'OUT', 'ADJUSTMENT') NOT NULL,
        quantity INT NOT NULL,
        reason VARCHAR(255),
        reference_number VARCHAR(100),
        notes TEXT,
        created_by VARCHAR(100) DEFAULT 'system',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_product_movement (product_id),
        INDEX idx_movement_date (created_at)
      ) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Insert default categories if they don't exist
    const defaultCategories = [
      {
        name: 'Droguerie',
        name_ar: 'مواد كيميائية',
        name_fr: 'Droguerie',
        description: 'Hardware chemicals, adhesives, sealants, and specialized compounds',
        icon: '🧪',
        color: '#0f766e'
      },
      {
        name: 'Sanitaire',
        name_ar: 'صحي',
        name_fr: 'Sanitaire',
        description: 'Plumbing fixtures, pipes, faucets, water heaters, bathroom accessories',
        icon: '🚿',
        color: '#3b82f6'
      },
      {
        name: 'Peinture',
        name_ar: 'دهان',
        name_fr: 'Peinture',
        description: 'Paints, primers, brushes, rollers, painting accessories and tools',
        icon: '🎨',
        color: '#ea580c'
      },
      {
        name: 'Quincaillerie',
        name_ar: 'أدوات معدنية',
        name_fr: 'Quincaillerie',
        description: 'Hardware fasteners, screws, bolts, nuts, hinges, locks, and metal components',
        icon: '🔩',
        color: '#f59e0b'
      },
      {
        name: 'Outillage',
        name_ar: 'أدوات',
        name_fr: 'Outillage',
        description: 'Hand tools, power tools, measuring equipment, safety gear, and workshop tools',
        icon: '🔨',
        color: '#dc2626'
      },
      {
        name: 'Électricité',
        name_ar: 'كهرباء',
        name_fr: 'Électricité',
        description: 'Electrical components, wiring, switches, outlets, lighting fixtures, and electrical tools',
        icon: '⚡',
        color: '#eab308'
      }
    ];

    for (const category of defaultCategories) {
      await pool.execute(`
        INSERT IGNORE INTO categories (name, name_ar, name_fr, description, icon, color)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [category.name, category.name_ar, category.name_fr, category.description, category.icon, category.color]);
    }

    // Insert sample products if they don't exist
    const [countResult] = await pool.execute("SELECT COUNT(*) as count FROM products");
    const productCount = countResult[0].count;

    if (productCount === 0) {
      const sampleProducts = [
        {
          name: 'Colle PVC forte',
          name_ar: 'غراء PVC قوي',
          name_fr: 'Colle PVC forte',
          description: 'High-strength PVC pipe adhesive for plumbing installations',
          category_id: 1,
          purchase_price: 25.00,
          selling_price: 35.00,
          remaining_stock: 50,
          min_stock_level: 10,
          unit: 'tube',
          brand: 'Bostik',
          barcode: '3259190015401',
          sku: 'DRG-PVC-001'
        },
        {
          name: 'Robinet mélangeur',
          name_ar: 'حنفية خلط',
          name_fr: 'Robinet mélangeur',
          description: 'Chrome mixer tap for kitchen and bathroom',
          category_id: 2,
          purchase_price: 150.00,
          selling_price: 220.00,
          remaining_stock: 25,
          min_stock_level: 5,
          unit: 'piece',
          brand: 'Grohe',
          barcode: '4005176405101',
          sku: 'SAN-TAP-001'
        },
        {
          name: 'Peinture murale blanche 10L',
          name_ar: 'طلاء حائط أبيض 10 لتر',
          name_fr: 'Peinture murale blanche 10L',
          description: 'White wall paint 10 liters for interior walls',
          category_id: 3,
          purchase_price: 180.00,
          selling_price: 250.00,
          remaining_stock: 40,
          min_stock_level: 10,
          unit: 'bucket',
          brand: 'Dulux',
          barcode: '5012345605104',
          sku: 'PEI-WAL-001'
        },
        {
          name: 'Vis à bois 4x40mm',
          name_ar: 'مسامير خشب 4×40 مم',
          name_fr: 'Vis à bois 4x40mm',
          description: 'Wood screws 4x40mm for carpentry work',
          category_id: 4,
          purchase_price: 0.25,
          selling_price: 0.45,
          remaining_stock: 2000,
          min_stock_level: 500,
          unit: 'piece',
          brand: 'Spax',
          barcode: '4003530805107',
          sku: 'QUI-SCR-001'
        },
        {
          name: 'Perceuse visseuse 18V',
          name_ar: 'مثقاب لاسلكي 18 فولت',
          name_fr: 'Perceuse visseuse 18V',
          description: 'Cordless drill 18V with battery and charger',
          category_id: 5,
          purchase_price: 280.00,
          selling_price: 420.00,
          remaining_stock: 12,
          min_stock_level: 3,
          unit: 'piece',
          brand: 'Makita',
          barcode: '8888395805110',
          sku: 'OUT-DRI-001'
        },
        {
          name: 'Câble électrique 2.5mm²',
          name_ar: 'كابل كهربائي 2.5 مم²',
          name_fr: 'Câble électrique 2.5mm²',
          description: 'Electrical cable 2.5mm² for power installations',
          category_id: 6,
          purchase_price: 8.50,
          selling_price: 12.00,
          remaining_stock: 200,
          min_stock_level: 50,
          unit: 'meter',
          brand: 'Nexans',
          barcode: '1234567805113',
          sku: 'ELE-CAB-001'
        }
      ];

      for (const product of sampleProducts) {
        await pool.execute(`
          INSERT INTO products (name, name_ar, name_fr, description, category_id, purchase_price,
                               selling_price, remaining_stock, min_stock_level, unit, brand, barcode, sku)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          product.name, product.name_ar, product.name_fr, product.description,
          product.category_id, product.purchase_price, product.selling_price,
          product.remaining_stock, product.min_stock_level, product.unit,
          product.brand, product.barcode, product.sku
        ]);
      }

      console.log('Sample data inserted successfully');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Database operations helper
const dbQuery = {
  async execute(query, params = []) {
    try {
      const [rows, fields] = await pool.execute(query, params);

      // For INSERT queries, return insertId and affectedRows
      if (query.trim().toUpperCase().startsWith('INSERT')) {
        return { insertId: rows.insertId, changes: rows.affectedRows };
      }

      // For UPDATE/DELETE queries, return changes/affectedRows
      if (query.trim().toUpperCase().startsWith('UPDATE') || query.trim().toUpperCase().startsWith('DELETE')) {
        return { changes: rows.affectedRows };
      }

      // For SELECT queries, return the rows
      return rows;
    } catch (error) {
      console.error("Database query error:", error);
      throw error;
    }
  }
};

// Ensure uploads directory exists
async function ensureUploadsDir() {
  try {
    await fs.access("uploads");
  } catch {
    await fs.mkdir("uploads", { recursive: true });
  }
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `../public/uploads/`);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5000000, // 5MB default
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// API Routes

// Get all categories
app.get("/api/categories", async (req, res) => {
  try {
    const rows = await dbQuery.execute(
      "SELECT * FROM categories ORDER BY name"
    );
    res.json({ success: true, categories: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single product by ID
app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return res.status(400).json({ success: false, error: "Invalid product ID" });
    }

    const rows = await dbQuery.execute(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [productId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    res.json({ success: true, product: rows[0] });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all products with optional filtering and pagination
app.get("/api/products", async (req, res) => {
  try {
    const {
      search = "",
      category = "all",
      page = "1",
      limit = "50",
      sortBy = "created_at",
      sortOrder = "DESC"
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
    const offset = (pageNum - 1) * limitNum;

    // Build the base query
    let baseQuery = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;

    // Build count query for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      WHERE 1=1
    `;

    const params = [];
    const countParams = [];

    // Add search filters
    if (search) {
      const searchCondition = " AND (p.name LIKE ? OR p.description LIKE ?)";
      baseQuery += searchCondition;
      countQuery += searchCondition;
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    // Add category filter
    if (category !== "all") {
      const categoryCondition = " AND p.category_id = ?";
      baseQuery += categoryCondition;
      countQuery += categoryCondition;
      params.push(category);
      countParams.push(category);
    }

    // Add sorting and pagination
    const validSortColumns = ['name', 'created_at', 'updated_at', 'remaining_stock', 'selling_price'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    baseQuery += ` ORDER BY p.${sortColumn} ${order} LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    // Execute both queries
    const [products, countResult] = await Promise.all([
      dbQuery.execute(baseQuery, params),
      dbQuery.execute(countQuery, countParams)
    ]);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      products,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add new product
app.post("/api/products", async (req, res) => {
  try {
    const {
      name,
      description,
      category_id,
      purchase_price,
      selling_price,
      remaining_stock,
      min_stock_level,
      image_url,
    } = req.body;

    const result = await dbQuery.execute(
      `
      INSERT INTO products (name, description, category_id, purchase_price, selling_price, remaining_stock, min_stock_level, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        name,
        description,
        category_id,
        purchase_price,
        selling_price,
        remaining_stock,
        min_stock_level || 10,
        image_url || null,
      ]
    );

    const insertId = result.insertId;
    res.json({ success: true, id: insertId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update product
app.put("/api/products", async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      category_id,
      purchase_price,
      selling_price,
      remaining_stock,
      min_stock_level,
      image_url,
    } = req.body;

    const updateQuery = `UPDATE products SET name = ?, description = ?, category_id = ?, purchase_price = ?, selling_price = ?, remaining_stock = ?, min_stock_level = ?, image_url = ? WHERE id = ?`;

    await dbQuery.execute(updateQuery, [
      name,
      description,
      category_id,
      purchase_price,
      selling_price,
      remaining_stock,
      min_stock_level,
      image_url,
      id,
    ]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete product
app.delete("/api/products", async (req, res) => {
  try {
    const { id } = req.query;

    // Get the product to check if it has an image
    const products = await dbQuery.execute(
      "SELECT image_url FROM products WHERE id = ?",
      [id]
    );

    if (products.length > 0 && products[0].image_url) {
      try {
        const imagePath = path.join(__dirname, products[0].image_url);
        await fs.unlink(imagePath);
      } catch (unlinkError) {
        console.error("Error deleting image file:", unlinkError);
      }
    }

    await dbQuery.execute("DELETE FROM products WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// File upload endpoint
app.post("/api/upload", upload.single("image"), (req, res) => {

  if (!req.file) {
    return res.status(400).json({ success: false, error: "No file uploaded" });
  }

  imageUrl =`/uploads/${req.file.filename}`
  console.log(imageUrl)
  res.json({ success: true, imageUrl });
});

// Delete uploaded image
app.delete("/api/upload", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (imageUrl) {
      const imagePath = path.join(__dirname, imageUrl);
      await fs.unlink(imagePath);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json({
      success: true,
      message: "MySQL database connected successfully",
      database: "MySQL",
      config: {
        host: process.env.DB_HOST || "localhost",
        database: process.env.DB_NAME || "droguerie_jamal_inventory",
        port: process.env.DB_PORT || 3306,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Database connection failed",
      details: error.message,
    });
  }
});

// Test MySQL connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ MySQL connection successful');
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    console.error('\n📋 MySQL Setup Required:');
    console.error('1. Install MySQL server');
    console.error('2. Start MySQL service');
    console.error('3. Create database: CREATE DATABASE droguerie_jamal_inventory;');
    console.error('4. Update .env file with correct MySQL credentials');
    console.error('5. Restart the application\n');
    return false;
  }
}

// Start server
async function startServer() {
  try {
    await ensureUploadsDir();

    // Test MySQL connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('Server cannot start without MySQL connection');
      process.exit(1);
    }

    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🗄️  Database mode: MySQL`);
      console.log(`📊 MySQL Database: ${process.env.DB_NAME || "droguerie_jamal_inventory"}`);
      console.log(`🌐 MySQL Host: ${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 3306}`);
      console.log(`\n🔗 API Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
