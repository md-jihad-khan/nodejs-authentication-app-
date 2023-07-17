const cookieParser = require("cookie-parser");
const express = require("express");
const { default: mongoose } = require("mongoose");
const Mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

mongoose
  .connect("mongodb://127.0.0.1:27017", { dbName: "backend" })
  .then(() => console.log("database connected"))
  .catch((err) => console.log(err));

const userScemma = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userScemma);

const app = express();

const users = [];
// using middleware
app.use(express.static("./public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// setting up engine
app.set("view engine", "ejs");

const isAuthenticated = async (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    const decoded = jwt.verify(token, "10101010");
    req.user = await User.findById(decoded._id);

    next();
  } else {
    res.redirect("/login");
  }
};

app.get("/", isAuthenticated, (req, res) => {
  res.render("logout", { name: req.user.name });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  let user = await User.findOne({ email });

  if (!user) {
    return res.redirect("/register");
  }

  const ismatch = await bcrypt.compare(password, user.password);

  if (!ismatch) {
    return res.render("login", { email, message: "incorrect password" });
  }

  const token = jwt.sign({ _id: user._id }, "10101010");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 10000),
  });
  res.redirect("/");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  let user = await User.findOne({ email });

  if (user) {
    return res.redirect("/login");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  user = await User.create({
    name: name,
    email: email,
    password: hashedPassword,
  });

  const token = jwt.sign({ _id: user._id }, "10101010");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 10000),
  });
  res.redirect("/");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/login");
});

app.listen(5000, () => {
  console.log("listening on port 5000");
});
