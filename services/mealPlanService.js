const {
  MealPlan,
  MealDay,
  Meal,
  MealTracking,
  UserMealPlan,
  UserMealPlanHistory,
} = require("../models/MealPlan");
const UserModel = require("../models/UserModel");
const Reminder = require("../models/Reminder");
const { agenda } = require("../config/agenda");
const AppError = require("../utils/appError");
const moment = require("moment-timezone");
const { scheduleReminderJob } = require("../jobs/reminderJobs");

class MealPlanService {
  static async applyPaginationAndSort(query, page, limit, sort, order) {
    const skip = (page - 1) * limit;
    const sortOrder = order === "desc" ? -1 : 1;
    return query
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  static async createMealPlan(data) {
    const { title, userId, type, duration, startDate, createdBy, meals, price } = data;

    if (type === "fixed" && (!meals || !Array.isArray(meals) || meals.length === 0)) {
      throw new AppError("Danh sách bữa ăn không hợp lệ", 400);
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration - 1);

    const isNutritionistCreated = createdBy.toString() !== userId.toString();
    const isBlock = isNutritionistCreated;
    const mealPlanPrice = isNutritionistCreated ? price || 0 : 0;

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
      isPaid: !isNutritionistCreated,
    });

    if (!isNutritionistCreated) {
      await UserMealPlan.findOneAndUpdate(
        { userId },
        { mealPlanId: mealPlan._id, startDate },
        { upsert: true, new: true }
      );
    }

    for (let i = 0; i < duration; i++) {
      const mealDayDate = new Date(startDate);
      mealDayDate.setDate(mealDayDate.getDate() + i);

      const mealDay = await MealDay.create({
        mealPlanId: mealPlan._id,
        date: mealDayDate.toISOString().split("T")[0],
      });

      if (type === "fixed" && meals) {
        const mealPromises = meals.map((meal) =>
          Meal.create({
            mealDayId: mealDay._id,
            mealTime: meal.mealTime,
            mealName: meal.mealName,
          })
        );
        await Promise.all(mealPromises);
      }
    }

