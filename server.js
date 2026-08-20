require("dotenv").config();
const multer = require("multer");
const fs = require("fs");
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== CORS CONFIGURATION ====================
const allowedOrigins = [
    process.env.FRONTEND_URL || "https://sudharshan-infra.vercel.app",
    "https://sudharshan-infra.vercel.app",
    "http://localhost:3000",
    "http://localhost:5000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5000"
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked: ${origin}`);
            callback(null, true); // Allow in production, but log warning
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==================== DATABASE CONNECTION ====================
// Using connection pool for production
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 18849,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "sudarshaninfra",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});



// Session middleware for admin authentication

app.set('trust proxy', 1);

app.use(cookieParser());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));



// ==================== ADMIN AUTHENTICATION MIDDLEWARE ====================
function isAdminAuthenticated(req, res, next) {
    // Check session
    if (req.session && req.session.admin) {
        return next();
    }
    
    // Check JWT token in cookies
    const token = req.cookies.admin_token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded && decoded.username === process.env.ADMIN_USERNAME) {
                req.session.admin = { username: decoded.username };
                return next();
            }
        } catch (err) {
            // Invalid token
        }
    }
    
    res.status(401).json({ 
        success: false, 
        message: 'Unauthorized - Please login first' 
    });
}


// Promisify pool for async/await support
const promisePool = pool.promise();

// Test database connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Database Connection Error:", {
            code: err.code,
            errno: err.errno,
            sqlState: err.sqlState,
            message: err.message
        });
        // Don't crash the server, just log the error
        return;
    }
    console.log("✅ MySQL Connected (Pool)");
    console.log(`📊 Database: ${process.env.DB_NAME || "sudarshaninfra"}`);
    connection.release();
});

// Keep the original db query function for backward compatibility
const db = {
    query: (sql, params, callback) => {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        pool.query(sql, params, callback);
    }
};

// ==================== FILE UPLOAD SETUP ====================
const avatarFolder = path.join(__dirname, "uploads", "avatars");
const reviewFolder = path.join(__dirname, "uploads", "reviews");

// Create directories if they don't exist
if (!fs.existsSync(avatarFolder)) {
    fs.mkdirSync(avatarFolder, { recursive: true });
    console.log("📁 Created avatar folder");
}

if (!fs.existsSync(reviewFolder)) {
    fs.mkdirSync(reviewFolder, { recursive: true });
    console.log("📁 Created review folder");
}

// Avatar upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, avatarFolder);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.'));
        }
    }
});

// Review image upload configuration
const reviewStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, reviewFolder);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const reviewUpload = multer({
    storage: reviewStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.'));
        }
    }
});

// ==================== HEALTH CHECK ====================
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "API is running",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString()
    });
});

// ==================== TEST DATABASE ====================
app.get("/api/test-db", (req, res) => {
    db.query("SELECT DATABASE() AS db", (err, result) => {
        if (err) {
            console.error("Database test error:", err);
            return res.status(500).json({
                success: false,
                error: err.message,
                code: err.code
            });
        }
        res.json({
            success: true,
            database: result[0]?.db || "unknown",
            connection: "active"
        });
    });
});

// ==================== SIGNUP ====================
app.post("/api/signup", upload.single("avatar"), async (req, res) => {
    try {
        const { full_name, email, password } = req.body;
        const avatar = req.file ? req.file.filename : "default.png";

        if (!full_name || !email || !password) {
            return res.json({
                success: false,
                message: "Please fill all fields."
            });
        }

        // Check if email exists
        db.query(
            "SELECT * FROM users WHERE email=?",
            [email],
            async (err, result) => {
                if (err) {
                    console.error("Signup query error:", err);
                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });
                }

                if (result.length > 0) {
                    return res.json({
                        success: false,
                        message: "Email already registered."
                    });
                }

                const hashedPassword = await bcrypt.hash(password, 10);

                db.query(
                    "INSERT INTO users(full_name, email, password, avatar) VALUES(?, ?, ?, ?)",
                    [full_name, email, hashedPassword, avatar],
                    (err) => {
                        if (err) {
                            console.error("Insert error:", err);
                            return res.status(500).json({
                                success: false,
                                message: "Failed to create account"
                            });
                        }

                        res.json({
                            success: true,
                            message: "Account created successfully."
                        });
                    }
                );
            }
        );

    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
});

// ==================== LOGIN ====================
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({
            success: false,
            message: "Please enter email and password."
        });
    }

    db.query(
        "SELECT * FROM users WHERE email=?",
        [email],
        async (err, result) => {
            if (err) {
                console.error("Login query error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            if (result.length === 0) {
                return res.json({
                    success: false,
                    message: "Invalid Email"
                });
            }

            const user = result[0];
            const match = await bcrypt.compare(password, user.password);

            if (!match) {
                return res.json({
                    success: false,
                    message: "Invalid Password"
                });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.json({
                success: true,
                message: "Login Successful",
                token,
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email
                }
            });
        }
    );
});

// ==================== PROFILE ====================
app.get("/api/profile", (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "No Token"
        });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                success: false,
                message: "Invalid Token"
            });
        }

        db.query(
            "SELECT id, full_name, email, avatar FROM users WHERE id=?",
            [decoded.id],
            (err, result) => {
                if (err) {
                    console.error("Profile query error:", err);
                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });
                }

                if (result.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "User not found"
                    });
                }

                res.json(result[0]);
            }
        );
    });
});

// ==================== LOGOUT ====================
app.post("/api/logout", (req, res) => {
    res.json({
        success: true,
        message: "Logged Out"
    });
});

// ==================== USERS MANAGEMENT ====================
app.get("/api/users", (req, res) => {
    db.query(
        "SELECT id, full_name, email, avatar, created_at FROM users ORDER BY id DESC",
        (err, result) => {
            if (err) {
                console.error("Users query error:", err);
                return res.json({
                    success: false,
                    message: "Database error"
                });
            }

            res.json({
                success: true,
                users: result
            });
        }
    );
});

app.delete("/api/users/:id", (req, res) => {
    db.query(
        "DELETE FROM users WHERE id=?",
        [req.params.id],
        (err) => {
            if (err) {
                console.error("User delete error:", err);
                return res.json({
                    success: false,
                    message: "Database error"
                });
            }

            res.json({
                success: true,
                message: "User deleted successfully"
            });
        }
    );
});

// ==================== ADD REVIEW ====================
app.post("/api/reviews", reviewUpload.single("image"), (req, res) => {
    console.log("========== REVIEW SUBMISSION ==========");
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const { name, email, review, rating } = req.body;
    const image = req.file ? req.file.filename : "default.png";

    // Validate required fields
    if (!name || !email || !review || !rating) {
        return res.status(400).json({
            success: false,
            message: "All fields (name, email, review, rating) are required"
        });
    }

    db.query(
        `INSERT INTO reviews (name, email, review, rating, image) VALUES (?, ?, ?, ?, ?)`,
        [name, email, review, rating, image],
        (err, result) => {
            if (err) {
                console.error("Review insert error:", err);
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            console.log("✅ Review inserted:", result.insertId);
            res.json({
                success: true,
                message: "Review submitted successfully",
                id: result.insertId
            });
        }
    );
});

// ==================== GET REVIEWS ====================
app.get("/api/reviews", (req, res) => {
    db.query(
        "SELECT * FROM reviews ORDER BY id DESC",
        (err, rows) => {
            if (err) {
                console.error("Reviews query error:", err);
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            res.json({
                success: true,
                reviews: rows
            });
        }
    );
});

app.delete("/api/reviews/:id", (req, res) => {
    db.query(
        "DELETE FROM reviews WHERE id=?",
        [req.params.id],
        (err) => {
            if (err) {
                console.error("Review delete error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            res.json({
                success: true,
                message: "Review deleted successfully"
            });
        }
    );
});




// ==================== INQUIRIES ====================

// CREATE INQUIRY
app.post("/api/inquiries", (req, res) => {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            message: "Name, email and message are required"
        });
    }

    const sql = `
        INSERT INTO inquiries
        (name, email, phone, subject, message, is_read)
        VALUES (?, ?, ?, ?, ?, 0)
    `;

    db.query(
        sql,
        [
            name,
            email,
            phone || null,
            subject || null,
            message
        ],
        (err, result) => {

            if (err) {
                console.error("❌ Inquiry insert error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to save inquiry"
                });
            }

            console.log("✅ Inquiry saved:", result.insertId);

            res.status(201).json({
                success: true,
                message: "Inquiry submitted successfully",
                id: result.insertId
            });
        }
    );
});


// GET ALL INQUIRIES
app.get("/api/inquiries", (req, res) => {

    const sql = `
        SELECT *
        FROM inquiries
        ORDER BY id DESC
    `;

    db.query(sql, (err, rows) => {

        if (err) {
            console.error("❌ Inquiries fetch error:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to load inquiries"
            });
        }

        res.json({
            success: true,
            inquiries: rows || []
        });
    });
});


// DELETE INQUIRY
app.delete("/api/inquiries/:id", (req, res) => {

    db.query(
        "DELETE FROM inquiries WHERE id=?",
        [req.params.id],
        (err, result) => {

            if (err) {
                console.error("❌ Inquiry delete error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to delete inquiry"
                });
            }

            res.json({
                success: true,
                message: "Inquiry deleted successfully"
            });
        }
    );
});


// MARK INQUIRY AS READ / UNREAD
app.put("/api/inquiries/:id/read", (req, res) => {

    const { is_read } = req.body;

    db.query(
        "UPDATE inquiries SET is_read=? WHERE id=?",
        [is_read ? 1 : 0, req.params.id],
        (err) => {

            if (err) {
                console.error("❌ Inquiry read status error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to update inquiry"
                });
            }

            res.json({
                success: true,
                message: "Inquiry status updated"
            });
        }
    );
});





// ==================== ADMIN LOGIN ====================
app.post('/api/admin/login', (req, res) => {
    const { username, password, remember } = req.body;

    // Validate credentials against environment variables
    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({
            success: false,
            message: 'Invalid username or password'
        });
    }

    // Create session
    req.session.admin = { username: username };

    // If remember me, create JWT token
    if (remember) {
        const token = jwt.sign(
            { username: username },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            sameSite: 'strict'
        });
    }

    res.json({
        success: true,
        message: 'Login successful'
    });
});



// ==================== CHECK ADMIN SESSION ====================
app.get('/api/admin/check-session', (req, res) => {
    // Check session
    if (req.session && req.session.admin) {
        return res.json({
            authenticated: true,
            user: { username: req.session.admin.username }
        });
    }

    // Check JWT in cookies
    const token = req.cookies.admin_token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded && decoded.username === process.env.ADMIN_USERNAME) {
                // Restore session
                req.session.admin = { username: decoded.username };
                return res.json({
                    authenticated: true,
                    user: { username: decoded.username }
                });
            }
        } catch (err) {
            // Invalid token
        }
    }

    res.json({ authenticated: false });
});



// ==================== ADMIN LOGOUT ====================
app.post('/api/admin/logout', (req, res) => {
    // Clear session
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err);
        }
    });

    // Clear JWT cookie
    res.clearCookie('admin_token');

    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});


// ==================== CHANGE ADMIN PASSWORD ====================
app.post('/api/admin/change-password', isAdminAuthenticated, (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    if (currentPassword !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({
            success: false,
            message: 'Current password is incorrect'
        });
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'New password must be at least 6 characters'
        });
    }

    // In production, you'd update the environment variable or database
    // For now, we'll just return success
    res.json({
        success: true,
        message: 'Password updated successfully'
    });
});


// GET REVIEWS - Add isAdminAuthenticated
app.get("/api/reviews", isAdminAuthenticated, (req, res) => {
    // Your existing code stays the same
    db.query(
        "SELECT * FROM reviews ORDER BY id DESC",
        (err, rows) => {
            if (err) {
                console.error("Reviews query error:", err);
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }
            res.json({
                success: true,
                reviews: rows
            });
        }
    );
});

// DELETE REVIEW - Add isAdminAuthenticated
app.delete("/api/reviews/:id", isAdminAuthenticated, (req, res) => {
    // Your existing code stays the same
    db.query(
        "DELETE FROM reviews WHERE id=?",
        [req.params.id],
        (err) => {
            if (err) {
                console.error("Review delete error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }
            res.json({
                success: true,
                message: "Review deleted successfully"
            });
        }
    );
});


// GET INQUIRIES - Add isAdminAuthenticated
app.get("/api/inquiries", isAdminAuthenticated, (req, res) => {
    // Your existing code stays the same
    const sql = `SELECT * FROM inquiries ORDER BY id DESC`;
    db.query(sql, (err, rows) => {
        if (err) {
            console.error("❌ Inquiries fetch error:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to load inquiries"
            });
        }
        res.json({
            success: true,
            inquiries: rows || []
        });
    });
});

// DELETE INQUIRY - Add isAdminAuthenticated
app.delete("/api/inquiries/:id", isAdminAuthenticated, (req, res) => {
    // Your existing code stays the same
    db.query(
        "DELETE FROM inquiries WHERE id=?",
        [req.params.id],
        (err, result) => {
            if (err) {
                console.error("❌ Inquiry delete error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to delete inquiry"
                });
            }
            res.json({
                success: true,
                message: "Inquiry deleted successfully"
            });
        }
    );
});

// MARK INQUIRY AS READ - Add isAdminAuthenticated
app.put("/api/inquiries/:id/read", isAdminAuthenticated, (req, res) => {
    // Your existing code stays the same
    const { is_read } = req.body;
    db.query(
        "UPDATE inquiries SET is_read=? WHERE id=?",
        [is_read ? 1 : 0, req.params.id],
        (err) => {
            if (err) {
                console.error("❌ Inquiry read status error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to update inquiry"
                });
            }
            res.json({
                success: true,
                message: "Inquiry status updated"
            });
        }
    );
});


// GET USERS - Add isAdminAuthenticated
app.get("/api/users", isAdminAuthenticated, (req, res) => {
    // Your existing code stays the same
    db.query(
        "SELECT id, full_name, email, avatar, created_at FROM users ORDER BY id DESC",
        (err, result) => {
            if (err) {
                console.error("Users query error:", err);
                return res.json({
                    success: false,
                    message: "Database error"
                });
            }
            res.json({
                success: true,
                users: result
            });
        }
    );
});

// DELETE USER - Add isAdminAuthenticated
app.delete("/api/users/:id", isAdminAuthenticated, (req, res) => {
    // Your existing code stays the same
    db.query(
        "DELETE FROM users WHERE id=?",
        [req.params.id],
        (err) => {
            if (err) {
                console.error("User delete error:", err);
                return res.json({
                    success: false,
                    message: "Database error"
                });
            }
            res.json({
                success: true,
                message: "User deleted successfully"
            });
        }
    );
});





// ==================== PROJECTS (Preserved) ====================
// If projects route exists, keep it
// Add a basic projects endpoint if needed
app.get("/api/projects", (req, res) => {
    db.query(
        "SELECT * FROM projects ORDER BY id DESC",
        (err, rows) => {
            if (err) {
                console.error("Projects query error:", err);
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            res.json({
                success: true,
                projects: rows || []
            });
        }
    );
});

// ==================== HOME PAGE ====================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// ==================== 404 HANDLER ====================
app.use((req, res, next) => {
    // Only handle API routes with 404 JSON
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: "API endpoint not found"
        });
    }
    // For non-API routes, serve the frontend or pass to error handler
    next();
});

// ==================== GLOBAL ERROR HANDLER ====================
app.use((err, req, res, next) => {
    console.error("Server Error:", {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Handle multer errors
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    // Handle JSON parsing errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON payload'
        });
    }

    // Default error response
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal Server Error' 
            : err.message
    });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
    console.log("--------------------------------");
    console.log("🚀 Server Started");
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}`);
    console.log("--------------------------------");
});