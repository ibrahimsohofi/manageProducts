#!/bin/bash

# =================================================================
# DROGUERIE JAMAL - AUTOMATED MYSQL SETUP SCRIPT
# =================================================================
# This script automates the MySQL database setup for the Droguerie Jamal
# inventory management system.

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="droguerie_jamal_inventory"
DB_USER="droguerie_user"
DB_PASSWORD="droguerie_secure_2024"
MYSQL_ROOT_PASSWORD=""

echo -e "${BLUE}==================================================================${NC}"
echo -e "${BLUE}🏪 DROGUERIE JAMAL - MySQL Database Setup${NC}"
echo -e "${BLUE}==================================================================${NC}"
echo ""

# Check if MySQL is installed
check_mysql() {
    echo -e "${YELLOW}🔍 Checking MySQL installation...${NC}"

    if command -v mysql &> /dev/null; then
        echo -e "${GREEN}✅ MySQL client found${NC}"
        mysql --version
    else
        echo -e "${RED}❌ MySQL client not found${NC}"
        echo -e "${YELLOW}Please install MySQL first:${NC}"
        echo "  Ubuntu/Debian: sudo apt install mysql-server"
        echo "  CentOS/RHEL:   sudo yum install mysql-server"
        echo "  macOS:         brew install mysql"
        exit 1
    fi

    # Check if MySQL server is running
    if pgrep mysqld > /dev/null; then
        echo -e "${GREEN}✅ MySQL server is running${NC}"
    else
        echo -e "${YELLOW}⚠️  MySQL server not running. Starting...${NC}"
        if command -v systemctl &> /dev/null; then
            sudo systemctl start mysql || sudo systemctl start mysqld
        elif command -v service &> /dev/null; then
            sudo service mysql start
        else
            echo -e "${RED}❌ Cannot start MySQL automatically. Please start it manually.${NC}"
            exit 1
        fi
    fi
}

# Get MySQL root password
get_root_password() {
    echo ""
    echo -e "${YELLOW}🔐 MySQL Root Password${NC}"
    echo "Enter your MySQL root password (leave empty if no password):"
    read -s MYSQL_ROOT_PASSWORD
    echo ""
}

# Test MySQL connection
test_connection() {
    echo -e "${YELLOW}🔗 Testing MySQL connection...${NC}"

    if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
        mysql -u root -e "SELECT 1;" &> /dev/null
    else
        mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1;" &> /dev/null
    fi

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ MySQL connection successful${NC}"
    else
        echo -e "${RED}❌ Cannot connect to MySQL. Please check your password.${NC}"
        exit 1
    fi
}

# Create database and user
setup_database() {
    echo ""
    echo -e "${YELLOW}🗄️  Creating database and user...${NC}"

    MYSQL_CMD="mysql -u root"
    if [ ! -z "$MYSQL_ROOT_PASSWORD" ]; then
        MYSQL_CMD="$MYSQL_CMD -p$MYSQL_ROOT_PASSWORD"
    fi

    # Create database and user
    $MYSQL_CMD << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;

SELECT 'Database and user created successfully!' as status;
EOF

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database '$DB_NAME' created${NC}"
        echo -e "${GREEN}✅ User '$DB_USER' created${NC}"
    else
        echo -e "${RED}❌ Failed to create database or user${NC}"
        exit 1
    fi
}

# Import schema
import_schema() {
    echo ""
    echo -e "${YELLOW}📋 Importing database schema...${NC}"

    if [ -f "backend/setup-mysql-droguerie.sql" ]; then
        mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < backend/setup-mysql-droguerie.sql

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Schema imported successfully${NC}"
        else
            echo -e "${RED}❌ Failed to import schema${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Schema file not found: backend/setup-mysql-droguerie.sql${NC}"
        exit 1
    fi
}

# Update environment file
update_env() {
    echo ""
    echo -e "${YELLOW}⚙️  Updating environment configuration...${NC}"

    ENV_FILE="backend/.env"

    if [ -f "$ENV_FILE" ]; then
        # Backup original .env
        cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"

        # Update USE_MYSQL to true
        sed -i 's/USE_MYSQL=false/USE_MYSQL=true/g' "$ENV_FILE"

        echo -e "${GREEN}✅ Environment file updated${NC}"
        echo -e "${BLUE}💾 Original .env backed up${NC}"
    else
        echo -e "${RED}❌ Environment file not found: $ENV_FILE${NC}"
        exit 1
    fi
}

