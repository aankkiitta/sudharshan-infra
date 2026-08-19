require("dotenv").config();
const multer = require("multer");
const fs = require("fs");
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==================== DATABASE ====================

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
db.connect((err) => {
    if (err) {
        console.log("Database Error:", err);
        return;
    }

    console.log("✅ MySQL Connected");
});


const avatarFolder = path.join(__dirname, "uploads", "avatars");

if (!fs.existsSync(avatarFolder)) {
    fs.mkdirSync(avatarFolder, { recursive: true });
}

const reviewFolder = path.join(__dirname, "uploads", "reviews");

if (!fs.existsSync(reviewFolder)) {
    fs.mkdirSync(reviewFolder, { recursive: true });
}
const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, avatarFolder);

    },

    filename: (req, file, cb) => {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);

    }

});



const upload = multer({ storage });

const reviewStorage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, reviewFolder);

    },

    filename: (req, file, cb) => {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);

    }

});

const reviewUpload = multer({

    storage: reviewStorage

});

// ==================== SIGNUP ====================
app.post("/api/signup", upload.single("avatar"), async (req,res)=>{

    try {

        const { full_name,email,password } = req.body;

const avatar = req.file
    ? req.file.filename
    : "default.png";

        if (!full_name || !email || !password) {

            return res.json({
                success: false,
                message: "Please fill all fields."
            });

        }

        db.query(
            "SELECT * FROM users WHERE email=?",
            [email],
            async (err, result) => {

                if (err) {
                    return res.status(500).json(err);
                }

                if (result.length > 0) {

                    return res.json({
                        success: false,
                        message: "Email already registered."
                    });

                }

                const hashedPassword = await bcrypt.hash(password, 10);

              db.query(
    "INSERT INTO users(full_name,email,password,avatar) VALUES(?,?,?,?)",
    [
        full_name,
        email,
        hashedPassword,
        avatar
    ],
    (err) => {

        if (err) {
            return res.status(500).json(err);
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

        console.log(error);

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
                return res.status(500).json(err);
            }

            if (result.length === 0) {

                return res.json({
                    success: false,
                    message: "Invalid Email"
                });

            }

            const user = result[0];

            const match = await bcrypt.compare(
                password,
                user.password
            );

            if (!match) {

                return res.json({
                    success: false,
                    message: "Invalid Password"
                });

            }

            const token = jwt.sign(

                {
                    id: user.id,
                    email: user.email
                },

                "SUDARSHAN_INFRA_SECRET",

                {
                    expiresIn: "7d"
                }

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

    jwt.verify(
        token,
        "SUDARSHAN_INFRA_SECRET",
        (err, decoded) => {

            if (err) {

                return res.status(401).json({
                    success: false,
                    message: "Invalid Token"
                });

            }

            db.query(

                "SELECT id,full_name,email FROM users WHERE id=?",

                [decoded.id],

                (err, result) => {

                    if (err) {
                        return res.status(500).json(err);
                    }

                    res.json(result[0]);

                }

            );

        }

    );

});

// ==================== LOGOUT ====================

app.post("/api/logout", (req, res) => {

    res.json({
        success: true,
        message: "Logged Out"
    });

});






app.get("/api/users",(req,res)=>{

    db.query(

        "SELECT * FROM users ORDER BY id DESC",

        (err,result)=>{

            if(err){

                return res.json({

                    success:false

                });

            }

            res.json({

                success:true,

                users:result

            });

        }

    );

});

app.delete("/api/users/:id",(req,res)=>{

    db.query(

        "DELETE FROM users WHERE id=?",

        [req.params.id],

        (err)=>{

            if(err){

                return res.json({

                    success:false

                });

            }

            res.json({

                success:true

            });

        }

    );

});






// ==================== ADD REVIEW ====================
app.post("/api/reviews", reviewUpload.single("image"), (req, res) => {

    console.log("========== REVIEW ==========");
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const { name, email, review, rating } = req.body;

    const image = req.file ? req.file.filename : "default.png";

    db.query(
        `INSERT INTO reviews
        (name, email, review, rating, image)
        VALUES (?, ?, ?, ?, ?)`,
        [
            name,
            email,
            review,
            rating,
            image
        ],
        (err, result) => {

            if (err) {
                console.log("MYSQL ERROR:", err);

                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            console.log("Inserted:", result.insertId);

            res.json({
                success: true
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
                return res.json({
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

                return res.json({

                    success: false

                });

            }

            res.json({

                success: true

            });

        }

    );

});

// ==================== HOME ====================

app.get("/", (req, res) => {

    res.sendFile(path.join(__dirname, "public", "login.html"));

});

// ==================== START SERVER ====================


app.get("/api/test-db", (req, res) => {

    db.query("SELECT DATABASE() AS db", (err, result) => {

        if (err) {
            return res.json(err);
        }

        res.json(result[0]);

    });

});


app.listen(PORT, () => {

    console.log("--------------------------------");
    console.log("🚀 Server Started");
    console.log(`🌐 http://localhost:${PORT}`);
    console.log("--------------------------------");

});