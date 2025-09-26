# Inventory Manager - Setup Guide

This is a modern inventory management application built with React, TypeScript, and Express.js. It supports both MySQL for production and SQLite for development environments.

## Features

- ✅ **Product Management**: Add, edit, delete, and search products
- ✅ **Image Upload**: Drag-and-drop image upload with preview
- ✅ **Category Management**: Organize products by categories
- ✅ **Stock Monitoring**: Track stock levels with low stock alerts
- ✅ **Multilingual Support**: French and Arabic localization
- ✅ **Responsive Design**: Works on desktop and mobile devices
- ✅ **Database Flexibility**: MySQL for production, SQLite for development

## Technologies Used

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- shadcn/ui components
- Tailwind CSS for styling
- React Hook Form with Zod validation
- i18next for internationalization

### Backend
- Express.js with TypeScript
- MySQL2 for production database
- SQLite3 for development fallback
- Multer for file uploads
- CORS for cross-origin requests

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-repo/inventory-manager.git
cd inventory-manager

# Install frontend dependencies
bun install

# Install backend dependencies
cd backend
bun install
cd ..
```

### 2. Development Setup (SQLite)

For development, the application uses SQLite by default:

```bash
# Backend will use SQLite automatically
cd backend
bun run dev

# In another terminal, start the frontend
cd ..
bun run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### 3. Production Setup (MySQL)

For production, configure MySQL:

#### 3.1 Install and Setup MySQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# macOS
brew install mysql

# Start MySQL service
sudo systemctl start mysql  # Linux
brew services start mysql   # macOS
```

#### 3.2 Create Database

```bash
# Log into MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE inventory_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'inventory_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON inventory_manager.* TO 'inventory_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Or run the provided setup script
mysql -u root -p < backend/database.sql
```

#### 3.3 Configure Environment Variables

Update `backend/.env`:

```env
PORT=5000

# Database Configuration
USE_MYSQL=true

# MySQL Database Configuration
DB_HOST=localhost
DB_USER=inventory_user
DB_PASSWORD=your_secure_password
DB_NAME=inventory_manager
DB_PORT=3306

# Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5000000
```

#### 3.4 Start Production Server

```bash
cd backend
npm start

# In another terminal
cd ..
npm run build
npm run preview
```

## Environment Variables

### Backend (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 5000 | No |
| `USE_MYSQL` | Use MySQL instead of SQLite | false | No |
| `DB_HOST` | MySQL host | localhost | Yes (if MySQL) |
| `DB_USER` | MySQL username | root | Yes (if MySQL) |
| `DB_PASSWORD` | MySQL password | - | Yes (if MySQL) |
| `DB_NAME` | Database name | inventory_manager | Yes (if MySQL) |
| `DB_PORT` | MySQL port | 3306 | No |
| `UPLOAD_DIR` | Upload directory | uploads | No |
| `MAX_FILE_SIZE` | Max file size in bytes | 5000000 | No |

## Database Schema

### Categories Table
```sql
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Products Table
```sql
CREATE TABLE products (
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
);
```

## API Endpoints

### Products
- `GET /api/products` - Get all products with optional search and category filter
- `POST /api/products` - Create a new product
- `PUT /api/products` - Update an existing product
- `DELETE /api/products?id={id}` - Delete a product

### Categories
- `GET /api/categories` - Get all categories

### File Upload
- `POST /api/upload` - Upload an image file
- `DELETE /api/upload` - Delete an uploaded image

### Health Check
- `GET /api/health` - Check database connectivity

## File Upload

The application supports image uploads with the following features:

- **Supported formats**: JPG, PNG, GIF
- **Maximum file size**: 5MB (configurable)
- **File validation**: Client and server-side validation
- **Automatic cleanup**: Images are deleted when products are removed
- **Preview**: Real-time image preview in the form

## Deployment

### Netlify (Recommended)

The application is configured for Netlify deployment:

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Enable serverless functions for the backend

### Docker

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## Development

### Frontend Development

```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run lint         # Run ESLint
bun run format       # Format code with Biome
```

### Backend Development

```bash
cd backend
bun run dev          # Start with nodemon
bun run start        # Start production server
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check if MySQL service is running
   - Verify credentials in `.env` file
   - Ensure database exists

2. **Image Upload Fails**
   - Check file size (max 5MB)
   - Verify upload directory permissions
   - Ensure supported file format

3. **CORS Errors**
   - Verify backend is running on port 5000
   - Check Vite proxy configuration

### SQLite Fallback

If MySQL is not available, the application automatically falls back to SQLite:

```bash
# Force SQLite mode
echo "USE_MYSQL=false" >> backend/.env
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
