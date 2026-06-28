require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const app = express();
const userRoutes = require("./routes/user");
const workspaceRoutes = require("./routes/workspace");
const userAuth = require("./middleware/userAuth");

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/workspace",userAuth, workspaceRoutes);
app.use("/user", userRoutes);


app.use((req, res, next,err) => {
    if(err){
        console.log(err);
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
})


connectDB().then(() => {
  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
  });
});

module.exports = app;