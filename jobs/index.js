/**
 * 📌 Tập hợp và export tất cả các jobs
 */
const { defineOneTimeJob, scheduleOneTimeJob } = require("./oneTimeJob");
const { defineRepeatingJob, scheduleRepeatingJob } = require("./repeatJobs");
const { defineReminderJob, scheduleReminderJob } = require("./reminderJobs");
const { defineCleanupPaymentJob, scheduleCleanupPaymentJob } = require("./cleanUpPaymentJob");

module.exports = (agenda, io) => {
  // 🛠 Định nghĩa tất cả jobs
  defineOneTimeJob(agenda);
  defineRepeatingJob(agenda);
  defineReminderJob(agenda, io);
  defineCleanupPaymentJob(agenda);

  // ⏳ Hàm để lên lịch tất cả jobs
  const scheduleAllJobs = () => {
    scheduleOneTimeJob(agenda);
    scheduleCleanupPaymentJob(agenda);
    //scheduleRepeatingJob(agenda);
    //scheduleReminderJob(agenda);
  };

  return {
    scheduleAllJobs,
  };
};
