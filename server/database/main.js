// Main database setup file for easy execution in DB Browser for SQLite
// Copy and paste these queries directly into DB Browser for SQLite

-- Drop existing tables if they exist (optional - for fresh setup)
-- DROP TABLE IF EXISTS ai_chat_history;
-- DROP TABLE IF EXISTS order_items;
-- DROP TABLE IF EXISTS orders;
-- DROP TABLE IF EXISTS bookings;
-- DROP TABLE IF EXISTS table_images;
-- DROP TABLE IF EXISTS food_items;
-- DROP TABLE IF EXISTS restaurants;
-- DROP TABLE IF EXISTS logged_in_users;
-- DROP TABLE IF EXISTS otp_verification;
-- DROP TABLE IF EXISTS signed_up_users;

-- Create signed_up_users table (includes customers, admins, superadmins)
CREATE TABLE IF NOT EXISTS signed_up_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    mobile_number TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

-- Create logged_in_users table (session tracking for all login activities)
CREATE TABLE IF NOT EXISTS logged_in_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    email TEXT NOT NULL,
    login_method TEXT NOT NULL,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    logout_time DATETIME,
    session_token TEXT,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES signed_up_users (id)
);

-- Create restaurants table (with admin credentials)
CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cuisine TEXT NOT NULL,
    rating REAL DEFAULT 4.5,
    image TEXT,
    address TEXT,
    phone TEXT,
    description TEXT,
    admin_login_id TEXT UNIQUE NOT NULL,
    admin_password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create food_items table
CREATE TABLE IF NOT EXISTS food_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    image TEXT,
    dietary TEXT,
    chef_special BOOLEAN DEFAULT 0,
    available BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    restaurant_id INTEGER,
    order_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    total_amount REAL NOT NULL,
    scheduled_time TEXT,
    special_instructions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES signed_up_users (id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    food_item_id INTEGER,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (food_item_id) REFERENCES food_items (id)
);

-- Create table_images table
CREATE TABLE IF NOT EXISTS table_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER,
    table_type TEXT NOT NULL,
    image_path TEXT NOT NULL,
    image_name TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
);

-- Create bookings table (updated structure)
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    restaurant_id INTEGER,
    table_type TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    guests INTEGER NOT NULL,
    special_requests TEXT,
    status TEXT DEFAULT 'confirmed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES signed_up_users (id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
);

-- Create otp_verification table (for OTP-based login)
CREATE TABLE IF NOT EXISTS otp_verification (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mobile_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT 0
);

-- Create ai_chat_history table
CREATE TABLE IF NOT EXISTS ai_chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    context TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES signed_up_users (id)
);

-- Insert sample data

-- Insert super admin user (password: superadmin2025)
INSERT OR IGNORE INTO signed_up_users (full_name, email, mobile_number, password_hash, role) VALUES
('Platform Owner', 'owner@restaurantai.com', '+1234567890', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin');

-- Insert sample restaurants with admin login credentials
-- Restaurant 1: Login ID: GS001, Password: admin123
-- Restaurant 2: Login ID: SS002, Password: admin456  
-- Restaurant 3: Login ID: MI003, Password: admin789
INSERT OR IGNORE INTO restaurants (id, name, cuisine, rating, image, address, phone, description, admin_login_id, admin_password_hash) VALUES
(1, 'The Golden Spoon', 'Fine Dining', 4.8, 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg', '123 Gourmet Street, Downtown', '+1 (555) 123-4567', 'Exquisite fine dining experience with contemporary cuisine', 'GS001', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(2, 'Sakura Sushi', 'Japanese', 4.6, 'https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg', '456 Zen Garden Ave, Midtown', '+1 (555) 234-5678', 'Authentic Japanese cuisine with fresh sushi and sashimi', 'SS002', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(3, 'Mama''s Italian', 'Italian', 4.7, 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg', '789 Pasta Lane, Little Italy', '+1 (555) 345-6789', 'Traditional Italian flavors in a cozy family atmosphere', 'MI003', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Insert sample food items
INSERT OR IGNORE INTO food_items (restaurant_id, name, category, price, description, image, dietary, chef_special) VALUES
-- The Golden Spoon items
(1, 'Wagyu Beef Tenderloin', 'Mains', 89.99, 'Premium wagyu beef with truffle sauce and seasonal vegetables', 'https://images.pexels.com/photos/361184/asparagus-steak-veal-steak-veal-361184.jpeg', 'gluten-free', 1),
(1, 'Pan-Seared Salmon', 'Mains', 32.99, 'Fresh Atlantic salmon with lemon herb butter and quinoa', 'https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg', 'gluten-free,healthy', 0),
(1, 'Truffle Arancini', 'Starters', 18.99, 'Crispy risotto balls with black truffle and parmesan', 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg', 'vegetarian', 0),
(1, 'Lobster Thermidor', 'Mains', 65.99, 'Fresh lobster with creamy cognac sauce and herbs', 'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg', 'gluten-free', 0),
(1, 'Chocolate Soufflé', 'Desserts', 16.99, 'Warm chocolate soufflé with vanilla ice cream', 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg', 'vegetarian', 0),

-- Sakura Sushi items
(2, 'Sashimi Platter', 'Sashimi', 45.99, 'Fresh selection of tuna, salmon, and yellowtail', 'https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg', 'gluten-free,healthy', 0),
(2, 'Dragon Roll', 'Sushi', 18.99, 'Eel and cucumber topped with avocado and eel sauce', 'https://images.pexels.com/photos/2098085/pexels-photo-2098085.jpeg', '', 0),
(2, 'Miso Soup', 'Starters', 6.99, 'Traditional soybean paste soup with tofu and seaweed', 'https://images.pexels.com/photos/5409751/pexels-photo-5409751.jpeg', 'vegetarian,healthy', 0),

-- Mama's Italian items
(3, 'Margherita Pizza', 'Pizza', 22.99, 'Fresh mozzarella, tomato sauce, and basil', 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg', 'vegetarian', 0),
(3, 'Fettuccine Alfredo', 'Pasta', 19.99, 'Creamy parmesan sauce with fresh fettuccine', 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg', 'vegetarian', 0),
(3, 'Tiramisu', 'Desserts', 12.99, 'Classic Italian dessert with coffee and mascarpone', 'https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg', 'vegetarian', 0);

-- Login Credentials Summary:
-- Super Admin: Email: owner@restaurantai.com, Password: superadmin2025, Security Code: 777888
-- Restaurant Admins:
--   The Golden Spoon: Login ID: GS001, Password: admin123
--   Sakura Sushi: Login ID: SS002, Password: admin456
--   Mama's Italian: Login ID: MI003, Password: admin789