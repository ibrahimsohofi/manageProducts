-- MySQL Database Setup for Inventory Manager
-- Create database
CREATE DATABASE IF NOT EXISTS inventory_manager
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE inventory_manager;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category_name (name)
) ENGINE=InnoDB;

-- Create products table
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
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_product_name (name),
  INDEX idx_product_category (category_id),
  INDEX idx_stock_level (remaining_stock, min_stock_level),
  FULLTEXT KEY idx_search_fulltext (name, description)
) ENGINE=InnoDB;

-- Insert sample categories
INSERT IGNORE INTO categories (name, description) VALUES
('Outils', 'Outils de bricolage et construction'),
('Électricité', 'Matériel électrique et éclairage'),
('Plomberie', 'Équipements de plomberie'),
('Peinture', 'Peintures et accessoires'),
('Jardinage', 'Outils et produits de jardinage');

-- Insert sample products
INSERT IGNORE INTO products (name, description, category_id, purchase_price, selling_price, remaining_stock, min_stock_level) VALUES
('Marteau 500g', 'Marteau à panne fendue 500g', 1, 25.00, 35.00, 15, 5),
('Tournevis cruciforme', 'Tournevis cruciforme PH2', 1, 8.00, 12.00, 25, 10),
('Ampoule LED 9W', 'Ampoule LED E27 9W blanc chaud', 2, 5.00, 8.50, 50, 20),
('Interrupteur simple', 'Interrupteur va-et-vient blanc', 2, 3.50, 6.00, 30, 15),
('Robinet mélangeur', 'Robinet mélangeur cuisine chromé', 3, 45.00, 75.00, 8, 5),
('Peinture blanc mat', 'Peinture acrylique blanc mat 2.5L', 4, 18.00, 28.00, 12, 5),
('Sécateur', 'Sécateur lames franches 20cm', 5, 15.00, 22.00, 6, 3);
