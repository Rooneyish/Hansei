const queries = require("../database/queries");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_MIN_LENGTH = 8;

async function loginUser(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!USERNAME_REGEX.test(username) && !EMAIL_REGEX.test(username)) {
    return res.status(400).json({ error: "Invalid username or email format" });
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return res.status(400).json({ error: "Invalid username or password" });
  }

  try {
    const user = await queries.findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const tokenPayload = {
      id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(
      tokenPayload,
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign(
      { id: user.user_id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      message: `User ${user.username} logged in successfully`,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        accessToken,
        refreshToken,
        expiresIn: "15m",
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[LOGIN] Failed:", { username, error: err.message, stack: err.stack });
    res.status(500).json({ error: "Failed to login user" });
  }
}

async function logoutUser(req, res) {
  res.status(200).json({ message: "User logged out successfully" });
}

async function verifyToken(req, res) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ status: "expired", message: "No token provided" });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res
          .status(401)
          .json({ status: "expired", message: "Token invalid or expired" });
      }

      res.status(200).json({
        status: "valid",
        user: decoded,
      });
    });
  } catch (err) {
    console.error("[VERIFY] Token verification error:", { error: err.message });
    res.status(500).json({ error: "Server error during verification" });
  }
}

async function refreshToken(req, res) {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(401).json({ error: "Refresh token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    const user = await queries.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    const newAccessToken = jwt.sign(
      {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" },
    );

    res.status(200).json({
      accessToken: newAccessToken,
      expiresIn: "15m",
    });
  } catch (err) {
    console.error("[REFRESH] Token refresh failed:", { error: err.message });
    return res.status(401).json({ error: "Invalid or expired refresh token. Please login again." });
  }
}

module.exports = {
  loginUser,
  logoutUser,
  verifyToken,
  refreshToken,
};
