import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'saapudu_bro_fitness'
};

let db;

async function initializeDatabase() {
  try {
    // Create database if it doesn't exist
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.end();
    
    // Connect to the database
    db = await mysql.createConnection(dbConfig);
    
    // Create tables
    await createTables();
    console.log('Database connected and tables created');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

async function createTables() {
  // Users table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      height DECIMAL(5,2) NOT NULL,
      weight DECIMAL(5,2) NOT NULL,
      body_type ENUM('Lean', 'Bulk', 'Normal') NOT NULL,
      goal ENUM('Weight Gain', 'Weight Loss') NOT NULL,
      profile_photo VARCHAR(255),
      is_approved BOOLEAN DEFAULT FALSE,
      is_admin BOOLEAN DEFAULT FALSE,
      daily_calorie_goal INT DEFAULT 2000,
      daily_protein_goal INT DEFAULT 100,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Food entries table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS food_entries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      food_name VARCHAR(255) NOT NULL,
      weight_grams DECIMAL(8,2) NOT NULL,
      calories DECIMAL(8,2) NOT NULL,
      protein DECIMAL(8,2) NOT NULL,
      entry_date DATE NOT NULL,
      entry_time TIME NOT NULL,
      image_path VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create admin user if it doesn't exist
  const [adminExists] = await db.execute('SELECT id FROM users WHERE email = ?', ['athamaraiselvan694@gmail.com']);
  if (adminExists.length === 0) {
    const hashedPassword = await bcrypt.hash('Thamarai@694', 10);
    await db.execute(`
      INSERT INTO users (name, email, password, height, weight, body_type, goal, is_approved, is_admin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ['Admin', 'athamaraiselvan694@gmail.com', hashedPassword, 175, 70, 'Normal', 'Weight Gain', true, true]);
    // console.log('Admin user created with email: admin@gmail.com and password: admin123');
  }
}

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// User registration
app.post('/api/register', upload.single('profilePhoto'), async (req, res) => {
  try {
    const { name, email, password, height, weight, bodyType, goal } = req.body;
    const profilePhoto = req.file ? req.file.filename : null;

    // Check if user already exists
    const [existingUser] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Calculate daily goals based on body type and goal
    let calorieGoal = 2000;
    let proteinGoal = 100;

    if (goal === 'Weight Gain') {
      calorieGoal = bodyType === 'Lean' ? 2800 : bodyType === 'Bulk' ? 3200 : 2600;
      proteinGoal = Math.ceil(weight * 1.8);
    } else {
      calorieGoal = bodyType === 'Lean' ? 1800 : bodyType === 'Bulk' ? 2200 : 2000;
      proteinGoal = Math.ceil(weight * 1.6);
    }

    // Insert user
    await db.execute(`
      INSERT INTO users (name, email, password, height, weight, body_type, goal, profile_photo, daily_calorie_goal, daily_protein_goal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, email, hashedPassword, height, weight, bodyType, goal, profilePhoto, calorieGoal, proteinGoal]);

    res.status(201).json({ message: 'User registered successfully. Awaiting admin approval.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check if approved
    if (!user.is_approved && !user.is_admin) {
      return res.status(403).json({ error: 'Awaiting admin approval' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.is_admin,
        profilePhoto: user.profile_photo,
        dailyCalorieGoal: user.daily_calorie_goal,
        dailyProteinGoal: user.daily_protein_goal
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get pending users (Admin only)
app.get('/api/admin/pending-users', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const [users] = await db.execute(`
      SELECT id, name, email, profile_photo, goal, body_type, created_at 
      FROM users 
      WHERE is_approved = FALSE AND is_admin = FALSE
      ORDER BY created_at DESC
    `);

    res.json(users);
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ error: 'Failed to fetch pending users' });
  }
});

// Approve/Reject user (Admin only)
app.patch('/api/admin/users/:id/approval', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (action === 'approve') {
      await db.execute('UPDATE users SET is_approved = TRUE WHERE id = ?', [id]);
      res.json({ message: 'User approved successfully' });
    } else if (action === 'reject') {
      await db.execute('DELETE FROM users WHERE id = ?', [id]);
      res.json({ message: 'User rejected and removed' });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error updating user approval:', error);
    res.status(500).json({ error: 'Failed to update user approval' });
  }
});

// Add food entry
app.post('/api/food-entries', authenticateToken, upload.single('foodImage'), async (req, res) => {
  try {
    const { foodName, weight, calories, protein } = req.body;
    const foodImage = req.file ? req.file.filename : null;
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0];

    await db.execute(`
      INSERT INTO food_entries (user_id, food_name, weight_grams, calories, protein, entry_date, entry_time, image_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, foodName, weight, calories, protein, today, now, foodImage]);

    res.status(201).json({ message: 'Food entry added successfully' });
  } catch (error) {
    console.error('Error adding food entry:', error);
    res.status(500).json({ error: 'Failed to add food entry' });
  }
});

// Analyze food image with Gemini AI
app.post('/api/analyze-food-image', authenticateToken, upload.single('foodImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const imagePath = req.file.path;
    let base64Image;

    try {
      const imageData = fs.readFileSync(imagePath);
      base64Image = imageData.toString('base64');
    } catch (fileError) {
      console.error('❌ Failed to read uploaded image:', fileError);
      return res.status(500).json({ error: 'Failed to read uploaded image' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const prompt = `
You are a nutritionist AI. Analyze the food in the provided image and return the following details:

1. Food name or dish name
2. Estimated weight in grams
3. Estimated calories
4. Estimated protein in grams

Respond ONLY in this JSON format:
{
  "foodName": "dish name",
  "weight": number,
  "calories": number,
  "protein": number
}
Do not add explanations or additional text. If unsure, make the best reasonable estimation.
`;
console.log("📷 Image uploaded:", req.file.filename);

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: req.file.mimetype,
      },
    };

let text;
try {
  console.log("📤 Sending image to Gemini AI...");
  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  text = await response.text();

  // Remove markdown-style triple backticks and "json" tag
  text = text.replace(/```json|```/g, '').trim();

  console.log("📥 Gemini response (cleaned):", text);
} catch (apiError) {
  console.error('❌ Gemini API call failed:', apiError);
  return res.status(500).json({ error: 'Gemini API failed to analyze image' });
}


    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch (parseError) {
      console.warn('⚠️ JSON parsing failed, using regex fallback');
      const foodNameMatch = text.match(/foodName.*?["']([^"']+)["']/i);
      const weightMatch = text.match(/weight.*?(\d+)/i);
      const caloriesMatch = text.match(/calories.*?(\d+)/i);
      const proteinMatch = text.match(/protein.*?(\d+)/i);

      analysis = {
        foodName: foodNameMatch ? foodNameMatch[1] : 'Unknown Food',
        weight: weightMatch ? parseInt(weightMatch[1]) : 100,
        calories: caloriesMatch ? parseInt(caloriesMatch[1]) : 200,
        protein: proteinMatch ? parseInt(proteinMatch[1]) : 10
      };
    }

    res.json({
      analysis,
      imagePath: req.file.filename
    });
  } catch (error) {
    console.error('❌ Error analyzing food image:', error);
    res.status(500).json({ error: 'Failed to analyze food image' });
  }
});


// Get today's food entries
app.get('/api/food-entries/today', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const [entries] = await db.execute(`
      SELECT * FROM food_entries 
      WHERE user_id = ? AND entry_date = ?
      ORDER BY entry_time DESC
    `, [userId, today]);

    res.json(entries);
  } catch (error) {
    console.error('Error fetching food entries:', error);
    res.status(500).json({ error: 'Failed to fetch food entries' });
  }
});

// Get food history
app.get('/api/food-entries/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 7 } = req.query;

    const [entries] = await db.execute(`
      SELECT * FROM food_entries 
      WHERE user_id = ? AND entry_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY entry_date DESC, entry_time DESC
    `, [userId, days]);

    res.json(entries);
  } catch (error) {
    console.error('Error fetching food history:', error);
    res.status(500).json({ error: 'Failed to fetch food history' });
  }
});

// Get motivational quote
app.get('/api/motivational-quote', authenticateToken, async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = "Generate a short, motivational fitness quote (1-2 sentences) that encourages healthy eating and exercise. Make it inspiring and positive.";
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const quote = response.text().trim();

    res.json({ quote });
  } catch (error) {
    console.error('Error generating quote:', error);
    res.status(500).json({ error: 'Failed to generate motivational quote' });
  }
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(`
      SELECT id, name, email, height, weight, body_type, goal, profile_photo, 
             daily_calorie_goal, daily_protein_goal, created_at
      FROM users WHERE id = ?
    `, [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});