const queries = require("../database/queries");
const bcrypt = require("bcryptjs");

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

async function showUserProfile(req, res) {
  const userId = req.user.id;
  console.log("User ID:", userId);

  try {
    const user = await queries.showUserProfile(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        current_streak: user.streak_count,
        current_mood: user.current_mood,
        longest_streak: user.longest_streak,
        total_gold: user.total_gold,
        daily_journal: user.daily_journal,
        daily_cbt: user.daily_cbt,
        daily_zen: user.daily_zen,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve user profile" });
  }
}

async function deleteUser(req, res) {
  const userId = req.user.id;

  try {
    const deleted = await queries.deleteUser(userId);
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: `User ${userId} deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
}

async function updateProfile(req, res) {
  const userId = req.user.id;
  const { username, email } = req.body;

  const updateField = {};

  if (username) {
    if (!USERNAME_REGEX.test(username)) {
      return res.status(400).json({
        error:
          "Username must be 3-30 characters and contain only letters, numbers, or underscores",
      });
    }
    const usernameExists = await queries.findUserByUsername(username);
    if (usernameExists && usernameExists.user_id !== parseInt(userId)) {
      return res.status(409).json({ error: "Username already exists" });
    }
    updateField.username = username;
  }

  if (email) {
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    const emailExists = await queries.findUserByEmail(email);
    if (emailExists && emailExists.user_id !== parseInt(userId)) {
      return res.status(409).json({ error: "Email already exists" });
    }
    updateField.email = email;
  }

  const fieldKeys = Object.keys(updateField);
  if (fieldKeys.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    const updatedUser = await queries.updateUserProfile(userId, updateField);

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: `User profile updated successfully`,
      user: {
        id: updatedUser.user_id,
        username: updatedUser.username,
        email: updatedUser.email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user profile" });
  }
}

async function passwordReset(req, res) {
  const userId = req.user.id;
  const { current_password, new_password, confirm_password } = req.body;

  if (!current_password || !new_password || !confirm_password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (new_password !== confirm_password) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  if (!PASSWORD_REGEX.test(new_password)) {
    return res.status(400).json({
      error:
        "New password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character",
    });
  }

  try {
    const storedPassword = await queries.getPasswordByUserId(userId);
    const isMatch = await bcrypt.compare(current_password, storedPassword);

    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(new_password, salt);
    await queries.passwordReset(userId, hashedNewPassword);
    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset password" });
  }
}

module.exports = {
  updateProfile,
  showUserProfile,
  passwordReset,
  deleteUser,
};
