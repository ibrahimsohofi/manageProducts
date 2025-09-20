# 🗄️ MySQL Database Setup for Droguerie Jamal

This guide will help you set up MySQL as the main database for the Droguerie Jamal inventory management system.

## 📋 Prerequisites

- MySQL Server 8.0 or higher
- Administrative access to MySQL
- Node.js environment with the project dependencies installed

## 🚀 Quick Setup (Production Ready)

### 1. Install MySQL Server

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

#### CentOS/RHEL:
```bash
sudo yum install mysql-server
sudo systemctl start mysqld
sudo mysql_secure_installation
```

#### macOS (with Homebrew):
```bash
brew install mysql
brew services start mysql
```

#### Windows:
Download MySQL Installer from [MySQL official website](https://dev.mysql.com/downloads/installer/)

### 2. Create Database and User

Connect to MySQL as root:
```bash
mysql -u root -p
```

Run the setup script:
```sql
-- Create the database
CREATE DATABASE IF NOT EXISTS droguerie_jamal_inventory
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated user
CREATE USER IF NOT EXISTS 'droguerie_user'@'localhost' IDENTIFIED BY 'droguerie_secure_2024';
GRANT ALL PRIVILEGES ON droguerie_jamal_inventory.* TO 'droguerie_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Import Database Schema

From the project directory:
```bash
cd backend
mysql -u droguerie_user -p droguerie_jamal_inventory < setup-mysql-droguerie.sql
```

### 4. Update Environment Variables

Update `backend/.env`:
```env
# Enable MySQL
USE_MYSQL=true

# MySQL Configuration
DB_HOST=localhost
DB_USER=droguerie_user
DB_PASSWORD=droguerie_secure_2024
DB_NAME=droguerie_jamal_inventory
DB_PORT=3306
```

### 5. Start the Application

```bash
# Start backend
cd backend
npm run dev

# Start frontend (in another terminal)
cd ..
npm run dev
```

## 🏗️ Database Schema Overview

### Core Tables

#### Categories Table
- **Multilingual support**: Arabic, French, English names
- **Hardware store categories**: Droguerie, Sanitaire, Peinture, Quincaillerie, Outillage, Électricité
- **Color coding** for UI representation

#### Products Table
- **Multilingual product names and descriptions**
- **Comprehensive inventory tracking**: purchase/selling prices, stock levels
- **Hardware-specific fields**: SKU, barcode, brand, supplier, warranty
- **Physical properties**: weight, dimensions, unit of measure

#### Stock Movements Table
- **Complete audit trail** of inventory changes
- **Movement types**: IN, OUT, ADJUSTMENT
- **Reference tracking** for invoices and orders

### Advanced Features

#### Database Views
- **Low Stock Alert View**: Automatically identifies products needing reorder
- **Inventory Value by Category**: Financial reporting by category

#### Performance Optimization
- **Strategic indexes** for fast searching and filtering
- **Multilingual text search** optimization
- **Stock level monitoring** indexes

## 🔧 Configuration Options

### Connection Pool Settings
The application uses connection pooling for optimal performance:

```javascript
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'droguerie_user',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'droguerie_jamal_inventory',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
```

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `USE_MYSQL` | Enable MySQL (vs SQLite fallback) | false | Yes |
| `DB_HOST` | MySQL server hostname | localhost | Yes |
| `DB_USER` | Database username | droguerie_user | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `DB_NAME` | Database name | droguerie_jamal_inventory | Yes |
| `DB_PORT` | MySQL port | 3306 | No |

## 🐳 Docker Setup (Alternative)

For containerized deployment:

```yaml
# docker-compose.yml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password_here
      MYSQL_DATABASE: droguerie_jamal_inventory
      MYSQL_USER: droguerie_user
      MYSQL_PASSWORD: droguerie_secure_2024
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./backend/setup-mysql-droguerie.sql:/docker-entrypoint-initdb.d/setup.sql

volumes:
  mysql_data:
```

Start with Docker:
```bash
docker-compose up -d
```

## 🔍 Verification

### Check Database Connection
```bash
# Test MySQL connection
mysql -u droguerie_user -p -h localhost droguerie_jamal_inventory

# Verify tables
SHOW TABLES;

# Check sample data
SELECT c.name, COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.id, c.name;
```

### Test Application API
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test categories
curl http://localhost:5000/api/categories

# Test products
curl http://localhost:5000/api/products
```

## 🛠️ Maintenance

### Backup Database
```bash
mysqldump -u droguerie_user -p droguerie_jamal_inventory > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Monitor Performance
```sql
-- Check slow queries
SELECT * FROM information_schema.processlist WHERE time > 10;

-- View table sizes
SELECT
    table_name AS 'Table',
    round(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'droguerie_jamal_inventory'
ORDER BY (data_length + index_length) DESC;
```

### Update Schema
```bash
# Apply schema updates
mysql -u droguerie_user -p droguerie_jamal_inventory < updates/schema_update_v2.sql
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Refused**
   ```bash
   sudo systemctl status mysql
   sudo systemctl start mysql
   ```

2. **Access Denied**
   - Verify username/password in `.env`
   - Check user privileges: `SHOW GRANTS FOR 'droguerie_user'@'localhost';`

3. **Database Not Found**
   ```sql
   CREATE DATABASE droguerie_jamal_inventory;
   ```

4. **Port Conflicts**
   - Change port in `.env`: `DB_PORT=3307`
   - Update MySQL config: `/etc/mysql/mysql.conf.d/mysqld.cnf`

### Log Analysis
```bash
# MySQL error log
sudo tail -f /var/log/mysql/error.log

# Application logs
npm run dev --verbose
```

## 📈 Performance Tuning

### MySQL Configuration
Add to `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
# Hardware store optimizations
innodb_buffer_pool_size = 512M
innodb_log_file_size = 128M
max_connections = 100
query_cache_type = 1
query_cache_size = 64M

# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
```

### Index Optimization
```sql
-- Analyze table usage
ANALYZE TABLE products, categories, stock_movements;

-- Check index usage
SHOW INDEX FROM products;
```

---

🎯 **Your Droguerie Jamal MySQL database is now ready for production!**

For support, check the application logs or contact the development team.
