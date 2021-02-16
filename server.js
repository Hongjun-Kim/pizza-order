const express = require("express");
const app = express();
require("dotenv").config();
const ejs = require("ejs");
const path = require("path");
const expressLayout = require("express-ejs-layouts");
const { request } = require("http");
const PORT = process.env.PORT || 3000;
const mongoose = require("mongoose");
// if(process.env.PORT){
//   PORT = porcess.env.PORT
// }else{
//   PORT = 3000
// }
const session = require("express-session");
const flash = require("express-flash");
const MongoDbStore = require("connect-mongo")(session);
const passport = require("passport");
const Emitter = require("events");

// Database connection
//const url = "mongodb://localhost/pizza-testd";
//const url = "mongodb://root:1234@localhost:27017/pizza?authSource=admin";
//const url =
// "mongodb+srv://dromide:1234@server.4e3oc.mongodb.net/pizzap?authSource=admin";
// "mongodb+srv://dromide:1234@server.4e3oc.mongodb.net/pizzap?retryWrites=true&w=majority";
//  "mongodb://root:1234@localhost:27017/pizzap?authSource=admin";

mongoose.connect(process.env.MONGO_CONNECTION_URL, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: true,
});
const connection = mongoose.connection;
connection
  .once("open", () => {
    console.log("Database connected...");
  })
  .catch((error) => {
    console.log("Conection failed..");
  });

//Session store
let mongoStore = new MongoDbStore({
  mongooseConnection: connection,
  collection: "sessions",
});

// Event emitter
const eventEmitter = new Emitter();
app.set("eventEmitter", eventEmitter);

// Session config
app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    store: mongoStore,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 24hours
  })
);

// Passport config
const passportInit = require("./app/config/passport");
passportInit(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
// Assets
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Global middleware
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.user = req.user;
  // console.log(res.locals.user);
  next();
});

//set Templeate engine
app.use(expressLayout);
app.set("views", path.join(__dirname, "/resources/views"));
app.set("view engine", "ejs");

// app.get("/", (req, res) => {
//   // res.send("Hello from server");
//   res.render("home");
// });
require("./routes/web")(app);
app.use((req, res) => {
  res.status(404).render("errors/404");
});

// app.get("/cart", (req, res) => {
//   res.render("customers/cart");
// });

// app.get("/login", (req, res) => {
//   res.render("auth/login");
// });

// app.get("/register", (req, res) => {
//   res.render("auth/register");
// });

const server = app.listen(PORT, () => {
  console.log(`Listening on port xyz ${PORT}`);
});

// Socket
const io = require("socket.io")(server);
io.on("connection", (socket) => {
  // Join
  console.log(socket.id);
  socket.on("join", (roomName) => {
    // console.log("roomName : " + roomName);
    socket.join(roomName);
  });
});

eventEmitter.on("orderUpdated", (data) => {
  io.to(`order_${data.id}`).emit("orderUpdated", data);
});

eventEmitter.on("orderPlaced", (data) => {
  io.to("adminRoom").emit("orderPlaced", data);
});
