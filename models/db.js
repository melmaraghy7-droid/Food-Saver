import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '../data');
const dbPath = path.join(dbDir, 'users.json');

// Ensure database file and directory exist
async function ensureDbExists() {
  try {
    await fs.mkdir(dbDir, { recursive: true });
    await fs.access(dbPath);
  } catch (error) {
    // If directory or file does not exist, create it with empty array
    await fs.writeFile(dbPath, JSON.stringify([], null, 2), 'utf-8');
  }
}

// Read all users
export async function getUsers() {
  await ensureDbExists();
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database file, resetting to empty array:', error);
    return [];
  }
}

// Save all users
async function saveUsers(users) {
  await ensureDbExists();
  await fs.writeFile(dbPath, JSON.stringify(users, null, 2), 'utf-8');
}

// Find user by email
export async function getUserByEmail(email) {
  if (!email) return null;
  const users = await getUsers();
  const searchEmail = email.trim().toLowerCase();
  
  // Special check for hardcoded Admin account
  if (searchEmail === 'admin@foodwaste.com') {
    // Return mock admin user representation (password check handled separately or matches hashed admin password)
    // admin@123 hashed is: $2a$10$wzQv8dFq5z1v0yA3cWv6QO0W4E5Wc7r8n0Z4C9Y3l1h8v1C2M3c5e (we can generate one or just hardcode checking)
    return {
      id: 'admin-id-001',
      fullName: 'System Administrator',
      email: 'admin@foodwaste.com',
      role: 'Admin',
      // admin@123 hashed
      passwordHash: '$2a$10$gO0Ww6sFjFm6GkHqL2QcOepx.sD9x7a6M7X.5pYnreYx8G9L9Y1pG' 
    };
  }

  return users.find(u => u.email.toLowerCase() === searchEmail) || null;
}

// Find user by ID
export async function getUserById(id) {
  if (id === 'admin-id-001') {
    return {
      id: 'admin-id-001',
      fullName: 'System Administrator',
      email: 'admin@foodwaste.com',
      role: 'Admin'
    };
  }
  const users = await getUsers();
  return users.find(u => u.id === id) || null;
}

// Create new user (with password hashing)
export async function createUser(userData) {
  const users = await getUsers();
  
  // Validation checks
  const existingUser = await getUserByEmail(userData.email);
  if (existingUser) {
    throw new Error('Email address already registered.');
  }

  // Prevent registration as Admin
  if (userData.role && userData.role.toLowerCase() === 'admin') {
    throw new Error('Admin registration is not allowed.');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(userData.password, salt);

  const newUser = {
    id: 'usr_' + Math.random().toString(36).substr(2, 9),
    fullName: userData.fullName.trim(),
    email: userData.email.trim().toLowerCase(),
    mobileNumber: userData.mobileNumber.trim(),
    role: userData.role, // Restaurant, Supermarket, Bakery, Charity, Volunteer
    passwordHash,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  await saveUsers(users);

  // Return user without password hash for safety
  const { passwordHash: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

// ----------------------------------------------------
// DONATIONS STORAGE MAPPINGS
// ----------------------------------------------------
const donationsPath = path.join(dbDir, 'donations.json');
async function ensureDonationsDb() {
  try {
    await fs.access(donationsPath);
  } catch {
    await fs.writeFile(donationsPath, JSON.stringify([], null, 2), 'utf-8');
  }
}

export async function getDonations() {
  await ensureDonationsDb();
  try {
    const data = await fs.readFile(donationsPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveDonations(donations) {
  await ensureDonationsDb();
  await fs.writeFile(donationsPath, JSON.stringify(donations, null, 2), 'utf-8');
}

// ----------------------------------------------------
// CHAT MESSAGES STORAGE MAPPINGS
// ----------------------------------------------------
const messagesPath = path.join(dbDir, 'messages.json');
async function ensureMessagesDb() {
  try {
    await fs.access(messagesPath);
  } catch {
    await fs.writeFile(messagesPath, JSON.stringify([], null, 2), 'utf-8');
  }
}

export async function getMessages() {
  await ensureMessagesDb();
  try {
    const data = await fs.readFile(messagesPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveMessages(messages) {
  await ensureMessagesDb();
  await fs.writeFile(messagesPath, JSON.stringify(messages, null, 2), 'utf-8');
}

// ----------------------------------------------------
// SYSTEM NOTIFICATIONS STORAGE MAPPINGS
// ----------------------------------------------------
const notificationsPath = path.join(dbDir, 'notifications.json');
async function ensureNotificationsDb() {
  try {
    await fs.access(notificationsPath);
  } catch {
    await fs.writeFile(notificationsPath, JSON.stringify([], null, 2), 'utf-8');
  }
}

export async function getNotifications() {
  await ensureNotificationsDb();
  try {
    const data = await fs.readFile(notificationsPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveNotifications(notifications) {
  await ensureNotificationsDb();
  await fs.writeFile(notificationsPath, JSON.stringify(notifications, null, 2), 'utf-8');
}

// ----------------------------------------------------
// COMPLAINTS & REPORTS STORAGE MAPPINGS
// ----------------------------------------------------
const reportsPath = path.join(dbDir, 'reports.json');
async function ensureReportsDb() {
  try {
    await fs.access(reportsPath);
  } catch {
    await fs.writeFile(reportsPath, JSON.stringify([], null, 2), 'utf-8');
  }
}

export async function getReports() {
  await ensureReportsDb();
  try {
    const data = await fs.readFile(reportsPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveReports(reports) {
  await ensureReportsDb();
  await fs.writeFile(reportsPath, JSON.stringify(reports, null, 2), 'utf-8');
}

