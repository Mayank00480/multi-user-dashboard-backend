require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const app = express();
const userRoutes = require("./routes/user");

app.use(express.json());
app.use(cookieParser());


app.use("/user", userRoutes);


connectDB().then(() => {
  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
  });
});

module.exports = app;