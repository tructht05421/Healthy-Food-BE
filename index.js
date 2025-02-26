const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/connectDB");
const globalErrorHandler = require("./controllers/errorController");
const AppError = require("./utils/appError");
const userRouter = require("./routes/userRouter");
const app = express();
const cookieParser = require("cookie-parser");
const http = require("http");
const socketIo = require("socket.io");
const conversationRouter = require("./routes/conversationRouter");
const dishRouter = require("./routes/dishRouter");
const ingredientRouter = require("./routes/ingredientRouter");

// Tạo server HTTP
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.ADMIN_WEB_URL, // URL của frontend client
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

// Định nghĩa socket events
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });

  // Có thể thêm các sự kiện khác cho việc chat hoặc giao tiếp real-time
});

app.use(express.json());
app.use(cookieParser()); // Thêm middleware này để xử lý cookie

// Danh sách các URL được phép truy cập
const allowedOrigins = [
  process.env.ADMIN_WEB_URL, // URL của Admin Web
  process.env.MOBILE_CLIENT_URL, // URL của Mobile Client
];

// Cấu hình CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Kiểm tra xem origin có nằm trong danh sách allowedOrigins hay không
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Cho phép
    } else {
      callback(new Error("Not allowed by CORS")); // Từ chối
    }
  },
  credentials: true, // Cho phép gửi cookie/authorization headers
};

// Áp dụng middleware CORS
app.use(cors(corsOptions));

// Các route khác
app.get("/", (req, res) => {
  res.send("Hello, CORS is working!");
});
// API Endpoint
app.use("/api/v1/users", userRouter);
app.use("/api/v1/conversations", conversationRouter);
app.use("/api/v1/dishes", dishRouter);
app.use("/api/v1/ingredients", ingredientRouter);

// Users api urls
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on thiss server!`, 404));
});
app.use(globalErrorHandler);
// Khởi động server
const PORT = process.env.PORT || 8080;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
