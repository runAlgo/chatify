import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { ENV } from "../lib/env.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  const name = typeof fullName === "string" ? fullName.trim() : "";
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  const pass = typeof password === "string" ? password : "";

  try {
    if (!name || !normalizedEmail || !pass) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (pass.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at leat 6 characters" });
    }
    // Check if email is valid: regex
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser)
      return res.status(400).json({ message: "Email already exist" });

    // hash-password 123456 => 34$#545_fjd
    const hashedPassword = await bcrypt.hash(pass, 10);

    const newUser = new User({
      fullName: name,
      email: normalizedEmail,
      password: hashedPassword,
    });

    if (newUser) {
      // before Code Review:
      //   generateToken(newUser._id, res);
      //   await newUser.save();

      // after Code Review:
      // Persist user first, then issue auth cookie
      const saveUser = await newUser.save();
      generateToken(saveUser._id, res);

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });

      try {
        await sendWelcomeEmail(
          saveUser.email,
          saveUser.fullName,
          ENV.CLIENT_URL
        );
      } catch (error) {
        console.log("Failed to send welcome email:", error);
      }
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  res.send("login endpoint");
};
export const logout = async (req, res) => {
  res.send("logout endpoint");
};
