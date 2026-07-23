import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '../data');
const dbPath = path.join(dbDir, 'users.json');

// --- Supabase Client Initialization ---
const supabaseUrl = process.env.SUPABASE_URL || 'https://qsomdileoramnmlhjxfd.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_PtdvOnuksr7Wi-6jPgEpDw_qbp_5Swq';

export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔗 Connected to Supabase Cloud Database at:', supabaseUrl);

// --- Local JSON Storage Fallback Helpers ---
async function ensureDbExists(filePath, defaultData = []) {
  try {
    await fs.mkdir(dbDir, { recursive: true });
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}

async function readLocalJson(filePath) {
  try {
    await ensureDbExists(filePath);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeLocalJson(filePath, data) {
  await ensureDbExists(filePath);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ----------------------------------------------------
// USERS STORAGE
// ----------------------------------------------------
export async function getUsers() {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (!error && Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase query failed, falling back to local users database:', err.message);
  }
  return readLocalJson(dbPath);
}

export async function saveUsers(users) {
  await writeLocalJson(dbPath, users);
  try {
    if (Array.isArray(users) && users.length > 0) {
      await supabase.from('users').upsert(users, { onConflict: 'id' });
    }
  } catch (err) {
    console.warn('Supabase sync warning (users):', err.message);
  }
}

export async function getUserByEmail(email) {
  if (!email) return null;
  const searchEmail = email.trim().toLowerCase();
  
  if (searchEmail === 'admin@foodwaste.com') {
    return {
      id: 'admin-id-001',
      fullName: 'System Administrator',
      email: 'admin@foodwaste.com',
      role: 'Admin',
      passwordHash: '$2a$10$gO0Ww6sFjFm6GkHqL2QcOepx.sD9x7a6M7X.5pYnreYx8G9L9Y1pG' 
    };
  }

  try {
    const { data, error } = await supabase.from('users').select('*').eq('email', searchEmail).maybeSingle();
    if (!error && data) return data;
  } catch {}

  const users = await getUsers();
  return users.find(u => u.email.toLowerCase() === searchEmail) || null;
}

export async function getUserById(id) {
  if (id === 'admin-id-001') {
    return {
      id: 'admin-id-001',
      fullName: 'System Administrator',
      email: 'admin@foodwaste.com',
      role: 'Admin'
    };
  }

  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    if (!error && data) return data;
  } catch {}

  const users = await getUsers();
  return users.find(u => u.id === id) || null;
}

export async function createUser(userData) {
  const existingUser = await getUserByEmail(userData.email);
  if (existingUser) {
    throw new Error('Email address already registered.');
  }

  if (userData.role && userData.role.toLowerCase() === 'admin') {
    throw new Error('Admin registration is not allowed.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(userData.password, salt);

  const newUser = {
    id: 'usr_' + Math.random().toString(36).substr(2, 9),
    fullName: userData.fullName.trim(),
    email: userData.email.trim().toLowerCase(),
    mobileNumber: userData.mobileNumber.trim(),
    role: userData.role,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  const users = await getUsers();
  users.push(newUser);
  await saveUsers(users);

  const { passwordHash: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

// ----------------------------------------------------
// DONATIONS STORAGE
// ----------------------------------------------------
const donationsPath = path.join(dbDir, 'donations.json');

export async function getDonations() {
  try {
    const { data, error } = await supabase.from('donations').select('*');
    if (!error && Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase query failed, falling back to local donations database:', err.message);
  }
  return readLocalJson(donationsPath);
}

export async function saveDonations(donations) {
  await writeLocalJson(donationsPath, donations);
  try {
    if (Array.isArray(donations) && donations.length > 0) {
      await supabase.from('donations').upsert(donations, { onConflict: 'id' });
    }
  } catch (err) {
    console.warn('Supabase sync warning (donations):', err.message);
  }
}

// ----------------------------------------------------
// CHAT MESSAGES STORAGE
// ----------------------------------------------------
const messagesPath = path.join(dbDir, 'messages.json');

export async function getMessages() {
  try {
    const { data, error } = await supabase.from('messages').select('*');
    if (!error && Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase query failed, falling back to local messages database:', err.message);
  }
  return readLocalJson(messagesPath);
}

export async function saveMessages(messages) {
  await writeLocalJson(messagesPath, messages);
  try {
    if (Array.isArray(messages) && messages.length > 0) {
      await supabase.from('messages').upsert(messages, { onConflict: 'id' });
    }
  } catch (err) {
    console.warn('Supabase sync warning (messages):', err.message);
  }
}

// ----------------------------------------------------
// SYSTEM NOTIFICATIONS STORAGE
// ----------------------------------------------------
const notificationsPath = path.join(dbDir, 'notifications.json');

export async function getNotifications() {
  try {
    const { data, error } = await supabase.from('notifications').select('*');
    if (!error && Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase query failed, falling back to local notifications database:', err.message);
  }
  return readLocalJson(notificationsPath);
}

export async function saveNotifications(notifications) {
  await writeLocalJson(notificationsPath, notifications);
  try {
    if (Array.isArray(notifications) && notifications.length > 0) {
      await supabase.from('notifications').upsert(notifications, { onConflict: 'id' });
    }
  } catch (err) {
    console.warn('Supabase sync warning (notifications):', err.message);
  }
}

// ----------------------------------------------------
// COMPLAINTS & REPORTS STORAGE
// ----------------------------------------------------
const reportsPath = path.join(dbDir, 'reports.json');

export async function getReports() {
  try {
    const { data, error } = await supabase.from('reports').select('*');
    if (!error && Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase query failed, falling back to local reports database:', err.message);
  }
  return readLocalJson(reportsPath);
}

export async function saveReports(reports) {
  await writeLocalJson(reportsPath, reports);
  try {
    if (Array.isArray(reports) && reports.length > 0) {
      await supabase.from('reports').upsert(reports, { onConflict: 'id' });
    }
  } catch (err) {
    console.warn('Supabase sync warning (reports):', err.message);
  }
}
