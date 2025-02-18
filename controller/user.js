const express = require("express");
const path = require("path");
const User = require("../model/user");
const { upload } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const crypto = require("crypto");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
require("dotenv").config();

const router = express.Router();
const otps = {}; // Lưu trữ mã OTP tạm thời
// API gửi mã OTP
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  // Tạo mã OTP ngẫu nhiên
  const otp = crypto.randomInt(100000, 999999).toString();

  // Ghi lại thời gian hết hạn (1 phút = 60000 ms)
  const expiresIn = Date.now() + 60000;

  // Lưu mã OTP và thời gian hết hạn vào bộ nhớ tạm thời
  otps[email] = { otp, expiresIn };

  // Gửi mã OTP qua email với thông báo rõ ràng
  const message = `
      <h3>Mã OTP của bạn là: <strong style="font-size: 24px;">${otp}</strong></h3>
      <p style="font-size: 18px;">Mã OTP này sẽ hết hạn trong 1 phút.</p>
  `;

  try {
      await sendMail({
          email,
          subject: "Mã xác nhận OTP",
          message,
      });
      return res.status(200).json({ success: true, message: "Mã OTP đã được gửi đến email của bạn." });
  } catch (error) {
      return res.status(500).json({ success: false, message: "Không thể gửi mã OTP." });
  }
});

router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (otps[email]) {
      const { otp: storedOtp, expiresIn } = otps[email];

      // Kiểm tra thời gian hết hạn
      if (Date.now() > expiresIn) {
          delete otps[email];
          return res.status(400).json({ success: false, message: "Mã OTP đã hết hạn." });
      }

      // Kiểm tra mã OTP
      if (storedOtp === otp) {
          delete otps[email];
          return res.status(200).json({ success: true, message: "Mã OTP hợp lệ." });
      } else {
          return res.status(400).json({ success: false, message: "Mã OTP không hợp lệ." });
      }
  } else {
      return res.status(400).json({ success: false, message: "Mã OTP không tồn tại." });
  }
});

// API quên mật khẩu
router.post('/reset-password', async (req, res) => {
  const { email } = req.body;

  try {
      // Kiểm tra xem email có tồn tại trong cơ sở dữ liệu không
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({ success: false, message: 'Email không tồn tại.' });
      }

      // Tạo mật khẩu ngẫu nhiên 6 ký tự
      const newPassword = crypto.randomBytes(3).toString('hex'); // Tạo 6 ký tự
      user.password = newPassword; // Cập nhật mật khẩu trong cơ sở dữ liệu

      await user.save();

      // Gửi email với mật khẩu mới
      const mailOptions = {
          email: user.email,
          subject: 'Mật khẩu mới của bạn',
          message: `<p>Mật khẩu mới của bạn là: <strong>${newPassword}</strong></p>`
      };

      await sendMail(mailOptions);

      res.json({ success: true, message: 'Mật khẩu mới đã được gửi qua email!' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Có lỗi xảy ra. Vui lòng thử lại.' });
  }
});

router.post("/create-user", upload.single("file"), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const userEmail = await User.findOne({ email });

    if (userEmail) {
      // if user already exits account is not create and file is deleted
      const filename = req.file.filename;
      const filePath = `uploads/${filename}`;
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log(err);
          res.status(500).json({ message: "Error deleting file" });
        }
      });

      return next(new ErrorHandler("User already exits", 400));
    }

    const filename = req.file.filename;
    const fileUrl = path.join(filename);

    const user = {
      name: name,
      email: email,
      password: password,
      avatar: fileUrl,
    };

    const activationToken = createActivationToken(user);

    const activationUrl = `http://localhost:3000/activation/${activationToken}`;

    // send email to user
    try {
      await sendMail({
        email: user.email,
        subject: "Activate your account",
        message: `Hello  ${user.name}, please click on the link to activate your account ${activationUrl} `,
      });
      res.status(201).json({
        success: true,
        message: `please check your email:- ${user.email} to activate your account!`,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  } catch (err) {
    return next(new ErrorHandler(err.message, 400));
  }
});

