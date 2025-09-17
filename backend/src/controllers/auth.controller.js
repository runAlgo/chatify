import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { ENV } from "../lib/env.js";
import { protectRoute } from "../middlewares/auth.middleware.js";
import cloudinary from "../lib/cloudinary.js";

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
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Email & password are required" });
    }
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    //Create JWT token
    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error("Error in login controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (_, res) => {
  try {
    // Clear the cookie that holds your JWT
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: ENV.NODE_ENV !== "development",
      sameSite: "strict",
      path: "/", // must match the path used on login
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    if(!profilePic) return res.status(400).json({message: "Profile picture is rquired"});
    
    const userId = req.user._id;

    const uploadResponse = await cloudinary.uploader.upload(profilePic)
    const updatedUser = await User.findByIdAndUpdate(userId, {profilePic: uploadResponse.secure_url}, {new: true}).select("-password")
    if(!updatedUser) return res.status(404).json({message: "User not found"})
      res.status(200).json(updatedUser)
  } catch (error) {
    console.log("Error in updateProfile controller: ", error)
    res.status(500).json({message: "Internal server error"})
  }
}
