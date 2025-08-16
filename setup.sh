#!/bin/bash

echo "🚀 Setting up Lexocrates Blog Admin Panel..."
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "❌ MongoDB is not installed. Please install MongoDB v4.4 or higher."
    exit 1
fi

echo "✅ Node.js and MongoDB are installed"

# Backend Setup
echo ""
echo "📦 Setting up Backend..."
cd admin-backend

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
else
    echo "✅ .env file already exists"
fi

# Create uploads directory
mkdir -p uploads

cd ..

# Frontend Setup
echo ""
echo "📦 Setting up Frontend..."
cd admin-frontend

# Install dependencies
echo "Installing frontend dependencies..."
npm install

cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit admin-backend/.env with your configuration"
echo "2. Start MongoDB: mongod"
echo "3. Start backend: cd admin-backend && npm run dev"
echo "4. Start frontend: cd admin-frontend && npm start"
echo ""
echo "🌐 Access the admin panel at: http://localhost:3000"
echo "🔑 Default credentials: admin@lexocrates.com / admin123"
echo ""
echo "📚 For more information, see README.md"
