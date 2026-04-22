const queries = require("../database/queries");
const bcrypt = require("bcryptjs");
const UserModel = require("../models/userModel");

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

async function registerUser(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      error:
        "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
    });
  }

  const existingUsername = await queries.findUserByUsername(username);
  const existingEmail = await queries.findUserByEmail(email);

  if (existingUsername) {
    return res.status(409).json({ error: "Username already exists" });
  }

  if (existingEmail) {
    return res.status(409).json({ error: "Email already exists" });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new UserModel(null, username, email, hashedPassword);
    const registeredUser = await queries.registerUser(newUser);

    if (!registeredUser) {
      return res.status(500).json({ error: "User registration failed" });
    }

    res.status(201).json({
      message: `User ${registeredUser.username} registered successfully`,
      user: {
        id: registeredUser.user_id,
        username: registeredUser.username,
        email: registeredUser.email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to register user" });
  }
}

module.exports = {
  registerUser,
};
