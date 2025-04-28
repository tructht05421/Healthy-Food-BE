const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/connectDB");
const globalErrorHandler = require("./controllers/errorController");
const AppError = require("./utils/appError");
const cookieParser = require("cookie-parser");
const http = require("http");
const socketIo = require("socket.io");
const { agenda, stopAgenda } = require("./config/agenda");
const initJobs = require("./jobs");

// Import các router
const userRouter = require("./routes/userRouter");
const conversationRouter = require("./routes/conversationRouter");
const dishRouter = require("./routes/dishRouter");
const ingredientRouter = require("./routes/ingredientRouter");
const mealPlanRouter = require("./routes/mealPlanRouter");
const reminderRouter = require("./routes/reminderRouter");
const jobRouter = require("./routes/jobRouter");
const footerRouter = require("./routes/footerRoutes");
const homeRouter = require("./routes/homeRouter");
const commentRatingRouter = require("./routes/commentRatingRouter");
const medicalConditionRouter = require("./routes/medicalConditionRouter");
const userFavoriteDishesRouter = require("./routes/userFavoriteDishesRouter");
const paymentRouter = require("./routes/paymentRouter");
const foryouRouter = require("./routes/foryouRouter");
const userPreferenceRouter = require("./routes/userPreferenceRouter");
const recipeRouter = require("./routes/recipeRouter");

// Import các service và socket
const conversationService = require("./services/conversationService");
const initializeChatSocket = require("./socket/chatSocket");
const initializeReminderSocket = require("./socket/reminderSocket");

const app = express();
const server = http.createServer(app);

// Cấu hình Socket.IO với CORS
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.ADMIN_WEB_URL || "http://localhost:3000",
      // process.env.MOBILE_CLIENT_URL || "http://localhost:3001", // Xóa vì không cần
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

// Truyền io vào các service và socket
if (process.env.NODE_ENV !== "production") {
  console.log("Initializing services and sockets with io...");
}
conversationService.initialize(io);
initializeChatSocket(io);
initializeReminderSocket(io);

// Cấu hình middleware
app.use(express.json({ limit: "10kb" })); // Thêm giới hạn body size
app.use(cookieParser());

// Danh sách các URL được phép truy cập
const allowedOrigins = [
  process.env.ADMIN_WEB_URL || "http://localhost:3000",
  // process.env.MOBILE_CLIENT_URL || "http://localhost:3001", // Xóa vì không cần
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Xử lý khi ứng dụng dừng
async function graceful() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Đang đóng ứng dụng...");
  }
  await stopAgenda();
  process.exit(0);
}
process.on("SIGTERM", graceful);
process.on("SIGINT", graceful);

// Định nghĩa các route
app.get("/", (req, res) => {
  res.send("Hello, CORS is working!");
});

// API endpoints
app.use("/api/v1/users", userRouter);
app.use("/api/v1/conversations", conversationRouter);
app.use("/api/v1/dishes", dishRouter);
app.use("/api/v1/ingredients", ingredientRouter);
app.use("/api/v1/mealPlan", mealPlanRouter);
app.use("/api/v1/payment", paymentRouter);
app.use("/api/v1/reminders", reminderRouter);
app.use("/api/v1/jobs", jobRouter);
app.use("/api/v1/footer", footerRouter);
app.use("/api/v1/home", homeRouter);
app.use("/api/v1/comment", commentRatingRouter);
app.use("/api/v1/medicalConditions", medicalConditionRouter);
app.use("/api/v1/favoriteDishes", userFavoriteDishesRouter);
app.use("/api/v1/recipes", recipeRouter);
app.use("/api/v1/foryou", foryouRouter);
app.use("/api/v1/userpreference", userPreferenceRouter);

// Xử lý route không tồn tại
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);

const PORT = process.env.PORT || 8080;

// Hàm khởi động server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(
        `Server running at ${
          process.env.NODE_ENV === "production"
            ? "https://healthy-food-be.onrender.com"
            : `http://localhost:${PORT}`
        }`
      );
    });
    agenda.start();
    initJobs(agenda, io);
  } catch (error) {
    console.error("Application startup error:", error.message, error.stack);
    process.exit(1);
  }
};

// Gọi hàm khởi động server
startServer();
