const Reminder = require("../models/Reminder");
const { agenda } = require("../config/agenda");
const sinon = require("sinon");

let clock; // Biến để giữ fake timer

exports.setFakeTime = async (req, res) => {
  try {
    const { fakeTime } = req.body;
    if (!fakeTime) {
      return res.status(400).json({ status: "fail", message: "fakeTime is required!" });
    }

    let fakeDate = new Date(fakeTime);
    if (isNaN(fakeDate.getTime())) {
      return res.status(400).json({ status: "fail", message: "Invalid date format" });
    }

    console.log("🕒 Thời gian hệ thống TRƯỚC khi fake:", new Date().toISOString());

    // Nếu đã fake trước đó, reset lại
    if (clock) {
      clock.restore();
    }

    // Fake thời gian nhưng vẫn cho nó tiếp tục chạy
    clock = sinon.useFakeTimers({
      now: fakeDate.getTime(), // Đặt thời gian hiện tại thành fakeTime
      shouldAdvanceTime: true, // Giúp thời gian tiếp tục trôi như bình thường
    });

    console.log("🕒 Thời gian hệ thống SAU khi fake:", new Date().toISOString());

    // Khởi động lại Agenda
    await agenda.stop();
    await agenda.start();

    // Cập nhật `nextRunAt` để các job chạy ngay khi đạt thời gian
    const jobs = await agenda.jobs({});
    for (const job of jobs) {
      if (job.attrs.nextRunAt && job.attrs.nextRunAt <= fakeDate) {
        let newRunTime = new Date(fakeDate);
        newRunTime.setSeconds(newRunTime.getSeconds() + 3);
        job.attrs.nextRunAt = newRunTime;
        await job.save();
        console.log(
          `🔄 Cập nhật job ${job.attrs.name} để chạy vào ${newRunTime.toISOString()} UTC.`
        );
      }
    }

    // Log danh sách job sau khi cập nhật
    const updatedJobs = await agenda.jobs({});
    console.log(
      "📌 Danh sách job sau khi cập nhật:",
      updatedJobs.map((job) => ({
        name: job.attrs.name,
        nextRunAt: job.attrs.nextRunAt.toISOString(),
      }))
    );

    res.json({
      status: "success",
      message: `Fake time set to ${fakeDate.toISOString()} UTC (thời gian tiếp tục chạy)`,
      systemTime: new Date().toISOString(),
      jobsScheduled: updatedJobs.map((job) => ({
        name: job.attrs.name,
        nextRunAt: job.attrs.nextRunAt.toISOString(),
      })),
    });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// // Reset về thời gian thực
// exports.resetTime = (req, res) => {
//   MockDate.reset();
//   res.json({ status: "success", message: "Reset time to real-time" });
// };

// 🛠️ Tạo Reminder với mealsByDay lên lịch bằng Agenda
const moment = require("moment-timezone");
const { scheduleReminderJob } = require("../jobs/reminderJobs");

// 📌 Hàm tạo nhắc nhở từ MealPlan
exports.createRemindersForMealPlan = async (mealPlan) => {
  try {
    const { userId, _id: mealPlanId, mealsByDay } = mealPlan;
    let reminders = [];

    for (const day of mealsByDay) {
      for (const meal of day.meals) {
        // Chuyển đổi thời gian nhắc nhở
        const remindTime = moment
          .tz(`${day.date} ${meal.mealTime}`, "YYYY-MM-DD HH:mm", "Asia/Ho_Chi_Minh")
          .utc()
          .toDate();

        // Tạo message từ danh sách món ăn
        const dishesList = meal.dishes.map((dish) => dish.name).join(", ");
        const message = `📢 Đến giờ ăn ${meal.mealName}, bạn có món: ${dishesList}`;

        // Kiểm tra xem Reminder đã tồn tại chưa
        let existingReminder = await Reminder.findOne({ userId, mealPlanId, remindTime });

        if (!existingReminder) {
          // Tạo mới Reminder
          existingReminder = await Reminder.create({
            userId,
            mealPlanId,
            message,
            remindTime,
            status: "scheduled", // Thêm trạng thái mặc định
          });

          console.log(`📆 Lên lịch nhắc nhở vào: ${remindTime.toISOString()}`);

          // 🔹 Tạo Job trong Agenda với đủ thông tin
          const job = await agenda.schedule(remindTime, "sendReminder", {
            reminderId: existingReminder._id,
            userId,
            message,
          });
          // // 🔹 Tạo một job chạy ngay để test (có chứa userId và message)
          // await scheduleReminderJob(
          //   agenda,
          //   "in 2 seconds",
          //   reminders[0]?._id || null, // Chỉ truyền ObjectId
          //   userId, // Truyền userId
          //   "One-time job khi tạo MealPlan"
          // );
          // Gán jobId vào Reminder
          existingReminder.jobId = job.attrs._id;
          await existingReminder.save();
        } else {
          console.log(`⚠️ Reminder đã tồn tại: ${remindTime.toISOString()}`);
        }

        reminders.push(existingReminder);
      }
    }

    return reminders;
  } catch (error) {
    console.error("🔥 Lỗi khi tạo reminders:", error);
    throw error;
  }
};
// 📌 Lấy tất cả Reminder (chỉ lấy những cái chưa bị xóa)
exports.getAllReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find();
    res.status(200).json({ status: "success", data: reminders });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// 🔍 Lấy Reminder theo ID
exports.getReminderById = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.reminderId);
    if (!reminder) {
      return res.status(404).json({ status: "fail", message: "Reminder not found" });
    }
    res.status(200).json({ status: "success", data: reminder });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// ✏️ Cập nhật Reminder
exports.updateReminder = async (req, res) => {
  try {
    const updatedReminder = await Reminder.findByIdAndUpdate(req.params.reminderId, req.body, {
      new: true,
    });
    if (!updatedReminder) {
      return res.status(404).json({ status: "fail", message: "Reminder not found" });
    }
    res.status(200).json({ status: "success", data: updatedReminder });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// 🗑️ Xóa Reminder (Cập nhật isDelete = true)
exports.deleteReminder = async (req, res) => {
  try {
    const { reminderId } = req.params;

    // Lấy Reminder từ DB
    const reminder = await Reminder.findById(reminderId);
    if (!reminder) return res.status(404).json({ message: "Reminder not found" });

    // Hủy job trong Agenda
    if (reminder.jobId) await agenda.cancel({ _id: reminder.jobId });

    // Xóa Reminder khỏi DB
    await Reminder.findByIdAndDelete(reminderId);

    res.json({ message: "Reminder deleted and job canceled!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
