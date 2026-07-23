-- FoodSaver Supabase Database Schema

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  "fullName" TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  "mobileNumber" TEXT,
  role TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Donations Table
CREATE TABLE IF NOT EXISTS public.donations (
  id TEXT PRIMARY KEY,
  "donorName" TEXT NOT NULL,
  "donorEmail" TEXT,
  "orgType" TEXT,
  "foodName" TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity TEXT NOT NULL,
  meals INT DEFAULT 0,
  expiry TEXT,
  status TEXT DEFAULT 'Available',
  address TEXT,
  instructions TEXT,
  window TEXT,
  charity TEXT DEFAULT '-',
  "charityEmail" TEXT DEFAULT '-',
  "requestDate" TEXT DEFAULT '-',
  volunteer TEXT DEFAULT '-',
  date TEXT DEFAULT CURRENT_DATE
);

-- 3. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL,
  text TEXT,
  image TEXT,
  timestamp TEXT
);

-- 4. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  recipient TEXT NOT NULL,
  "recipientEmail" TEXT,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  time TEXT DEFAULT 'Just now',
  read BOOLEAN DEFAULT FALSE
);

-- 5. Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  "userEmail" TEXT,
  "userName" TEXT,
  status TEXT DEFAULT 'Pending',
  date TEXT DEFAULT CURRENT_DATE
);

-- Disable Row Level Security for public access via Supabase Client Key
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
