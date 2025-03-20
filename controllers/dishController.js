const UserModel = require("../models/UserModel");
const jwt = require("jsonwebtoken"); // Thêm dòng này vào
const Dish = require("../models/Dish");
const Ingredient = require("../models/Ingredient");
const Ingredients = require("../models/Ingredient");
const Recipe = require("../models/Recipe");

// Dish CRUD Operations

// Create Dish
exports.createDish = async (req, res) => {
  try {
    const newDish = new Dish(req.body);
    await newDish.save();
    res.status(201).json({ status: "success", data: newDish });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};
// Create Many Dishes
exports.createManyDishes = async (req, res) => {
  try {
    const dishes = req.body; // Nhận mảng các món ăn từ request body

    // Kiểm tra xem dishes có phải là mảng không
    if (!Array.isArray(dishes) || dishes.length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "Input should be a non-empty array of dishes",
      });
    }

    // Tạo nhiều món ăn và lưu vào database
    const createdDishes = await Dish.insertMany(dishes);

    // Trả về kết quả
    res.status(201).json({ status: "success", data: createdDishes });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

// Read all Dishes
exports.getAllDishes = async (req, res) => {
  try {
    let filter = { isDelete: false, isVisible: true }; // Mặc định chỉ hiển thị món không bị xóa và có thể nhìn thấy

    // Lấy token từ request (cookie hoặc header)
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (token) {
      try {
        // Giải mã token để lấy user ID
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await UserModel.findById(decoded.id);

        if (user) {
          // Nếu là admin hoặc nutritionist, hiển thị tất cả món ăn
          if (user.role === "admin" || user.role === "nutritionist") {
            filter = {}; // Không áp dụng filter
          }
        }
      } catch (error) {
        console.error("Invalid token:", error.message);
      }
    }

    // Lấy danh sách món ăn theo điều kiện
    const dishes = await Dish.find(filter);
    res.status(200).json({ status: "success", data: dishes });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Read Dish by ID
exports.getDishById = async (req, res) => {
  try {
    const dish = await Dish.findOne({
      _id: req.params.dishId,
      isDelete: false,
      isVisible: true,
    });
    if (!dish) {
      return res.status(404).json({ status: "fail", message: "Dish not found" });
    }
    res.status(200).json({ status: "success", data: dish });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Get Dish By Type
exports.getDishByType = async (req, res) => {
  try {
    const { type } = req.params;
    // Lấy danh sách món ăn có type tương ứng, chưa bị xóa mềm và đang hiển thị
    const dishes = await Dish.find({ type, isDelete: false, isVisible: true });
    if (dishes.length === 0) {
      return res.status(404).json({ status: "fail", message: "No dishes found for this type" });
    }
    res.status(200).json({ status: "success", data: dishes });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Update Dish
exports.updateDish = async (req, res) => {
  try {
    const updatedDish = await Dish.findByIdAndUpdate(req.params.dishId, req.body, { new: true });
    if (!updatedDish) return res.status(404).json({ status: "fail", message: "Dish not found" });
    res.status(200).json({ status: "success", data: updatedDish });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

// "Delete" Dish (soft delete: update isDelete to true)
exports.deleteDish = async (req, res) => {
  try {
    const deletedDish = await Dish.findByIdAndDelete(req.params.dishId);

    if (!deletedDish) {
      return res.status(404).json({ status: "fail", message: "Dish not found" });
    }

    res.status(200).json({ status: "success", message: "Dish permanently deleted" });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Hide Dish: update isVisible to false
exports.hideDish = async (req, res) => {
  try {
    const hiddenDish = await Dish.findByIdAndUpdate(
      req.params.dishId,
      { isVisible: false },
      { new: true, runValidators: true }
    );
    if (!hiddenDish) {
      return res.status(404).json({ status: "fail", message: "Dish not found" });
    }
    res.status(200).json({
      status: "success",
      message: "Dish has been hidden",
      data: hiddenDish,
    });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Ingredients CRUD Operations

// Create Ingredients
exports.createIngredient = async (req, res) => {
  try {
    const newIngredient = new Ingredients(req.body);
    await newIngredient.save();
    res.status(201).json({ status: "success", data: newIngredient });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

// Create many Ingredients
exports.createManyIngredients = async (req, res) => {
  try {
    const ingredients = req.body; // Nhận mảng các nguyên liệu từ request body

    // Kiểm tra xem ingredients có phải là mảng không
    if (!Array.isArray(ingredients)) {
      return res
        .status(400)
        .json({ status: "fail", message: "Input should be an array of ingredients" });
    }

    // Tạo các nguyên liệu và lưu vào database
    const createdIngredients = await Ingredients.insertMany(ingredients);

    // Trả về kết quả
    res.status(201).json({ status: "success", data: createdIngredients });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

// Get all Ingredients
exports.getAllIngredients = async (req, res) => {
  try {
    let filter = { isDelete: false, isVisible: true }; // Mặc định chỉ hiển thị nguyên liệu không bị xóa và có thể nhìn thấy

    // Lấy token từ request (cookie hoặc header)
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (token) {
      try {
        // Giải mã token để lấy user ID
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await UserModel.findById(decoded.id);

        if (user) {
          // Nếu là admin hoặc nutritionist, hiển thị tất cả nguyên liệu
          if (user.role === "admin" || user.role === "nutritionist") {
            filter = {}; // Không áp dụng filter
          }
        }
      } catch (error) {
        console.error("Invalid token:", error.message);
      }
    }

    // Lấy danh sách nguyên liệu theo điều kiện
    const ingredients = await Ingredients.find(filter);
    res.status(200).json({ status: "success", data: ingredients });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Read Ingredient by ID
exports.getIngredientById = async (req, res) => {
  try {
    const ingredient = await Ingredients.findById(req.params.ingredientId);
    if (!ingredient)
      return res.status(404).json({ status: "fail", message: "Ingredient not found" });

    res.status(200).json({ status: "success", data: ingredient });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Update Ingredient
exports.updateIngredient = async (req, res) => {
  try {
    const updatedIngredient = await Ingredients.findByIdAndUpdate(
      req.params.ingredientId,
      req.body,
      {
        new: true,
      }
    );
    if (!updatedIngredient)
      return res.status(404).json({ status: "fail", message: "Ingredient not found" });

    res.status(200).json({ status: "success", data: updatedIngredient });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

// Delete Ingredient
exports.deleteIngredient = async (req, res) => {
  try {
    const deletedIngredient = await Ingredients.findByIdAndDelete(req.params.ingredientId);

    if (!deletedIngredient) {
      return res.status(404).json({ status: "fail", message: "Ingredient not found" });
    }

    res.status(200).json({ status: "success", message: "Ingredient permanently deleted" });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Hide Ingredient: update isVisible to false
exports.hideIngredient = async (req, res) => {
  try {
    console.log("Hiding ingredient ID:", req.params.ingredientId);
    const hiddenIngredient = await Ingredients.findByIdAndUpdate(
      req.params.ingredientId,
      { isVisible: false },
      { new: true, runValidators: true }
    );
    if (!hiddenIngredient) {
      return res.status(404).json({ status: "fail", message: "Ingredient not found" });
    }
    res.status(200).json({
      status: "success",
      message: "Ingredient has been hidden",
      data: hiddenIngredient,
    });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};
// Search Ingredients by name
exports.searchIngredientsByName = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ status: "fail", message: "Name query parameter is required" });
    }

    const ingredients = await Ingredients.find({
      name: { $regex: name, $options: "i" },
      isDelete: false,
    });

    if (ingredients.length === 0) {
      return res.status(404).json({ status: "fail", message: "Ingredient not found" });
    }

    res.status(200).json({ status: "success", data: ingredients });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Filter Ingredients by type
exports.filterIngredientsByType = async (req, res) => {
  try {
    const { type } = req.query;
    if (!type) {
      return res.status(400).json({ status: "fail", message: "Type query parameter is required" });
    }

    const ingredients = await Ingredients.find({
      type: type,
      isDelete: false,
    });

    res.status(200).json({ status: "success", data: ingredients });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Recipe CRUD Operations

exports.getAllRecipes = async (req, res) => {
  try {
    let filter = { isDelete: false }; // Mặc định chỉ hiển thị công thức chưa bị xóa

    // Lấy token từ request (cookie hoặc header)
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (token) {
      try {
        // Giải mã token để lấy user ID
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await UserModel.findById(decoded.id);

        if (user) {
          // Nếu là admin hoặc nutritionist, hiển thị tất cả công thức
          if (user.role === "admin" || user.role === "nutritionist") {
            filter = {}; // Không áp dụng filter
          }
        }
      } catch (error) {
        console.error("Invalid token:", error.message);
      }
    }

    // Lấy danh sách công thức theo điều kiện
    const recipes = await Recipe.find(filter)
      .populate("dishId")
      .populate("ingredients.ingredientId");

    res.status(200).json({ status: "success", data: recipes });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Create Recipe
exports.createRecipe = async (req, res) => {
  try {
    // 1️⃣ Lấy token từ request (cookie hoặc header)
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    // 2️⃣ Giải mã token để lấy user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ status: "fail", message: "User not found" });
    }

    // 3️⃣ Kiểm tra quyền: chỉ "admin" hoặc "nutritionist" mới được tạo recipe
    if (user.role !== "admin" && user.role !== "nutritionist") {
      return res.status(403).json({
        status: "fail",
        message: "Forbidden: You do not have permission to create recipes",
      });
    }

    // 4️⃣ Kiểm tra xem Dish có tồn tại không
    const { dishId } = req.params;
    const dish = await Dish.findById(dishId);
    if (!dish) {
      return res.status(404).json({ status: "fail", message: "Dish not found" });
    }

    // 5️⃣ Tính toán giá trị dinh dưỡng từ nguyên liệu
    let totalCalories = 0,
      totalProtein = 0,
      totalCarbs = 0,
      totalFat = 0;

    for (const ingredientItem of req.body.ingredients) {
      const ingredientInfo = await Ingredient.findById(ingredientItem.ingredientId);
      if (!ingredientInfo) {
        return res.status(404).json({
          status: "fail",
          message: `Ingredient with ID ${ingredientItem.ingredientId} not found`,
        });
      }

      let conversionFactor = ingredientItem.quantity / 100;
      if (ingredientItem.unit === "tbsp") conversionFactor = (ingredientItem.quantity * 15) / 100;
      if (ingredientItem.unit === "tsp" || ingredientItem.unit === "tp")
        conversionFactor = (ingredientItem.quantity * 5) / 100;

      totalCalories += (ingredientInfo.calories || 0) * conversionFactor;
      totalProtein += (ingredientInfo.protein || 0) * conversionFactor;
      totalCarbs += (ingredientInfo.carbs || 0) * conversionFactor;
      totalFat += (ingredientInfo.fat || 0) * conversionFactor;
    }

    // Làm tròn giá trị
    totalCalories = Math.round(totalCalories * 100) / 100;
    totalProtein = Math.round(totalProtein * 100) / 100;
    totalCarbs = Math.round(totalCarbs * 100) / 100;
    totalFat = Math.round(totalFat * 100) / 100;

    // 6️⃣ Tạo Recipe
    const recipeData = {
      ...req.body,
      dishId,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
    };

    const newRecipe = await Recipe.create(recipeData);

    // 7️⃣ Cập nhật thông tin vào Dish
    dish.recipeId = newRecipe._id;
    dish.calories = totalCalories;
    dish.protein = totalProtein;
    dish.carbs = totalCarbs;
    dish.fat = totalFat;
    if (req.body.totalServing) dish.totalServing = req.body.totalServing;
    if (req.body.cookingTime) dish.cookingTime = req.body.cookingTime;
    await dish.save();

    res.status(201).json({
      status: "success",
      data: newRecipe,
      nutritionInfo: {
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
      },
    });
  } catch (error) {
    console.error("Error creating recipe:", error);
    res.status(400).json({ status: "fail", message: error.message });
  }
};

// Read Recipe

exports.getRecipeById = async (req, res) => {
  try {
    // Sử dụng populate để lấy thông tin Dish liên quan
    const recipe = await Recipe.findById(req.params.recipeId).populate("dishId");
    if (!recipe) {
      return res.status(404).json({ status: "fail", message: "Recipe not found" });
    }
    res.status(200).json({ status: "success", data: recipe });
  } catch (error) {
    res.status(400).json({ status: "fail", message: error.message });
  }
};

// Update Recipe
exports.updateRecipeById = async (req, res) => {
  try {
    // Tìm Recipe hiện tại
    const recipe = await Recipe.findById(req.params.recipeId);
    if (!recipe) {
      return res.status(404).json({ status: "fail", message: "Recipe not found" });
    }

    // Nếu cập nhật ingredients, tính lại giá trị dinh dưỡng
    if (req.body.ingredients) {
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      for (const ingredientItem of req.body.ingredients) {
        const ingredientInfo = await Ingredient.findById(ingredientItem.ingredientId);
        if (ingredientInfo) {
          let conversionFactor = ingredientItem.quantity / 100;
          if (ingredientItem.unit === "tbsp") {
            conversionFactor = (ingredientItem.quantity * 15) / 100;
          } else if (ingredientItem.unit === "tsp" || ingredientItem.unit === "tp") {
            conversionFactor = (ingredientItem.quantity * 5) / 100;
          }
          totalCalories += (ingredientInfo.calories || 0) * conversionFactor;
          totalProtein += (ingredientInfo.protein || 0) * conversionFactor;
          totalCarbs += (ingredientInfo.carbs || 0) * conversionFactor;
          totalFat += (ingredientInfo.fat || 0) * conversionFactor;
        } else {
          return res.status(404).json({
            status: "fail",
            message: `Ingredient with ID ${ingredientItem.ingredientId} not found`,
          });
        }
      }
      totalCalories = Math.round(totalCalories * 100) / 100;
      totalProtein = Math.round(totalProtein * 100) / 100;
      totalCarbs = Math.round(totalCarbs * 100) / 100;
      totalFat = Math.round(totalFat * 100) / 100;

      // Gán lại các giá trị dinh dưỡng mới vào body
      req.body.totalCalories = totalCalories;
      req.body.totalProtein = totalProtein;
      req.body.totalCarbs = totalCarbs;
      req.body.totalFat = totalFat;
    }

    // Cập nhật Recipe
    const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.recipeId, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedRecipe) {
      return res.status(404).json({ status: "fail", message: "Recipe not found" });
    }

    // Cập nhật thông tin dinh dưỡng và totalServing trong Dish
    const dish = await Dish.findById(updatedRecipe.dishId);
    if (dish) {
      dish.calories = updatedRecipe.totalCalories;
      dish.protein = updatedRecipe.totalProtein;
      dish.carbs = updatedRecipe.totalCarbs;
      dish.fat = updatedRecipe.totalFat;
      if (req.body.totalServing) {
        dish.totalServing = req.body.totalServing;
      }
      // Nếu có cập nhật cookingTime từ client, cập nhật tại Dish nếu cần
      if (req.body.cookingTime) {
        dish.cookingTime = req.body.cookingTime;
      }
      await dish.save();
    }

    res.status(200).json({ status: "success", data: updatedRecipe });
  } catch (error) {
    console.error("Error updating recipe:", error);
    res.status(400).json({ status: "fail", message: error.message });
  }
};

// Delete Recipe
exports.deleteRecipeById = async (req, res) => {
  try {
    // Xóa Recipe
    const recipe = await Recipe.findByIdAndDelete(req.params.recipeId);
    if (!recipe) {
      return res.status(404).json({ status: "fail", message: "Recipe not found" });
    }

    // Xóa tham chiếu recipeId trong Dish và reset lại giá trị dinh dưỡng
    const dish = await Dish.findById(recipe.dishId);
    if (dish) {
      dish.recipeId = null;
      dish.cookingTime = 0;
      dish.calories = 0;
      dish.protein = 0;
      dish.carbs = 0;
      dish.fat = 0;
      dish.totalServing = 0;
      await dish.save();
    }

    res.status(200).json({ status: "success", message: "Recipe deleted" });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    res.status(400).json({ status: "fail", message: error.message });
  }
};
