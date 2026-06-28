require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

const http = require("http");
const { Server } = require("socket.io");

const userRoutes = require("./routes/user");
const workspaceRoutes = require("./routes/workspace");
const userAuth = require("./middleware/userAuth");

const initializeSocket = require("./socket/socket");

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/user", userRoutes);

app.use("/workspace", userAuth, workspaceRoutes);

// Error middleware
app.use((err, req, res, next) => {
  console.log(err);

  res.status(500).json({
    success: false,
    message: err.message,
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

// Initialize socket events
initializeSocket(io);

// Make io available in routes
app.set("io", io);

connectDB().then(() => {
  server.listen(process.env.PORT || 5000, () => {
    console.log(
      `Server running on port ${process.env.PORT || 5000}`
    );
  });
});