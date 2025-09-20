const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs").promises;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// MySQL setup
const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "inventory_manager",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool;

// Initialize MySQL connection pool
try {
  pool = mysql.createPool(dbConfig);
} catch (error) {
  console.error("Failed to create MySQL connection pool:", error);
  process.exit(1);
}

// Database operations
const dbQuery = {
  async execute(query, params = []) {
    try {
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error("Database query error:", error);
      throw error;
    }
  },

  async getConnection() {
    return await pool.getConnection();
  },

  releaseConnection(connection) {
    if (connection) {
      connection.release();
    }
  },
};

// Initialize database
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log("Connected to MySQL database");

    // Create tables with MySQL syntax
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INT,
        purchase_price DECIMAL(10,2) NOT NULL,
        selling_price DECIMAL(10,2) NOT NULL,
        remaining_stock INT DEFAULT 0,
        min_stock_level INT DEFAULT 10,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    connection.release();
    console.log("Database tables created successfully");

  } catch (error) {
    console.error("Database initialization error:", error);
    console.error(
      "Please ensure MySQL is running and accessible with the provided credentials"
    );
    process.exit(1);
  }
}



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
        database: process.env.DB_NAME || "inventory_manager",
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

// Start server
async function startServer() {
  await ensureUploadsDir();
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Database mode: MySQL`);
    console.log(
      `MySQL Database: ${process.env.DB_NAME || "inventory_manager"} on ${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 3306}`
    );
  });
}

startServer();
