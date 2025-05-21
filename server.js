require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const logRoutes = require("./logRoutes");
const registerRoutes = require("./routes");
const registerSocketHandlers = require("./socket");
const Message = require("./models/Message");

const matchmaking = require("./socketHandlers/lobby");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Consider locking this down in production
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(
  cors({
    origin: ["http://127.0.0.1:5502", "http://localhost:5173", "http://127.0.0.1:5500", "http://127.0.0.1:5501", "https://toz-app.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// MongoDB Connection
connectDB();

// Inject io into req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Root route
app.get("/", (req, res) => res.send("Welcome to the O-zone API"));

// Get recent chats for a user
app.get("/messages/recent/:playerId", async (req, res) => {
  const { playerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(playerId)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const objectId = new mongoose.Types.ObjectId(playerId);

  try {
    const recent = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: objectId }, { recipient: objectId }],
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", objectId] }, "$recipient", "$sender"],
          },
          latestMessage: { $first: "$$ROOT" },
        },
      },
    ]);

    res.json(recent.map((r) => r.latestMessage));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Email sender
app.post("/send-email", async (req, res) => {
  const { name, email, message } = req.body;

  const transporter = nodemailer.createTransport({
    secure: false,
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: email,
      to: "ifeanyivictor615@gmail.com",
      subject: `The O-zone Message from ${name}`,
      text: message,
    });

    res.status(200).send("Email sent successfully");
  } catch (err) {
    console.error("Email Error:", err.message);
    res.status(500).send("Email failed: " + err.message);
  }
});

// Dev route
app.get("/test", (req, res) => res.send("Test route is working"));

// Route registration
registerRoutes(app);

// Not found
app.all("*", (req, res) => {
  console.warn(`Unhandled Route: ${req.method} ${req.originalUrl}`);
  res.status(404).send("Route not found");
});

// Accurate manual route logger
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    const methods = Object.keys(middleware.route.methods)
      .map(m => m.toUpperCase())
      .join(', ');
    console.log(`${methods} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    middleware.handle.stack.forEach((handler) => {
      const route = handler.route;
      if (route) {
        const methods = Object.keys(route.methods)
          .map(m => m.toUpperCase())
          .join(', ');
        console.log(`${methods} ${route.path}`);
      }
    });
  }
});


// Show all routes in console as table
logRoutes(app);

// WebSocket handlers
registerSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ Server running on port ${PORT}`)
);
