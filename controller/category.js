const express = require("express");
const { isAuthenticated, isAdmin, isSeller } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const Category = require("../model/category.model");
const Shop = require("../model/shop")
const { upload } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");

// Thêm hình ảnh cho category
router.post(
  "/create-category",
  upload.single("thumbnail"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { title, description, shopId } = req.body;
      const shopID = req.body.shopId;
      const shop = await Shop.findById(shopID);
    
      if (!shop) {
        return next(new ErrorHandler("Shop Id is invalid!", 400));
      } else {
      const thumbnailUrl = req.file ? req.file.filename : null;

      const categoryData = {
        title,
        description,
        shopId,
        thumbnail: {
          url: thumbnailUrl,
          public_id: "N/A",
        }
      };
      categoryData.shop = shop;
    
      const category = await Category.create(categoryData);
    
      res.status(200).json({
        success: true,
        category,
      });
    }
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// Lấy danh sách tất cả các category of shop
router.get(
  "/getAllCategories-shop/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const categories = await Category.find({shopId: req.params.id});
      res.status(200).json({success: true, categories });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.get(
  "/getAllCategories",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const categories = await Category.find();
      res.status(200).json({success: true, categories });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Lấy thông tin một category theo ID
router.get(
  "/getCategory/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return next(new ErrorHandler("Category not found!", 404));
      }
      res.status(200).json(category);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Cập nhật thông tin category
router.put(
  "/update-category/:id",
  isSeller,
  upload.single("thumbnail"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return next(new ErrorHandler("Category not found!", 404));
      }

      const { title, description } = req.body;
      const thumbnailUrl = req.file
        ? req.file.filename
        : category.thumbnail.url; // Giữ nguyên URL nếu không có tệp mới

      // Cập nhật thông tin category
      const updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        {
          title,
          description,
          thumbnail: {
            url: thumbnailUrl,
            public_id: category.thumbnail.public_id,
          },
        },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        updatedCategory,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Xóa một category theo ID
router.delete(
  "/delete-category/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return next(new ErrorHandler("Category not found!", 404));
      }

      await Category.findByIdAndDelete(req.params.id);
      res.status(200).json({
        success: true,
        message: "Category deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