// create activation token
const createActivationToken = (user) => {
  // why use create activatetoken?
  // to create a token for the user to activate their account  after they register
  return jwt.sign(user, process.env.ACTIVATION_SECRET, {
    expiresIn: "2m",
  });
};

// activate user account
router.post(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { activation_token } = req.body;

      const newUser = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET
      );
      if (!newUser) {
        return next(new ErrorHandler("Invalid token", 400));
      }
      const { name, email, password, avatar } = newUser;

      let user = await User.findOne({ email });

      if (user) {
        return next(new ErrorHandler("User already exists", 400));
      }
      user = await User.create({
        name,
        email,
        avatar,
        password,
      });
      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// login user
router.post(
  "/login-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(new ErrorHandler("Please provide the all filelds", 400));
      }
      const user = await User.findOne({ email }).select("+password");
      // +password is used to select the password field from the database

      if (!user) {
        return next(new ErrorHandler("user doesn't exits", 400));
      }

      // compore password with database password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct inforamtions", 400)
        );
      }
      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// load user
router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return next(new ErrorHandler("User doesn't exists", 400));
      }
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// log out user
router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
      });
      res.status(201).json({
        success: true,
        message: "Log out successful!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user info
router.put(
  "/update-user-info",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password, phoneNumber, name } = req.body;

      /* The line `const user = await User.findOne({ email }).select("+password");` is querying the database
to find a user with the specified email address. The `select("+password")` part is used to include
the password field in the returned user object. By default, the password field is not selected when
querying the database for security reasons. However, in this case, the password field is needed to
compare the provided password with the stored password for authentication purposes. */
      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }

      user.name = name;
      user.email = email;
      user.phoneNumber = phoneNumber;

      await user.save();

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user avatar
router.put(
  "/update-avatar",
  isAuthenticated,
  upload.single("image"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const existsUser = await User.findById(req.user.id);

      const existAvatarPath = `uploads/${existsUser.avatar}`;

      fs.unlinkSync(existAvatarPath); // Delete Priviuse Image

      const fileUrl = path.join(req.file.filename); // new image

      /* The code `const user = await User.findByIdAndUpdate(req.user.id, { avatar: fileUrl });` is
        updating the avatar field of the user with the specified `req.user.id`. It uses the
        `User.findByIdAndUpdate()` method to find the user by their id and update the avatar field
        with the new `fileUrl` value. The updated user object is then stored in the `user` variable. */
      const user = await User.findByIdAndUpdate(req.user.id, {
        avatar: fileUrl,
      });

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user addresses
router.put(
  "/update-user-addresses",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      const sameTypeAddress = user.addresses.find(
        (address) => address.addressType === req.body.addressType
      );
      if (sameTypeAddress) {
        return next(
          new ErrorHandler(`${req.body.addressType} address already exists`)
        );
      }

      const existsAddress = user.addresses.find(
        (address) => address._id === req.body._id
      );

      if (existsAddress) {
        Object.assign(existsAddress, req.body);
      } else {
        // add the new address to the array
        user.addresses.push(req.body);
      }

      await user.save();

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete user address
router.delete(
  "/delete-user-address/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const userId = req.user._id;
      const addressId = req.params.id;

      //   console.log(addressId);

      await User.updateOne(
        {
          _id: userId,
        },
        { $pull: { addresses: { _id: addressId } } }
      );

      const user = await User.findById(userId);

      res.status(200).json({ success: true, user });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.put(
  "/update-user-password",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select("+password");

      const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

      if (!isPasswordMatched) {
        return next(new ErrorHandler("Mật khẩu cũ không chính xác!", 400));
      }
      if (req.body.newPassword !== req.body.confirmPassword) {
        return next(
          new ErrorHandler("Mật khẩu mới không khớp với mật khẩu xác nhận!", 400)
        );
      }

      user.password = req.body.newPassword;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Mật khẩu đã được cập nhật thành công!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// find user infoormation with the userId
router.get(
  "/user-info/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// all users --- for admin
router.get(
  "/admin-all-users",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const users = await User.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        users,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete users --- admin
router.delete(
  "/delete-user/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return next(
          new ErrorHandler("User is not available with this id", 400)
        );
      }

      await User.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "User deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
