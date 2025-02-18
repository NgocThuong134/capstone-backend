const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const { ObjectId } = mongoose.Schema.Types;

const staffSchema = mongoose.Schema(
  {
    email: {
      type: String,
      require: [true, "Please, provide staff email"],
      validate: [validator.isEmail, "Provide a valid email address"],
      unique: [true, "Email already exist. Please, provide new"],
    },
    password: {
      type: String,
      require: [true, "Please, provide staff password"],
      minLength: [8, "Password must be at least 8 characters"],
      validate: {
        validator: (value) =>
          validator.isStrongPassword(value, {
            minUppercase: 1,
            minLowercase: 1,
            minNumbers: 1,
            minSymbols: 1,
          }),
        message:
          "Password {VALUE} should contain minimum 1 => uppercase, lowercase, number and symbol",
      },
      minLength: [8, "Password should be at least 8 characters"],
      maxLength: [20, "Password should be at most 20 characters"],
    },
    avatar: {
      url: {
        type: String,
        validate: [validator.isURL, "Please provide a valid avatar URL"],
        default: "https://placehold.co/300x300.png",
      },
      public_id: {
        type: String,
        default: "N/A",
      },
    },
    name: {
      type: String,
      require: [true, "Please, provide staff name"],
    },
    phone: {
      type: String,
      require: [true, "Please, provide staff phone"],
      validate: {
        validator: (value) =>
          validator.isMobilePhone(value, "bn-BD", { strictMode: true }),
        message:
          "Phone number {VALUE} is not valid. Please, retry like +8801xxxxxxxxx",
      },
      unique: true,
    },
    birthday: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    salary: {
      type: Number,
      default: 0,
    },
    role: {
      type: ObjectId,
      ref: "Role",
    },
    schedule: {
      type: Array,
      default: [],
    },
    status: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

/* encrypted user account password */
staffSchema.methods.encryptedPassword = function (password) {
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  return hashedPassword;
};

/* middleware to encrypt password */
staffSchema.pre("save", async function (next) {
  try {
    // initialize encrypted password
    if (!this.isModified("password")) {
      return next();
    }

    // encrypt password
    this.password = this.encryptedPassword(this.password);
  } catch (error) {
    next(error);
  }
});

/* compare passwords as sign in proportion */
staffSchema.methods.comparePassword = function (password, hash) {
  const isPasswordValid = bcrypt.compareSync(password, hash);
  return isPasswordValid;
};

/* create user model schema */
const Staff = mongoose.model("Staff", staffSchema);

/* export user schema */
module.exports = Staff;