# Verify setup
verify_setup() {
    echo ""
    echo -e "${YELLOW}🔍 Verifying database setup...${NC}"

    # Test database connection
    mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES;" > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database connection verified${NC}"

        # Count tables and records
        TABLES=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES;" | wc -l)
        CATEGORIES=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT COUNT(*) FROM categories;" | tail -n 1)
        PRODUCTS=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT COUNT(*) FROM products;" | tail -n 1)

        echo -e "${BLUE}📊 Database Statistics:${NC}"
        echo "   - Tables created: $((TABLES - 1))"
        echo "   - Categories: $CATEGORIES"
        echo "   - Sample products: $PRODUCTS"
    else
        echo -e "${RED}❌ Database verification failed${NC}"
        exit 1
    fi
}

# Install Node.js dependencies
install_dependencies() {
    echo ""
    echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"

    if [ -f "package.json" ]; then
        if command -v bun &> /dev/null; then
            echo -e "${BLUE}Using Bun package manager${NC}"
            bun install
        elif command -v npm &> /dev/null; then
            echo -e "${BLUE}Using npm package manager${NC}"
            npm install
        else
            echo -e "${RED}❌ No package manager found (npm/bun)${NC}"
            exit 1
        fi

        echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
    fi

    if [ -f "backend/package.json" ]; then
        cd backend
        if command -v bun &> /dev/null; then
            bun install
        else
            npm install
        fi
        cd ..
        echo -e "${GREEN}✅ Backend dependencies installed${NC}"
    fi
}

# Start the application
start_application() {
    echo ""
    echo -e "${YELLOW}🚀 Starting the application...${NC}"
    echo -e "${BLUE}Backend will start on: http://localhost:5000${NC}"
    echo -e "${BLUE}Frontend will start on: http://localhost:5173${NC}"
    echo ""
    echo -e "${YELLOW}To start the application manually:${NC}"
    echo "1. Backend:  cd backend && npm run dev"
    echo "2. Frontend: npm run dev"
    echo ""

    read -p "Start the application now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}🚀 Starting backend server...${NC}"
        cd backend
        npm run dev &
        BACKEND_PID=$!
        cd ..

        sleep 3

        echo -e "${GREEN}🚀 Starting frontend server...${NC}"
        npm run dev &
        FRONTEND_PID=$!

        echo ""
        echo -e "${GREEN}✅ Application started successfully!${NC}"
        echo -e "${BLUE}Backend PID: $BACKEND_PID${NC}"
        echo -e "${BLUE}Frontend PID: $FRONTEND_PID${NC}"
        echo ""
        echo -e "${YELLOW}Press Ctrl+C to stop the servers${NC}"

        # Wait for both processes
        wait $BACKEND_PID $FRONTEND_PID
    fi
}

# Main execution
main() {
    echo -e "${GREEN}Starting Droguerie Jamal MySQL setup...${NC}"
    echo ""

    check_mysql
    get_root_password
    test_connection
    setup_database
    import_schema
    update_env
    verify_setup
    install_dependencies

    echo ""
    echo -e "${GREEN}==================================================================${NC}"
    echo -e "${GREEN}🎉 SETUP COMPLETED SUCCESSFULLY!${NC}"
    echo -e "${GREEN}==================================================================${NC}"
    echo ""
    echo -e "${BLUE}📋 Configuration Summary:${NC}"
    echo "   Database: $DB_NAME"
    echo "   User: $DB_USER"
    echo "   Host: localhost:3306"
    echo "   Environment: backend/.env updated"
    echo ""
    echo -e "${BLUE}🔗 Connection Details:${NC}"
    echo "   mysql -u $DB_USER -p $DB_NAME"
    echo ""

    start_application
}

# Error handling
trap 'echo -e "\n${RED}❌ Setup interrupted. Please check the error above.${NC}"; exit 1' INT TERM

# Run main function
main

echo ""
echo -e "${GREEN}✅ Droguerie Jamal is ready to use with MySQL!${NC}"
echo -e "${BLUE}🏪 Happy inventory management!${NC}"