    return mealPlan;
  }

  static async getAllMealPlanNutritionistCreatedBy(nutritionistId, { page, limit, sort, order }) {
    const filter = { isDelete: false, createdBy: nutritionistId };
    const totalMealPlans = await MealPlan.countDocuments(filter);

    const mealPlans = await this.applyPaginationAndSort(
      MealPlan.find(filter).populate({
        path: "userId",
        select: "email avatarUrl username",
        options: { lean: true },
      }),
      page,
      limit,
      sort,
      order
    );

    const allMealPlans = await MealPlan.find(filter);
    const unpaidMealPlans = allMealPlans.filter((mp) => !mp.paymentId).length;
    const activeMealPlans = allMealPlans.filter(
      (mp) => mp.paymentId && !mp.isBlock && !mp.isPause
    ).length;

    const formattedMealPlans = mealPlans.map((mealPlan) => ({
      ...mealPlan,
      userId: mealPlan.userId || {
        email: "Unknown",
        avatarUrl: "https://i.pinimg.com/736x/81/ec/02/81ec02c841e7aa13d0f099b5df02b25c.jpg",
        username: "Unknown",
      },
    }));

    return {
      totalMealPlans,
      totalPages: Math.ceil(totalMealPlans / limit),
      data: {
        mealPlans: formattedMealPlans,
        summary: { totalMealPlans, unpaidMealPlans, activeMealPlans },
      },
    };
  }

  static async getAllNutritionistsWithMealPlans({ page, limit, sort, order, month, year }) {
    const filter = { role: "nutritionist", isDelete: false };
    const totalNutritionists = await UserModel.countDocuments(filter);

    const nutritionists = await this.applyPaginationAndSort(
      UserModel.find(filter).select("username email avatarUrl"),
      page,
      limit,
      sort,
      order
    );

    const nutritionistsWithMealPlans = await Promise.all(
      nutritionists.map(async (nutri) => {
        const mealPlanFilter = { createdBy: nutri._id, isDelete: false };
        if (month && year) {
          const startOfMonth = new Date(year, month - 1, 1);
          const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
          mealPlanFilter.startDate = { $gte: startOfMonth, $lte: endOfMonth };
        }

        const mealPlans = await MealPlan.find(mealPlanFilter)
          .populate("userId", "email avatarUrl username")
          .populate("createdBy", "username email avatarUrl");

        return {
          id: nutri._id,
          name: nutri.username,
          mealPlans,
          mealPlanCount: mealPlans.length,
          successCount: mealPlans.filter((mp) => !mp.isBlock).length,
          pendingCount: mealPlans.filter((mp) => mp.isBlock).length,
        };
      })
    );

    return {
      totalNutritionists,
      totalPages: Math.ceil(totalNutritionists / limit),
      data: { nutritionists: nutritionistsWithMealPlans },
    };
  }

  static async getAllMealPlanAdmin({ page, limit, sort, order }) {
    const filter = { isDelete: false };
    const totalMealPlans = await MealPlan.countDocuments(filter);

    const mealPlans = await this.applyPaginationAndSort(
      MealPlan.find(filter)
        .populate("userId", "email avatarUrl username")
        .populate("createdBy", "username email avatarUrl"),
      page,
      limit,
      sort,
      order
    );

    const unpaidMealPlans = await MealPlan.countDocuments({ ...filter, isPaid: false });
    const activeMealPlans = await MealPlan.countDocuments({
      ...filter,
      isPaid: true,
      isBlock: false,
    });

    return {
      totalMealPlans,
      totalPages: Math.ceil(totalMealPlans / limit),
      data: {
        mealPlans,
        summary: { totalMealPlans, unpaidMealPlans, activeMealPlans },
      },
    };
  }

  static async getMealPlanById(mealPlanId, userId, role) {
    let filter = { _id: mealPlanId };
    if (role === "user") {
      filter.userId = userId;
    } else if (role === "nutritionist" || role === "admin") {
      filter.$or = [{ createdBy: userId }, { userId }];
    } else {
      throw new AppError("Vai trò không hợp lệ", 403);
    }

    const mealPlan = await MealPlan.findOne(filter).lean();
    if (!mealPlan) throw new AppError("Không tìm thấy MealPlan", 404);
    return mealPlan;
  }

  static async getUserMealPlan(userId) {
    const userMealPlan = await UserMealPlan.findOne({ userId }).populate("mealPlanId");
    if (!userMealPlan || !userMealPlan.mealPlanId) {
      throw new AppError("User chưa có MealPlan nào", 404);
    }
    return userMealPlan.mealPlanId;
  }

  static async getMealDayByMealPlan(mealPlanId) {
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) throw new AppError("MealPlan không tồn tại", 404);

    return await MealDay.find({ mealPlanId });
  }

  static async getUnpaidMealPlanForUser(userId) {
    try {
      const mealPlans = await MealPlan.find({
        userId,
        isBlock: true,
        isDelete: false,
      });

      // Trả về mảng rỗng nếu không tìm thấy
      if (mealPlans.length === 0) {
        return {
          status: "success",
          data: [],
        };
      }

      // Map dữ liệu trả về
      const result = mealPlans.map((mealPlan) => ({
        _id: mealPlan._id,
        title: mealPlan.title,
        price: mealPlan.price,
        duration: mealPlan.duration,
        startDate: mealPlan.startDate,
        isBlock: mealPlan.isBlock,
      }));

      return {
        status: "success",
        data: result,
      };
    } catch (error) {
      // Xử lý lỗi bất ngờ
      throw new AppError(error.message || "Failed to fetch unpaid meal plans", error.status || 500);
    }
  }

  static async getMealPlanDetails(mealPlanId) {
    const mealPlan = await MealPlan.findById(mealPlanId).lean();
    if (!mealPlan) throw new AppError("Meal plan not found", 404);

    const firstMealDay = await MealDay.findOne({ mealPlanId }).sort({ date: 1 }).lean();
    if (!firstMealDay) throw new AppError("No meal days found for this meal plan", 404);

    const meals = await Meal.find({ mealDayId: firstMealDay._id }).lean();

    return {
      _id: mealPlan._id,
      title: mealPlan.title,
      duration: mealPlan.duration,
      startDate: mealPlan.startDate,
      endDate: mealPlan.endDate,
      price: mealPlan.price,
      days: [{ ...firstMealDay, meals }],
    };
  }

  static async updateMealPlan(mealPlanId, updates, userId, role) {
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) throw new AppError("MealPlan không tồn tại", 404);

    const isOwner = mealPlan.userId.toString() === userId.toString();
    const isCreator = mealPlan.createdBy.toString() === userId.toString();
    const isNutritionist = role === "nutritionist";

    if (!isOwner && !isCreator && !isNutritionist) {
      throw new AppError("Bạn không có quyền cập nhật MealPlan này", 403);
    }

    const { isPause, isDelete, price, isBlock } = updates;

    if (typeof isPause !== "undefined" && mealPlan.isPause !== isPause) {
      mealPlan.isPause = isPause;
      await this.updateRemindersForMealPlan(mealPlanId, isPause);
    }

    if (isDelete === true) {
      mealPlan.isDelete = true;
      await this.deleteMealPlanData(mealPlanId);
      await mealPlan.save();
      return { _id: mealPlanId };
    }

    if (isNutritionist || isCreator) {
      if (typeof price !== "undefined") mealPlan.price = price;
      if (typeof isBlock !== "undefined" && mealPlan.isBlock !== isBlock) {
        mealPlan.isBlock = isBlock;
        await this.updateRemindersForMealPlan(mealPlanId, isBlock ? true : mealPlan.isPause);
      }
    }

    await mealPlan.save();
    return mealPlan;
  }

  static async deleteMealPlan(mealPlanId, userId) {
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) throw new AppError("MealPlan không tồn tại", 404);

    if (
      mealPlan.userId.toString() !== userId.toString() &&
      mealPlan.createdBy.toString() !== userId.toString()
    ) {
      throw new AppError("Bạn không có quyền xóa MealPlan này", 403);
    }

    await this.deleteMealPlanData(mealPlanId);
    await MealPlan.findByIdAndUpdate(mealPlanId, { isDelete: true }, { new: true });
    await UserMealPlan.findOneAndUpdate(
      { userId, mealPlanId },
      { mealPlanId: null },
      { new: true }
    );
  }

  static async toggleMealPlanStatus(mealPlanId, isPause, userId) {
    if (typeof isPause !== "boolean") throw new AppError("isPause must be true or false", 400);

    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) throw new AppError("MealPlan not found", 404);

    if (
      mealPlan.userId.toString() !== userId.toString() &&
      mealPlan.createdBy.toString() !== userId.toString()
    ) {
      throw new AppError("You do not have permission to update this MealPlan", 403);
    }

    if (mealPlan.isBlock && mealPlan.createdBy.toString() !== userId.toString()) {
      throw new AppError("MealPlan is locked, you cannot change its status", 403);
    }

    if (mealPlan.isPause === isPause) return mealPlan;

    mealPlan.isPause = isPause;
    await mealPlan.save();
    await this.updateRemindersForMealPlan(mealPlanId, isPause);

    return mealPlan;
  }

  static async getMealPlanReminders(mealPlanId, userId) {
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) throw new AppError("MealPlan không tồn tại", 404);

    if (
      mealPlan.userId.toString() !== userId.toString() &&
      mealPlan.createdBy.toString() !== userId.toString()
    ) {
      throw new AppError("Bạn không có quyền xem thông tin này", 403);
    }

    const reminders = await Reminder.find({ mealPlanId }).sort({ remindTime: 1 });
    const reminderDetails = await Promise.all(
      reminders.map(async (reminder) => {
        let jobStatus = "Không có job";
        let nextRunAt = null;
        if (reminder.jobId) {
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

    return {
      mealPlanStatus: {
        isPause: mealPlan.isPause,
        isBlock: mealPlan.isBlock,
        isDelete: mealPlan.isDelete,
      },
      reminders: reminderDetails,
    };
  }
  // Check MEAL PLAN STATUS
  static async checkMealPlanStatus(mealPlanId) {
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) throw new AppError("MealPlan does not exist", 404);

    const currentDate = new Date();
    if (mealPlan.endDate < currentDate) {
      throw new AppError("MealPlan has expired", 403);
    }
    // if (mealPlan.isBlock) {
    //   throw new AppError("MealPlan is locked", 403);
    // }
    if (mealPlan.isPause) {
      throw new AppError("MealPlan is paused", 403);
    }
    return mealPlan;
  }
  static async addMealToDay(mealPlanId, mealDayId, { mealTime, mealName, dishes }, userId, role) {
    // Kiểm tra trạng thái MealPlan
    const mealPlan = await this.checkMealPlanStatus(mealPlanId);

    // Kiểm tra quyền
    const isUserAuthorized =
      mealPlan.userId.toString() === userId.toString() ||
      mealPlan.createdBy.toString() === userId.toString();
    let isNutritionistAuthorized = false;
    if (role === "nutritionist") {
      const mealPlanUser = await UserModel.findById(mealPlan.userId);
      if (mealPlanUser && mealPlanUser.nutritionistId?.toString() === userId.toString()) {
        isNutritionistAuthorized = true;
      }
    }

    if (!isUserAuthorized && !isNutritionistAuthorized) {
      throw new AppError("You do not have permission to edit this MealPlan", 403);
    }

    const mealDay = await MealDay.findOne({ _id: mealDayId, mealPlanId });
    if (!mealDay) throw new AppError("MealDay is invalid", 404);

    return await Meal.create({ mealDayId, mealTime, mealName, dishes });
  }

  static async removeMealFromDay(mealPlanId, mealDayId, mealId, userId, role) {
    // Kiểm tra trạng thái MealPlan
    const mealPlan = await this.checkMealPlanStatus(mealPlanId);

    // Kiểm tra quyền
    const isUserAuthorized =
      mealPlan.userId.toString() === userId.toString() ||
      mealPlan.createdBy.toString() === userId.toString();
    let isNutritionistAuthorized = false;
    if (role === "nutritionist") {
      const mealPlanUser = await UserModel.findById(mealPlan.userId);
      if (mealPlanUser && mealPlanUser.nutritionistId?.toString() === userId.toString()) {
        isNutritionistAuthorized = true;
      }
    }

    if (!isUserAuthorized && !isNutritionistAuthorized) {
      throw new AppError("You do not have permission to edit this MealPlan", 403);
    }

    const mealDay = await MealDay.findOne({ _id: mealDayId, mealPlanId });
    if (!mealDay) throw new AppError("MealDay is invalid", 404);

    const meal = await Meal.findOne({ _id: mealId, mealDayId });
    if (!meal) throw new AppError("Meal does not exist", 404);

    // Xóa meal
    await Meal.findByIdAndDelete(mealId);

    // Xóa reminder và job liên quan
    await Reminder.deleteMany({ userId, mealPlanId, mealDayId, mealId });
    // Giả sử bạn có hàm xóa job, nếu không thì bỏ qua dòng này
    // await this.cancelJob(userId, mealPlanId, mealDayId, mealId);

    return { mealDayId: mealDay._id };
  }

  static async getMealsByDayId(mealPlanId, mealDayId, userId) {
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) throw new AppError("MealPlan không tồn tại", 404);

    if (
      mealPlan.userId.toString() !== userId.toString() &&
      mealPlan.createdBy.toString() !== userId.toString()
    ) {
      throw new AppError("Bạn không có quyền xem MealPlan này", 403);
    }

    const mealDay = await MealDay.findOne({ _id: mealDayId, mealPlanId });
    if (!mealDay) throw new AppError("Ngày ăn không hợp lệ", 404);

    return await Meal.find({ mealDayId });
  }

  static async getMealById(mealPlanId, mealDayId, mealId, userId) {
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) throw new AppError("MealPlan không tồn tại", 404);

    if (
      mealPlan.userId.toString() !== userId.toString() &&
      mealPlan.createdBy.toString() !== userId.toString()
    ) {
      throw new AppError("Bạn không có quyền xem MealPlan này", 403);
    }

    const mealDay = await MealDay.findOne({ _id: mealDayId, mealPlanId });
    if (!mealDay) throw new AppError("Ngày ăn không hợp lệ", 404);

    const meal = await Meal.findOne({ _id: mealId, mealDayId });
    if (!meal) throw new AppError("Bữa ăn không tồn tại", 404);

    return meal;
  }

  static async updateMealInDay(mealPlanId, mealDayId, mealId, { userId, mealTime, mealName }) {
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) throw new AppError("MealPlan không tồn tại", 404);

    if (
      mealPlan.userId.toString() !== userId.toString() &&
      mealPlan.createdBy.toString() !== userId.toString()
    ) {
      throw new AppError("Bạn không có quyền chỉnh sửa MealPlan này", 403);
    }

    if (mealPlan.isBlock) throw new AppError("MealPlan bị khóa, không thể sửa bữa ăn", 403);

    const meal = await Meal.findOne({ _id: mealId, mealDayId });
    if (!meal) throw new AppError("Bữa ăn không tồn tại", 404);

    meal.mealTime = mealTime || meal.mealTime;
    meal.mealName = mealName || meal.mealName;
    await meal.save();

    await Reminder.updateMany({ mealId }, { time: mealTime });
    await MealTracking.updateMany({ mealId }, { mealTime });

    return meal;
  }

  static async deleteMealInDay(mealPlanId, mealDayId, mealId, userId) {
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) throw new AppError("MealPlan không tồn tại", 404);

    if (
      mealPlan.userId.toString() !== userId.toString() &&
      mealPlan.createdBy.toString() !== userId.toString()
    ) {
      throw new AppError("Bạn không có quyền chỉnh sửa MealPlan này", 403);
    }

    if (mealPlan.isBlock) throw new AppError("MealPlan bị khóa, không thể xóa bữa ăn", 403);

    const meal = await Meal.findOne({ _id: mealId, mealDayId });
    if (!meal) throw new AppError("Bữa ăn không tồn tại", 404);

    await Meal.deleteOne({ _id: mealId });
    await Reminder.deleteMany({ mealId });
    await MealTracking.deleteMany({ mealId });
  }

  static async getDishesByMeal(mealPlanId, mealDayId, mealId, userId) {
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) throw new AppError("MealPlan không tồn tại", 404);

    if (
      mealPlan.userId.toString() !== userId.toString() &&
      mealPlan.createdBy.toString() !== userId.toString()
    ) {
      throw new AppError("Bạn không có quyền xem MealPlan này", 403);
    }

    const mealDay = await MealDay.findOne({ _id: mealDayId, mealPlanId });
    if (!mealDay) throw new AppError("Ngày ăn không hợp lệ", 404);

    const meal = await Meal.findOne({ _id: mealId, mealDayId }).populate("dishes.dishId");
    if (!meal) throw new AppError("Bữa ăn không tồn tại", 404);

    return meal.dishes;
  }

  static async addDishesToMeal(mealPlanId, mealDayId, mealId, dishes, userId, role) {
    if (!Array.isArray(dishes) || dishes.length === 0) {
      throw new AppError("Invalid list of dishes", 400);
    }

    // Kiểm tra trạng thái MealPlan
    const mealPlan = await this.checkMealPlanStatus(mealPlanId);

    // Kiểm tra quyền
    const targetUserId = mealPlan.userId.toString();
    const isUserAuthorized =
      targetUserId === userId.toString() || mealPlan.createdBy.toString() === userId.toString();
    let isNutritionistAuthorized = false;
    if (role === "nutritionist") {
      const mealPlanUser = await UserModel.findById(targetUserId);
      if (mealPlanUser && mealPlanUser.nutritionistId?.toString() === userId.toString()) {
        isNutritionistAuthorized = true;
      }
    }

    if (!isUserAuthorized && !isNutritionistAuthorized) {
      throw new AppError("You do not have permission to edit this MealPlan", 403);
    }

    const mealDay = await MealDay.findOne({ _id: mealDayId, mealPlanId });
    if (!mealDay) throw new AppError("Invalid meal day", 404);

    const meal = await Meal.findOne({ _id: mealId, mealDayId });
    if (!meal) throw new AppError("Invalid meal", 404);

    // Thêm dishes
    const existingDishes = new Set(meal.dishes.map((dish) => JSON.stringify(dish)));
    dishes.forEach((dish) =>
      existingDishes.add(
        JSON.stringify({
          dishId: dish.dishId,
          recipeId: dish.recipeId,
          imageUrl: dish.imageUrl,
          name: dish.name,
          calories: dish.calories,
          protein: dish.protein,
          carbs: dish.carbs,
          fat: dish.fat,
        })
      )
    );
    meal.dishes = Array.from(existingDishes).map((dish) => JSON.parse(dish));
    await meal.save();

    // Xử lý reminder và job (nếu cần)
    await this.handleReminderAndJob(targetUserId, mealPlanId, mealDayId, mealId, meal, mealDay);

    return { meal };
  }

  static async deleteDishFromMeal(mealPlanId, mealDayId, mealId, dishId, userId, role) {
    // Kiểm tra trạng thái MealPlan
    const mealPlan = await this.checkMealPlanStatus(mealPlanId);

    // Kiểm tra quyền
    const isUserAuthorized =
      mealPlan.userId.toString() === userId.toString() ||
      mealPlan.createdBy.toString() === userId.toString();
    let isNutritionistAuthorized = false;
    if (role === "nutritionist") {
      const mealPlanUser = await UserModel.findById(mealPlan.userId);
      if (mealPlanUser && mealPlanUser.nutritionistId?.toString() === userId.toString()) {
        isNutritionistAuthorized = true;
      }
    }

    if (!isUserAuthorized && !isNutritionistAuthorized) {
      throw new AppError("You do not have permission to edit this MealPlan", 403);
    }

    const mealDay = await MealDay.findOne({ _id: mealDayId, mealPlanId });
    if (!mealDay) throw new AppError("Invalid meal day", 404);

    const meal = await Meal.findOne({ _id: mealId, mealDayId });
    if (!meal) throw new AppError("Invalid meal", 404);

    const dishIndex = meal.dishes.findIndex((dish) => dish._id?.toString() === dishId);
    if (dishIndex === -1) throw new AppError("Dish does not exist", 404);

    meal.dishes.splice(dishIndex, 1);
    await meal.save();

    // Xử lý reminder và job
    if (meal.dishes.length === 0) {
      await Reminder.deleteMany({ userId, mealPlanId, mealDayId, mealId });
      // await this.cancelJob(userId, mealPlanId, mealDayId, mealId); // Nếu có job
    } else {
      await this.handleReminderAndJob(userId, mealPlanId, mealDayId, mealId, meal, mealDay);
    }

    return { meal };
  }

  static async getAllMealPlanPayment(userId, role, { page, limit }) {
    let filter = { paymentId: { $exists: true, $ne: null }, isDelete: false };
    if (role === "user") {
      filter.userId = userId;
    } else if (role === "nutritionist") {
      filter.createdBy = userId;
    } else {
      throw new AppError("Invalid role", 403);
    }

    const totalMealPlans = await MealPlan.countDocuments(filter);
    const skip = (page - 1) * limit;

    const mealPlans = await MealPlan.find(filter)
      .skip(skip)
      .limit(limit)
      .populate("userId", "email avatarUrl")
      .populate("createdBy", "email avatarUrl")
      .lean();

    return {
      totalMealPlans,
      totalPages: Math.ceil(totalMealPlans / limit),
      data: {
        mealPlans: mealPlans.map((mealPlan) => ({
          _id: mealPlan._id,
          title: mealPlan.title,
          userId: mealPlan.userId,
          createdBy: mealPlan.createdBy,
          paymentId: mealPlan.paymentId,
          price: mealPlan.price,
          startDate: mealPlan.startDate,
          endDate: mealPlan.endDate,
          duration: mealPlan.duration,
          isPaid: mealPlan.isPaid,
          isBlock: mealPlan.isBlock,
        })),
      },
    };
  }

  static async getMealPlanHistory(userId) {
    const history = await UserMealPlanHistory.find({ userId }).populate("mealPlanId");
    return history;
  }

  static async cleanupRedundantJobs(userId) {
    const reminders = await Reminder.find({ userId });
    let redundantJobsCount = 0;

    for (const reminder of reminders) {
      const jobs = await agenda.jobs({ "data.reminderId": reminder._id, nextRunAt: { $ne: null } });
      if (jobs.length > 1) {
        jobs.sort((a, b) => new Date(b.attrs.lastModifiedAt) - new Date(a.attrs.lastModifiedAt));
        for (let i = 1; i < jobs.length; i++) {
          await agenda.cancel({ _id: jobs[i].attrs._id });
          redundantJobsCount++;
        }
        if (reminder.jobId.toString() !== jobs[0].attrs._id.toString()) {
          reminder.jobId = jobs[0].attrs._id;
          await reminder.save();
        }
      }
    }

    return { redundantJobsCount };
  }

  static async updateRemindersForMealPlan(mealPlanId, isPause) {
    const reminders = await Reminder.find({ mealPlanId });
    for (const reminder of reminders) {
      reminder.isActive = !isPause;
      if (isPause) {
        await agenda.cancel({ "data.reminderId": reminder._id });
        reminder.status = "paused";
      } else if (reminder.remindTime && new Date(reminder.remindTime) > new Date()) {
        await agenda.cancel({ "data.reminderId": reminder._id });
        const job = await agenda.schedule(reminder.remindTime, "sendReminder", {
          reminderId: reminder._id,
          userId: reminder.userId,
          message: reminder.message,
        });
        reminder.jobId = job.attrs._id;
        reminder.status = "scheduled";
      } else {
        reminder.status = "cancelled";
      }
      await reminder.save();
    }
  }

  static async deleteMealPlanData(mealPlanId) {
    const mealDays = await MealDay.find({ mealPlanId });
    const mealDayIds = mealDays.map((day) => day._id);
    const meals = await Meal.find({ mealDayId: { $in: mealDayIds } });
    const mealIds = meals.map((meal) => meal._id);
    const reminders = await Reminder.find({ mealPlanId });
    const reminderIds = reminders.map((reminder) => reminder._id);

    if (reminderIds.length > 0) {
      await agenda.cancel({ "data.reminderId": { $in: reminderIds } });
    }

    await Promise.all([
      Reminder.deleteMany({ mealPlanId }),
      MealTracking.deleteMany({ mealPlanId }),
      Meal.deleteMany({ mealDayId: { $in: mealDayIds } }),
      MealDay.deleteMany({ mealPlanId }),
    ]);
  }

  static async handleReminderAndJob(userId, mealPlanId, mealDayId, mealId, meal, mealDay) {
    console.log(`📌 Bắt đầu handleReminderAndJob cho User ${userId}, Meal ${mealId}`);

    if (!meal || !meal.dishes || meal.dishes.length === 0) {
      console.log(`⚠️ Meal ${mealId} không có món ăn, xóa reminder hiện tại`);
      const existingReminders = await Reminder.find({ userId, mealPlanId, mealDayId, mealId });
      for (const reminder of existingReminders) {
        if (reminder.jobId) await agenda.cancel({ _id: reminder.jobId });
        await Reminder.deleteOne({ _id: reminder._id });
      }
      return null;
    }

    const remindTime = moment
      .tz(`${mealDay.date} ${meal.mealTime}`, "YYYY-MM-DD HH:mm", "Asia/Ho_Chi_Minh")
      .toDate();
    const dishNames =
      meal.dishes
        .map((dish) => dish.name)
        .filter((name) => name)
        .join(", ") || "your meal";
    const message = `📢 It's mealtime! 🍽️ Time for ${
      meal.mealName || "your meal"
    }. You have: ${dishNames}!`;

    let reminder = await Reminder.findOne({ userId, mealPlanId, mealDayId, mealId });
    if (reminder) {
      console.log(`🔄 Cập nhật reminder ${reminder._id} với remindTime: ${remindTime}`);
      reminder.remindTime = remindTime;
      reminder.message = message;
      reminder.status = "scheduled";
    } else {
      console.log(`🆕 Tạo mới reminder cho User ${userId}, Meal ${mealId}`);
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
    }
    await reminder.save();

    const existingJobs = await agenda.jobs({
      "data.reminderId": reminder._id,
      nextRunAt: { $ne: null },
    });
    for (const job of existingJobs) {
      console.log(`🗑️ Hủy job cũ: ${job.attrs._id}`);
      await agenda.cancel({ _id: job.attrs._id });
    }

    const job = await scheduleReminderJob(agenda, remindTime, reminder._id, userId, message);
    console.log(`✅ Job được lên lịch với ID: ${job.attrs._id}`);
    reminder.jobId = job.attrs._id;
    await reminder.save();

    return reminder;
  }
}

module.exports = MealPlanService;
