const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Create all necessary tables
const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Signed up users table
      db.run(`
        CREATE TABLE IF NOT EXISTS signed_up_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          full_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          mobile_number TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT DEFAULT 'customer',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT 1
        )
      `);

      // Logged in users table (session tracking)
      db.run(`
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
        )
      `);

      // Restaurants table
      db.run(`
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
        )
      `);

      // Food items table
      db.run(`
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
        )
      `);

      // Orders table
      db.run(`
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
        )
      `);

      // Order items table
      db.run(`
        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER,
          food_item_id INTEGER,
          quantity INTEGER NOT NULL,
          price REAL NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders (id),
          FOREIGN KEY (food_item_id) REFERENCES food_items (id)
        )
      `);

      // Table images table
      db.run(`
        CREATE TABLE IF NOT EXISTS table_images (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          restaurant_id INTEGER,
          table_type TEXT NOT NULL,
          image_path TEXT NOT NULL,
          image_name TEXT NOT NULL,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT 1,
          FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
        )
      `);

      // Bookings table
      db.run(`
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
        )
      `);

      // OTP verification table
      db.run(`
        CREATE TABLE IF NOT EXISTS otp_verification (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mobile_number TEXT NOT NULL,
          otp_code TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NOT NULL,
          is_used BOOLEAN DEFAULT 0
        )
      `);

      console.log('All tables created successfully');
      resolve();
    });
  });
};

// Insert sample data
const insertSampleData = async () => {
  try {
    // Hash passwords
    const adminPassword1 = await bcrypt.hash('admin123', 10);
    const adminPassword2 = await bcrypt.hash('admin456', 10);
    const adminPassword3 = await bcrypt.hash('admin789', 10);
    const superAdminPassword = await bcrypt.hash('superadmin2025', 10);

    // Insert sample restaurants with admin credentials
    db.run(`
      INSERT OR IGNORE INTO restaurants (id, name, cuisine, rating, image, address, phone, description, admin_login_id, admin_password_hash) VALUES
      (1, 'The Golden Spoon', 'Fine Dining', 4.8, 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg', '123 Gourmet Street, Downtown', '+1 (555) 123-4567', 'Exquisite fine dining experience with contemporary cuisine', 'GS001', ?),
      (2, 'Sakura Sushi', 'Japanese', 4.6, 'https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg', '456 Zen Garden Ave, Midtown', '+1 (555) 234-5678', 'Authentic Japanese cuisine with fresh sushi and sashimi', 'SS002', ?),
      (3, 'Mama''s Italian', 'Italian', 4.7, 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg', '789 Pasta Lane, Little Italy', '+1 (555) 345-6789', 'Traditional Italian flavors in a cozy family atmosphere', 'MI003', ?)
    `, [adminPassword1, adminPassword2, adminPassword3]);

    // Insert super admin user
    db.run(`
      INSERT OR IGNORE INTO signed_up_users (full_name, email, mobile_number, password_hash, role) VALUES
      ('Platform Owner', 'owner@restaurantai.com', '+1234567890', ?, 'superadmin')
    `, [superAdminPassword]);

    // Insert sample food items
    const sampleFoodItems = [
      [1, 'Wagyu Beef Tenderloin', 'Mains', 89.99, 'Premium wagyu beef with truffle sauce and seasonal vegetables', 'https://images.pexels.com/photos/361184/asparagus-steak-veal-steak-veal-361184.jpeg', 'gluten-free', 1],
      [1, 'Pan-Seared Salmon', 'Mains', 32.99, 'Fresh Atlantic salmon with lemon herb butter and quinoa', 'https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg', 'gluten-free,healthy', 0],
      [1, 'Truffle Arancini', 'Starters', 18.99, 'Crispy risotto balls with black truffle and parmesan', 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg', 'vegetarian', 0],
      [2, 'Sashimi Platter', 'Sashimi', 45.99, 'Fresh selection of tuna, salmon, and yellowtail', 'https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg', 'gluten-free,healthy', 0],
      [2, 'Dragon Roll', 'Sushi', 18.99, 'Eel and cucumber topped with avocado and eel sauce', 'https://images.pexels.com/photos/2098085/pexels-photo-2098085.jpeg', '', 0],
      [3, 'Margherita Pizza', 'Pizza', 22.99, 'Fresh mozzarella, tomato sauce, and basil', 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg', 'vegetarian', 0],
      [3, 'Fettuccine Alfredo', 'Pasta', 19.99, 'Creamy parmesan sauce with fresh fettuccine', 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg', 'vegetarian', 0]
    ];

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO food_items (restaurant_id, name, category, price, description, image, dietary, chef_special) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    sampleFoodItems.forEach(item => {
      stmt.run(item);
    });
    stmt.finalize();

    console.log('Sample data inserted successfully');
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
};

// Initialize database
const initializeDatabase = async () => {
  try {
    await createTables();
    await insertSampleData();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

module.exports = { db, initializeDatabase };