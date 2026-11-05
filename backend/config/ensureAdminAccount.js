const bcrypt = require("bcryptjs");
const User = require("../models/User");

const ensureAdminAccount = async () => {
  const username = (process.env.ADMIN_USERNAME || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";

  if (!username && !password) {
    console.warn("Admin account provisioning skipped: admin credentials are not configured.");
    return;
  }

  if (!username || !password) {
    throw new Error("Set both ADMIN_USERNAME and ADMIN_PASSWORD to provision the admin account.");
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  }

  const existingUser = await User.findOne({ username });

  if (existingUser) {
    if (existingUser.role !== "admin") {
      throw new Error(`Cannot provision admin account: username "${username}" is already assigned to a non-admin user.`);
    }

    console.info(`Admin account "${username}" is ready.`);
    return;
  }

  const email = (process.env.ADMIN_EMAIL || `${username}@dineconnect.local`).trim().toLowerCase();
  const fullName = (process.env.ADMIN_NAME || "DineConnect Administrator").trim();

  await User.create({
    fullName,
    email,
    username,
    passwordHash: await bcrypt.hash(password, 12),
    role: "admin",
  });

  console.info(`Provisioned admin account "${username}".`);
};

module.exports = ensureAdminAccount;
