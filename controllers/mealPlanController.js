const { MealPlan, MealDay, Meal, MealTracking, UserMealPlan } = require("../models/MealPlan");
const mongoose = require("mongoose");
const Reminder = require("../models/Reminder");
const { agenda } = require("../config/agenda");

// CRUD MealPlan operations
exports.createMealPlan = async (req, res) => {
  try {
    const { title, userId, type, duration, startDate, createdBy, meals, price } = req.body;

    if (type === "fixed" && (!meals || !Array.isArray(meals) || meals.length === 0)) {
      return res.status(400).json({ success: false, message: "Danh sách bữa ăn không hợp lệ" });
    }

    // Xác định ngày kết thúc
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration - 1);

    // Kiểm tra xem MealPlan có bị khóa không (nếu nutritionist tạo)
    const isNutritionistCreated = createdBy.toString() !== userId.toString();
    const isBlock = isNutritionistCreated;

    // Nếu nutritionist tạo, phải có giá
    const mealPlanPrice = isNutritionistCreated ? price || 0 : 0;

    // 🥗 **Tạo MealPlan**
    const mealPlan = await MealPlan.create({
      title,
      userId,
      type,
      duration,
      startDate,
      endDate,
      createdBy,
      isBlock,
      price: mealPlanPrice,
      isPaid: !isNutritionistCreated, // Nếu user tự tạo, mặc định là đã thanh toán (miễn phí)
    });

    // 📝 **Cập nhật UserMealPlan**
    if (!isNutritionistCreated) {
      await UserMealPlan.findOneAndUpdate(
        { userId },
        { mealPlanId: mealPlan._id, startDate },
        { upsert: true, new: true }
      );
    }

    // ✅ **Xử lý tạo MealDay**
    for (let i = 0; i < duration; i++) {
      const mealDayDate = new Date(startDate);
      mealDayDate.setDate(mealDayDate.getDate() + i);

      // Tạo MealDay (chưa có Meal)
      const mealDay = await MealDay.create({
        mealPlanId: mealPlan._id,
        date: mealDayDate.toISOString().split("T")[0], // Lưu YYYY-MM-DD
      });

      // Nếu type === "fixed" thì tạo luôn Meal
      if (type === "fixed" && meals) {
        const mealPromises = meals.map(async (meal) => {
          return await Meal.create({
            mealDayId: mealDay._id,
            mealTime: meal.mealTime, // Ví dụ: "07:00"
            mealName: meal.mealName, // Ví dụ: "Breakfast"
          });
        });

        await Promise.all(mealPromises);
      }
    }

    res.status(201).json({ success: true, data: mealPlan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Lấy danh sách MealPlan dựa trên userId từ token middleware
exports.getMealPlan = async (req, res) => {
  try {
    const { _id, role } = req.user; // Lấy từ middleware authentication
    let filter = {};
    if (role === "user") {
      filter.userId = _id; // User chỉ thấy MealPlan của chính mình
    } else if (role === "nutritionist") {
      filter.$or = [{ createdBy: _id }, { userId: _id }]; // Nutritionist thấy MealPlan họ tạo hoặc của user họ tư vấn
    } else {
      return res.status(403).json({ success: false, message: "Vai trò không hợp lệ" });
    }

    const mealPlans = await MealPlan.find(filter).lean();
    res.status(200).json({ success: true, data: mealPlans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Cập nhật lại hàm updateMealPlan để xử lý đầy đủ các trường hợp
exports.updateMealPlan = async (req, res) => {
  try {
    const { mealPlanId } = req.params;
    const { isPause, isDelete, price, isBlock } = req.body;
    const { _id: userId, role } = req.user;

    // 🔍 Tìm MealPlan
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      return res.status(404).json({ success: false, message: "MealPlan không tồn tại" });
    }

    // ✅ Kiểm tra quyền cập nhật (chỉ owner hoặc nutritionist tạo ra mới được cập nhật)
    const isOwner = mealPlan.userId.toString() === userId.toString();
    const isCreator = mealPlan.createdBy.toString() === userId.toString();
    const isNutritionist = role === "nutritionist";

    if (!isOwner && !isCreator && !isNutritionist) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật MealPlan này",
      });
    }

    // 🔄 Xử lý cập nhật trạng thái tạm dừng (isPause)
    if (typeof isPause !== "undefined" && mealPlan.isPause !== isPause) {
      mealPlan.isPause = isPause;
      await updateRemindersForMealPlan(mealPlanId, isPause); // Tạm dừng hoặc kích hoạt lại nhắc nhở
    }

    // 🚨 Xử lý xóa MealPlan (isDelete)
    if (isDelete === true) {
      mealPlan.isDelete = true;

      // Xóa tất cả dữ liệu liên quan (Reminder, Tracking, Jobs,...)
      await deleteMealPlanData(mealPlanId);

      return res.status(200).json({
        success: true,
        message: "MealPlan và tất cả dữ liệu liên quan đã được xóa thành công",
        data: { _id: mealPlanId },
      });
    }

    // 👨‍⚕️ Nutritionist hoặc người tạo MealPlan được phép cập nhật các trường đặc biệt
    if (isNutritionist || isCreator) {
      if (typeof price !== "undefined") {
        mealPlan.price = price;
      }

      // 🔒 Xử lý trạng thái khóa MealPlan (isBlock)
      if (typeof isBlock !== "undefined" && mealPlan.isBlock !== isBlock) {
        mealPlan.isBlock = isBlock;

        // Nếu mở khóa MealPlan, cập nhật lại Reminder nếu cần
        if (!isBlock) {
          await updateRemindersForMealPlan(mealPlanId, mealPlan.isPause);
        }
        // Nếu khóa MealPlan, tạm dừng tất cả Reminder
        else {
          await updateRemindersForMealPlan(mealPlanId, true);
        }
      }
    }

    await mealPlan.save();
    res.status(200).json({ success: true, data: mealPlan });
  } catch (error) {
    console.error("🔥 Lỗi khi cập nhật MealPlan:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};
exports.deleteMealPlan = async (req, res) => {
  try {
    const { mealPlanId } = req.params;
    const { _id: userId } = req.user;

    // 🔹 Tìm MealPlan
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      return res.status(404).json({ success: false, message: "MealPlan không tồn tại" });
    }

    // 🔹 Kiểm tra quyền
    if (
      mealPlan.userId.toString() !== userId.toString() &&
      mealPlan.createdBy.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa MealPlan này",
      });
    }

    // 🔥 **Xóa tất cả dữ liệu liên quan**
    await deleteMealPlanData(mealPlanId);

    // 🔥 **Xóa MealPlan**
    await MealPlan.findByIdAndDelete(mealPlanId);

    // 🔄 **Cập nhật UserMealPlan về `null` nếu đang theo dõi MealPlan này**
    await UserMealPlan.findOneAndUpdate(
      { userId, mealPlanId },
      { mealPlanId: null },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "MealPlan và tất cả dữ liệu liên quan đã được xóa thành công",
      data: { _id: mealPlanId },
    });
  } catch (error) {
    console.error("🔥 Lỗi khi xóa MealPlan:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Hàm riêng để pause/resume MealPlan
exports.toggleMealPlanStatus = async (req, res) => {
  try {
    const { mealPlanId } = req.params;
    const { isPause } = req.body;
    const { _id: userId } = req.user;

    if (typeof isPause !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Trạng thái isPause phải là true hoặc false",
      });
    }

    // Tìm MealPlan
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      return res.status(404).json({ success: false, message: "MealPlan không tồn tại" });
    }

    // Kiểm tra quyền
    if (
      mealPlan.userId.toString() !== userId.toString() &&
      mealPlan.createdBy.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật MealPlan này",
      });
    }

    // Nếu MealPlan đã bị khóa và người dùng không phải là nutritionist
    if (mealPlan.isBlock && mealPlan.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "MealPlan đang bị khóa, bạn không thể thay đổi trạng thái",
      });
    }

    // Không cần cập nhật nếu trạng thái không thay đổi
    if (mealPlan.isPause === isPause) {
      return res.status(200).json({
        success: true,
        message: `MealPlan đã ở trạng thái ${isPause ? "tạm dừng" : "hoạt động"}`,
        data: mealPlan,
      });
    }

    // Cập nhật trạng thái
    mealPlan.isPause = isPause;
    await mealPlan.save();

    // Cập nhật trạng thái của tất cả reminder và job liên quan
    await updateRemindersForMealPlan(mealPlanId, isPause);

    res.status(200).json({
      success: true,
      message: `MealPlan đã được ${isPause ? "tạm dừng" : "tiếp tục"} thành công`,
      data: mealPlan,
    });
  } catch (error) {
    console.error("🔥 Lỗi khi thay đổi trạng thái MealPlan:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Utility functions Helper Lean
// Hàm cập nhật trạng thái tất cả reminder liên quan đến một MealPlan
const updateRemindersForMealPlan = async (mealPlanId, isPaused) => {
  try {
    console.log(
      `${isPaused ? "⏸️ Tạm dừng" : "▶️ Kích hoạt"} reminders cho MealPlan ${mealPlanId}`
    );

    // Tìm tất cả reminder liên quan đến MealPlan
    const reminders = await Reminder.find({ mealPlanId });
    console.log(`🔍 Tìm thấy ${reminders.length} reminder cho MealPlan này`);

    // Lặp qua từng reminder để cập nhật trạng thái
    for (const reminder of reminders) {
      reminder.isActive = !isPaused;

      if (isPaused) {
        // Tạm dừng tất cả job liên quan đến reminderId
        console.log(`⏸️ Tạm dừng tất cả job cho reminder ${reminder._id}`);
        await agenda.cancel({ "data.reminderId": reminder._id });

        reminder.status = "paused";
      } else {
        // Kích hoạt lại job
        if (reminder.remindTime && new Date(reminder.remindTime) > new Date()) {
          console.log(`▶️ Kích hoạt lại reminder ${reminder._id} vào ${reminder.remindTime}`);

          // Hủy job cũ (nếu còn sót)
          await agenda.cancel({ "data.reminderId": reminder._id });

          // Tạo job mới
          const job = await agenda.schedule(reminder.remindTime, "sendReminder", {
            reminderId: reminder._id,
            userId: reminder.userId,
            message: reminder.message,
          });

          reminder.jobId = job.attrs._id;
          reminder.status = "scheduled";
        } else {
          reminder.status = "expired";
        }
      }

      await reminder.save();
    }

    console.log(`✅ Hoàn tất cập nhật ${reminders.length} reminder cho MealPlan ${mealPlanId}`);
    return true;
  } catch (error) {
    console.error("🔥 Lỗi khi cập nhật reminder:", error);
    throw error;
  }
};

// Hàm xóa tất cả dữ liệu liên quan đến một MealPlan
const deleteMealPlanData = async (mealPlanId) => {
  try {
    console.log(`🗑️ Bắt đầu xóa dữ liệu liên quan đến MealPlan ${mealPlanId}`);

    // 🔹 Lấy danh sách MealDay trước khi xóa
    const mealDays = await MealDay.find({ mealPlanId });
    const mealDayIds = mealDays.map((day) => day._id);

    // 🔹 Lấy danh sách Meal trước khi xóa
    const meals = await Meal.find({ mealDayId: { $in: mealDayIds } });
    const mealIds = meals.map((meal) => meal._id);

    // 🔹 Lấy danh sách Reminder trước khi xóa để hủy Job
    const reminders = await Reminder.find({ mealPlanId });
    const reminderIds = reminders.map((reminder) => reminder._id);

    // 🔥 Hủy tất cả job liên quan trong Agenda
    if (reminderIds.length > 0) {
      console.log(`🗑️ Hủy ${reminderIds.length} job nhắc nhở`);
      await agenda.cancel({ "data.reminderId": { $in: reminderIds } });
    }

    // 🔥 Xóa tất cả dữ liệu theo thứ tự (từ con đến cha)
    const deletionResults = await Promise.all([
      Reminder.deleteMany({ mealPlanId }),
      MealTracking.deleteMany({ mealPlanId }),
      Meal.deleteMany({ mealDayId: { $in: mealDayIds } }),
      MealDay.deleteMany({ mealPlanId }),
    ]);

    console.log(`✅ Đã xóa:
      - ${deletionResults[0].deletedCount} Reminder
      - ${deletionResults[1].deletedCount} MealTracking
      - ${deletionResults[2].deletedCount} Meal
      - ${deletionResults[3].deletedCount} MealDay
    `);

    return true;
  } catch (error) {
    console.error("🔥 Lỗi khi xóa dữ liệu MealPlan:", error);
    throw error;
  }
};

// Hàm lấy thông tin cái reminder và job cho MealPlan (để debug)
exports.getMealPlanReminders = async (req, res) => {
  try {
    const { mealPlanId } = req.params;
    const { _id: userId } = req.user;

    // Tìm MealPlan
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      return res.status(404).json({ success: false, message: "MealPlan không tồn tại" });
    }

    // Kiểm tra quyền
    if (
      mealPlan.userId.toString() !== userId.toString() &&
      mealPlan.createdBy.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem thông tin này",
      });
    }

    // Tìm tất cả reminder liên quan
    const reminders = await Reminder.find({ mealPlanId }).sort({ remindTime: 1 });

    // Tạo response chi tiết
    const reminderDetails = await Promise.all(
      reminders.map(async (reminder) => {
        let jobStatus = "Không có job";
        let nextRunAt = null;

        if (reminder.jobId) {
          // Kiểm tra job có tồn tại không
          const job = await agenda.jobs({ _id: reminder.jobId });
          if (job && job.length > 0) {
            jobStatus = job[0].attrs.nextRunAt ? "Đang lên lịch" : "Đã hủy";
            nextRunAt = job[0].attrs.nextRunAt;
          } else {
            jobStatus = "Job không tồn tại";
          }
        }

        return {
          _id: reminder._id,
          mealId: reminder.mealId,
          message: reminder.message,
          remindTime: reminder.remindTime,
          isActive: reminder.isActive,
          status: reminder.status,
          jobId: reminder.jobId,
          jobStatus,
          nextRunAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        mealPlanStatus: {
          isPause: mealPlan.isPause,
          isBlock: mealPlan.isBlock,
          isDelete: mealPlan.isDelete,
        },
        reminders: reminderDetails,
      },
    });
  } catch (error) {
    console.error("🔥 Lỗi khi lấy thông tin reminder:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// CRUD Meal to Day operations
// Add meal to Day
exports.addMealToDay = async (req, res) => {
  try {
    const { mealPlanId, mealDayId } = req.params;
    const { userId, mealTime, mealName, dishes = [] } = req.body; // ✅ Lấy userId từ body

    if (!userId) {
      return res.status(400).json({ success: false, message: "Thiếu userId" });
    }

    // 🔍 Kiểm tra MealPlan tồn tại & thuộc về user
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      return res.status(404).json({ success: false, message: "MealPlan không tồn tại" });
    }
    if (
      mealPlan.userId.toString() !== userId.toString() &&
      mealPlan.createdBy.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Bạn không có quyền chỉnh sửa MealPlan này" });
    }
    if (mealPlan.isBlock) {
      return res
        .status(403)
        .json({ success: false, message: "MealPlan bị khóa, không thể thêm bữa ăn" });
    }

    // 🔍 Kiểm tra MealDay tồn tại trong MealPlan
    const mealDay = await MealDay.findOne({
      _id: new mongoose.Types.ObjectId(mealDayId),
      mealPlanId: new mongoose.Types.ObjectId(mealPlanId),
    });
    if (!mealDay) {
      return res.status(404).json({ success: false, message: "Ngày ăn không hợp lệ" });
    }

    // ✅ Tạo Meal mới
    const newMeal = await Meal.create({
      mealDayId,
      mealTime,
      mealName,
      dishes,
    });

    res.status(201).json({ success: true, data: newMeal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get Meals By Day
exports.getMealsByDayId = async (req, res) => {
  try {
    const { mealPlanId, mealDayId } = req.params;
    const userId = req.user?.id; // Lấy userId từ middleware

    if (!userId) {
      return res.status(401).json({ success: false, message: "Bạn chưa đăng nhập" });
    }

    // Kiểm tra MealPlan tồn tại & thuộc về user
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      return res.status(404).json({ success: false, message: "MealPlan không tồn tại" });
    }
    if (
      mealPlan.userId.toString() !== userId.toString() &&
      mealPlan.createdBy.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Bạn không có quyền xem MealPlan này" });
    }

    // Kiểm tra MealDay tồn tại
    const mealDay = await MealDay.findOne({ _id: mealDayId, mealPlanId });
    if (!mealDay) {
      return res.status(404).json({ success: false, message: "Ngày ăn không hợp lệ" });
    }

    // Lấy danh sách bữa ăn
    const meals = await Meal.find({ mealDayId });

    res.status(200).json({ success: true, data: meals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get Meal Details
exports.getMealById = async (req, res) => {
  try {
    const { mealPlanId, mealDayId, mealId } = req.params;
    const userId = req.user?.id; // Lấy userId từ middleware isAuthenticated
    console.log("USERID", userId);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Bạn chưa đăng nhập" });
    }

    // Kiểm tra MealPlan tồn tại & thuộc về user
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      return res.status(404).json({ success: false, message: "MealPlan không tồn tại" });
    }
    if (
      mealPlan.userId.toString() !== userId.toString() &&
      mealPlan.createdBy.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Bạn không có quyền xem MealPlan này" });
    }

    // Kiểm tra MealDay tồn tại
    const mealDay = await MealDay.findOne({ _id: mealDayId, mealPlanId });
    if (!mealDay) {
      return res.status(404).json({ success: false, message: "Ngày ăn không hợp lệ" });
    }

    // Lấy thông tin bữa ăn
    const meal = await Meal.findOne({ _id: mealId, mealDayId });
    if (!meal) {
      return res.status(404).json({ success: false, message: "Bữa ăn không tồn tại" });
    }

    res.status(200).json({ success: true, data: meal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Update Meal in Day
exports.updateMealInDay = async (req, res) => {
  try {
    const { mealPlanId, mealDayId, mealId } = req.params;
    const { userId, mealTime, mealName } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "Thiếu userId" });
    }

    // 🔍 Kiểm tra MealPlan tồn tại & thuộc về user
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      return res.status(404).json({ success: false, message: "MealPlan không tồn tại" });
    }
    if (
      mealPlan.userId.toString() !== userId.toString() &&
      mealPlan.createdBy.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Bạn không có quyền chỉnh sửa MealPlan này" });
    }
    if (mealPlan.isBlock) {
      return res
        .status(403)
        .json({ success: false, message: "MealPlan bị khóa, không thể sửa bữa ăn" });
    }

    // 🔍 Kiểm tra Meal có tồn tại không
    const meal = await Meal.findOne({ _id: mealId, mealDayId });
    if (!meal) {
      return res.status(404).json({ success: false, message: "Bữa ăn không tồn tại" });
    }

    // ✅ Cập nhật Meal
    meal.mealTime = mealTime || meal.mealTime;
    meal.mealName = mealName || meal.mealName;
    await meal.save();

    // ✅ Cập nhật Reminder và Job liên quan
    await Reminder.updateMany({ mealId }, { time: mealTime });
    await Job.updateMany({ mealId }, { time: mealTime });

    // ✅ Cập nhật MealTracking nếu có
    await MealTracking.updateMany({ mealId }, { mealTime });

    res.status(200).json({ success: true, message: "Cập nhật bữa ăn thành công", data: meal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Delete Meal in Day
exports.deleteMealInDay = async (req, res) => {
  try {
    const { mealPlanId, mealDayId, mealId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "Thiếu userId" });
    }

    // 🔍 Kiểm tra MealPlan tồn tại & thuộc về user
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      return res.status(404).json({ success: false, message: "MealPlan không tồn tại" });
    }
    if (
      mealPlan.userId.toString() !== userId.toString() &&
      mealPlan.createdBy.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Bạn không có quyền chỉnh sửa MealPlan này" });
    }
    if (mealPlan.isBlock) {
      return res
        .status(403)
        .json({ success: false, message: "MealPlan bị khóa, không thể xóa bữa ăn" });
    }

    // 🔍 Kiểm tra Meal tồn tại
    const meal = await Meal.findOne({ _id: mealId, mealDayId });
    if (!meal) {
      return res.status(404).json({ success: false, message: "Bữa ăn không tồn tại" });
    }

    // ✅ Xóa Meal
    await Meal.deleteOne({ _id: mealId });

    // ✅ Xóa Reminder và Job liên quan
    await Reminder.deleteMany({ mealId });
    await Job.deleteMany({ mealId });

    // ✅ Xóa MealTracking liên quan
    await MealTracking.deleteMany({ mealId });

    res.status(200).json({ success: true, message: "Xóa bữa ăn thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CRUD Dish to Meal
const moment = require("moment-timezone");
const handleReminderAndJob = async (userId, mealPlanId, mealDayId, mealId, meal, mealDay) => {
  // Không tạo Reminder nếu không có món ăn
  if (!meal || !meal.dishes || meal.dishes.length === 0) {
    console.log(`🚨 Không có món ăn, xóa tất cả reminder của meal ${mealId}`);

    // Tìm và xóa tất cả Reminder cũ nếu có
    const existingReminders = await Reminder.find({ userId, mealPlanId, mealDayId, mealId });

    for (const existingReminder of existingReminders) {
      if (existingReminder.jobId) {
        console.log(`🗑️ Hủy job cũ ${existingReminder.jobId}`);
        await agenda.cancel({ _id: existingReminder.jobId });
      }
      console.log(`🗑️ Xóa reminder cũ ${existingReminder._id}`);
      await Reminder.deleteOne({ _id: existingReminder._id });
    }
    return null;
  }

  const remindTime = moment
    .tz(`${mealDay.date} ${meal.mealTime}`, "YYYY-MM-DD HH:mm", "Asia/Ho_Chi_Minh")
    .toDate();

  const dishNames = meal.dishes.map((dish) => dish.name).join(", ");
  const message = `📢 Đến giờ ăn ${meal.mealName}, bạn có: ${dishNames}!`;

  // Tìm reminder hiện tại cho mealId này
  let existingReminders = await Reminder.find({ userId, mealPlanId, mealDayId, mealId });

  if (existingReminders.length > 1) {
    console.log(
      `⚠️ Có ${existingReminders.length} reminder dư thừa, giữ lại 1 và xóa phần còn lại`
    );

    for (let i = 1; i < existingReminders.length; i++) {
      console.log(`🗑️ Xóa reminder dư thừa ${existingReminders[i]._id}`);
      await Reminder.deleteOne({ _id: existingReminders[i]._id });
    }

    // Chỉ giữ lại reminder đầu tiên
    existingReminders = [existingReminders[0]];
  }

  let reminder = existingReminders.length > 0 ? existingReminders[0] : null;

  if (reminder) {
    console.log(`⚠️ Cập nhật Reminder hiện có: ${reminder._id}`);

    // Cập nhật thông tin reminder
    reminder.remindTime = remindTime;
    reminder.message = message;
    reminder.status = "scheduled";

    await reminder.save();
  } else {
    console.log(`📆 Tạo mới Reminder vào: ${remindTime.toISOString()}`);

    reminder = new Reminder({
      userId,
      mealPlanId,
      mealDayId,
      mealId,
      message,
      remindTime,
      isActive: true,
      status: "scheduled",
      jobId: null,
    });

    await reminder.save();
  }

  // Hủy tất cả các job cũ liên quan đến reminder này
  const existingJobs = await agenda.jobs({
    "data.reminderId": reminder._id,
    nextRunAt: { $ne: null },
  });

  if (existingJobs.length > 0) {
    console.log(`⚠️ Phát hiện ${existingJobs.length} job dư thừa cho reminder ${reminder._id}`);

    for (const job of existingJobs) {
      console.log(`🗑️ Hủy job cũ ${job.attrs._id}`);
      await agenda.cancel({ _id: job.attrs._id });
    }
  }

  // Tạo Job mới
  const job = await agenda.schedule(remindTime, "sendReminder", {
    reminderId: reminder._id,
    userId,
    message,
  });

  // Lưu jobId vào Reminder
  reminder.jobId = job.attrs._id;
  await reminder.save();

  console.log(`✅ Đã cập nhật reminder ${reminder._id} với jobId ${reminder.jobId}`);
  return reminder;
};

// Bổ sung thêm hàm dọn dẹp
exports.cleanupRedundantJobs = async (req, res) => {
  try {
    const { userId } = req.params;

    // Tìm tất cả reminder của user
    const reminders = await Reminder.find({ userId });
    console.log(`🔍 Tìm thấy ${reminders.length} reminder cho user ${userId}`);

    let redundantJobsCount = 0;

    // Duyệt qua từng reminder
    for (const reminder of reminders) {
      // Tìm tất cả job liên quan đến reminder này
      const jobs = await agenda.jobs({
        "data.reminderId": reminder._id,
        nextRunAt: { $ne: null },
      });

      // Nếu có nhiều hơn 1 job, giữ lại job cuối cùng và xóa các job còn lại
      if (jobs.length > 1) {
        console.log(`⚠️ Phát hiện ${jobs.length} job cho reminder ${reminder._id}`);

        // Sắp xếp job theo thời gian tạo giảm dần
        jobs.sort((a, b) => new Date(b.attrs.lastModifiedAt) - new Date(a.attrs.lastModifiedAt));

        // Giữ lại job đầu tiên (mới nhất), xóa các job còn lại
        for (let i = 1; i < jobs.length; i++) {
          console.log(`🗑️ Hủy job dư thừa ${jobs[i].attrs._id}`);
          await agenda.cancel({ _id: jobs[i].attrs._id });
          redundantJobsCount++;
        }

        // Cập nhật jobId trong reminder nếu cần
        if (reminder.jobId.toString() !== jobs[0].attrs._id.toString()) {
          reminder.jobId = jobs[0].attrs._id;
          await reminder.save();
          console.log(`✅ Cập nhật reminder ${reminder._id} với jobId mới ${reminder.jobId}`);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Đã dọn dẹp ${redundantJobsCount} job dư thừa`,
      data: { redundantJobsCount },
    });
  } catch (error) {
    console.error("🔥 Lỗi khi dọn dẹp job:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
// Get Dish By Meal
exports.getDishesByMeal = async (req, res) => {
  try {
    const { mealPlanId, mealDayId, mealId } = req.params;
    const userId = req.user.id; // Lấy userId từ middleware xác thực

    // Kiểm tra MealPlan tồn tại & thuộc về user
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      return res.status(404).json({ success: false, message: "MealPlan không tồn tại" });
    }
    if (
      mealPlan.userId.toString() !== userId.toString() &&
      mealPlan.createdBy.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Bạn không có quyền xem MealPlan này" });
    }

    // Kiểm tra MealDay tồn tại
    const mealDay = await MealDay.findOne({ _id: mealDayId, mealPlanId });
    if (!mealDay) {
      return res.status(404).json({ success: false, message: "Ngày ăn không hợp lệ" });
    }

    // Lấy thông tin bữa ăn & populate dishes
    const meal = await Meal.findOne({ _id: mealId, mealDayId }).populate("dishes.dishId");

    if (!meal) {
      return res.status(404).json({ success: false, message: "Bữa ăn không tồn tại" });
    }

    res.status(200).json({ success: true, data: meal.dishes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ADD Dish to Meal
exports.addDishesToMeal = async (req, res) => {
  try {
    const { mealPlanId, mealDayId, mealId } = req.params;
    const { dishes, userId } = req.body;

    if (!userId) return res.status(400).json({ success: false, message: "Thiếu userId" });
    if (!Array.isArray(dishes) || dishes.length === 0)
      return res.status(400).json({ success: false, message: "Danh sách món ăn không hợp lệ" });

    // Kiểm tra MealPlan
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan)
      return res.status(404).json({ success: false, message: "MealPlan không tồn tại" });
    if (mealPlan.isBlock)
      return res
        .status(403)
        .json({ success: false, message: "MealPlan bị khóa, không thể thêm món ăn" });
    if (
      mealPlan.userId.toString() !== userId.toString() &&
      mealPlan.createdBy.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Bạn không có quyền chỉnh sửa MealPlan này" });
    }

    // Kiểm tra MealDay và Meal
    const mealDay = await MealDay.findOne({ _id: mealDayId, mealPlanId });
    if (!mealDay) return res.status(404).json({ success: false, message: "Ngày ăn không hợp lệ" });

    const meal = await Meal.findOne({ _id: mealId, mealDayId });
    if (!meal) return res.status(404).json({ success: false, message: "Bữa ăn không hợp lệ" });

    // Thêm món ăn vào meal, tránh trùng lặp
    const existingDishes = new Set(meal.dishes.map((dish) => JSON.stringify(dish)));
    dishes.forEach((dish) =>
      existingDishes.add(
        JSON.stringify({ dishId: dish.dishId, name: dish.name, calories: dish.calories })
      )
    );
    meal.dishes = Array.from(existingDishes).map((dish) => JSON.parse(dish));

    await meal.save();

    // Chỉ tạo MealTracking nếu chưa có
    let tracking = await MealTracking.findOne({ userId, mealPlanId, mealDayId, mealId });
    if (!tracking) {
      tracking = await MealTracking.create({
        userId,
        mealPlanId,
        mealDayId,
        mealId,
        isDone: false,
      });
    }

    // Cập nhật Reminder và Job
    await handleReminderAndJob(userId, mealPlanId, mealDayId, mealId, meal, mealDay);

    res.status(200).json({ success: true, data: { meal, tracking } });
  } catch (error) {
    console.error("🔥 Lỗi khi thêm món vào Meal:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE Dish from Meal
exports.deleteDishFromMeal = async (req, res) => {
  try {
    const { mealPlanId, mealDayId, mealId, dishId } = req.params;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ success: false, message: "Thiếu userId" });

    // Kiểm tra MealPlan
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan)
      return res.status(404).json({ success: false, message: "MealPlan không tồn tại" });
    if (mealPlan.isBlock)
      return res
        .status(403)
        .json({ success: false, message: "MealPlan bị khóa, không thể xóa món ăn" });
    if (
      mealPlan.userId.toString() !== userId.toString() &&
      mealPlan.createdBy.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Bạn không có quyền chỉnh sửa MealPlan này" });
    }

    // Tìm MealDay và Meal
    const mealDay = await MealDay.findOne({ _id: mealDayId, mealPlanId });
    if (!mealDay) return res.status(404).json({ success: false, message: "Ngày ăn không hợp lệ" });

    const meal = await Meal.findOne({ _id: mealId, mealDayId });
    if (!meal) return res.status(404).json({ success: false, message: "Bữa ăn không hợp lệ" });

    // Kiểm tra xem món ăn có tồn tại không
    const dishIndex = meal.dishes.findIndex((dish) => dish.dishId.toString() === dishId);
    if (dishIndex === -1)
      return res.status(404).json({ success: false, message: "Món ăn không tồn tại trong bữa ăn" });

    // Xóa món ăn khỏi danh sách
    meal.dishes.splice(dishIndex, 1);
    await meal.save();

    if (meal.dishes.length === 0) {
      // Nếu không còn món ăn, xóa Reminder và Job
      const reminder = await Reminder.findOne({ userId, mealPlanId, mealDayId, mealId });
      if (reminder) {
        await Reminder.deleteOne({ _id: reminder._id });
        await agenda.cancel({ "data.reminderId": reminder._id });
      }

      // Nếu MealTracking tồn tại, xóa luôn
      const tracking = await MealTracking.findOne({ userId, mealPlanId, mealDayId, mealId });
      if (tracking) {
        await MealTracking.deleteOne({ _id: tracking._id });
      }
    } else {
      // Nếu vẫn còn món ăn, cập nhật lại Reminder và Job
      await handleReminderAndJob(userId, mealPlanId, mealDayId, mealId, meal, mealDay);
    }

    res.status(200).json({ success: true, data: meal });
  } catch (error) {
    console.error("🔥 Lỗi khi xóa món ăn:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
