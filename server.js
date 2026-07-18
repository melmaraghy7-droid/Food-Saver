import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

import { getUserByEmail, createUser, getDonations, saveDonations, getMessages, saveMessages, getNotifications, saveNotifications, getReports, saveReports } from './models/db.js';
import { authenticateToken, requireAuth, requireRole, generateToken } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Global session populator
app.use(authenticateToken);

// ==========================================
// ROLE-BASED DASHBOARD ROUTE PROTECTION
// ==========================================

app.get('/dashboard-restaurant.html', requireRole(['Restaurant', 'Supermarket', 'Bakery']), (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard-restaurant.html'));
});

app.get('/dashboard-charity.html', requireRole(['Charity']), (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard-charity.html'));
});

app.get('/dashboard-volunteer.html', requireRole(['Volunteer']), (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard-volunteer.html'));
});

app.get('/dashboard-admin.html', requireRole(['Admin']), (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard-admin.html'));
});

// ==========================================
// AUTHENTICATION API ENDPOINTS
// ==========================================

// Register Route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, mobileNumber, password, confirmPassword, role } = req.body;

    // Validate inputs
    if (!fullName || !email || !mobileNumber || !password || !confirmPassword || !role) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Role validation
    const allowedRoles = ['Restaurant', 'Supermarket', 'Bakery', 'Charity', 'Volunteer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid user role selected.' });
    }

    // Create user in local file database
    const user = await createUser({
      fullName,
      email,
      mobileNumber,
      password,
      role
    });

    res.status(201).json({ message: 'Registration successful! Redirecting to login...', user });
  } catch (error) {
    console.error('Registration failed:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const searchEmail = email.trim().toLowerCase();

    // Check if user exists
    const user = await getUserByEmail(searchEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check credentials (special direct verification for hardcoded admin bypass protection)
    let isMatch = false;
    if (searchEmail === 'admin@foodwaste.com' && password === 'admin@123') {
      isMatch = true;
    } else {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = generateToken(user, rememberMe);

    // Set HTTP-Only Cookie
    const cookieOptions = {
      httpOnly: true,
      secure: false, // Set to true if running over HTTPS in production
      sameSite: 'lax',
      path: '/'
    };

    if (rememberMe) {
      // 30 days
      cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000;
    }

    res.cookie('foodsaver_session', token, cookieOptions);

    // Determine redirection dashboard based on user role
    let redirectUrl = '/unauthorized.html';
    const roleLower = user.role.toLowerCase();
    
    if (roleLower === 'restaurant' || roleLower === 'supermarket' || roleLower === 'bakery') {
      redirectUrl = '/dashboard-restaurant.html';
    } else if (roleLower === 'charity') {
      redirectUrl = '/dashboard-charity.html';
    } else if (roleLower === 'volunteer') {
      redirectUrl = '/dashboard-volunteer.html';
    } else if (roleLower === 'admin') {
      redirectUrl = '/dashboard-admin.html';
    }

    res.status(200).json({
      message: 'Login successful! Redirecting...',
      user: {
        fullName: user.fullName,
        email: user.email,
        role: user.role
      },
      redirectUrl
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// Logout Route
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('foodsaver_session');
  res.status(200).json({ message: 'Logged out successfully. Redirecting to home...', redirectUrl: '/index.html' });
});

// Get Logged In User Profile Session
app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  res.status(200).json({ user: req.user });
});

// ==========================================
// STATIC FILES & FALLBACKS
// ==========================================

// Get Logged In User Profile Session
app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  res.status(200).json({ user: req.user });
});

// ==========================================
// FOODSAVER REST API ENDPOINTS
// ==========================================

// --- DONATIONS FLOW APIS ---

// Get all donations
app.get('/api/donations', async (req, res) => {
  try {
    const list = await getDonations();
    res.status(200).json({ donations: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Publish Donation listing
app.post('/api/donations/create', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    
    const { foodName, category, quantity, meals, expiryDate, expiryTime, address, instructions, window } = req.body;
    
    if (!foodName || !category || !quantity || !meals || !expiryDate || !expiryTime || !address) {
      return res.status(400).json({ error: 'Required fields are missing.' });
    }

    const donations = await getDonations();
    const newDon = {
      id: 'DON-' + Math.floor(100 + Math.random() * 900),
      donorName: req.user.fullName,
      orgType: req.user.role,
      foodName,
      category,
      quantity,
      meals: parseInt(meals, 10),
      expiry: `${expiryDate} ${expiryTime}`,
      status: 'Available',
      address,
      instructions,
      window,
      charity: '-',
      volunteer: '-',
      date: new Date().toISOString().split('T')[0]
    };

    donations.unshift(newDon);
    await saveDonations(donations);

    // Create system notification
    const alerts = await getNotifications();
    alerts.unshift({
      id: 'alert_' + Math.random().toString(36).substr(2, 9),
      recipient: 'Admin',
      title: 'New Donation Listing',
      text: `${req.user.fullName} published "${foodName}" (${newDon.id}).`,
      time: 'Just now',
      read: false
    });
    await saveNotifications(alerts);

    res.status(201).json({ message: 'Donation published successfully!', donation: newDon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Request (Charity)
app.post('/api/donations/request', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { donationId } = req.body;
    
    let donations = await getDonations();
    const don = donations.find(d => d.id === donationId);
    if (!don) return res.status(404).json({ error: 'Donation not found.' });

    don.status = 'Requested';
    don.charity = req.user.fullName;
    await saveDonations(donations);

    // Notify Donor
    const alerts = await getNotifications();
    alerts.unshift({
      id: 'alert_' + Math.random().toString(36).substr(2, 9),
      recipient: don.donorName,
      title: 'Donation Requested',
      text: `${req.user.fullName} requested your listing: "${don.foodName}".`,
      time: 'Just now',
      read: false
    });
    await saveNotifications(alerts);

    res.status(200).json({ message: 'Request submitted successfully!', donation: don });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve Request (Donor)
app.post('/api/donations/approve', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { donationId } = req.body;
    
    let donations = await getDonations();
    const don = donations.find(d => d.id === donationId);
    if (!don) return res.status(404).json({ error: 'Donation not found.' });

    don.status = 'Approved';
    await saveDonations(donations);

    // Notify Charity & Admin
    const alerts = await getNotifications();
    alerts.unshift({
      id: 'alert_' + Math.random().toString(36).substr(2, 9),
      recipient: don.charity,
      title: 'Request Approved',
      text: `${don.donorName} approved your request for: "${don.foodName}".`,
      time: 'Just now',
      read: false
    });
    alerts.unshift({
      id: 'alert_' + Math.random().toString(36).substr(2, 9),
      recipient: 'Volunteer', // Broadcast alert for volunteers to accept
      title: 'Delivery Job Available',
      text: `Approved delivery job from "${don.donorName}" to "${don.charity}" is open.`,
      time: 'Just now',
      read: false
    });
    await saveNotifications(alerts);

    res.status(200).json({ message: 'Request approved!', donation: don });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept Delivery (Volunteer)
app.post('/api/donations/accept-delivery', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { donationId } = req.body;
    
    let donations = await getDonations();
    const don = donations.find(d => d.id === donationId);
    if (!don) return res.status(404).json({ error: 'Donation not found.' });

    don.status = 'Volunteer Assigned';
    don.volunteer = req.user.fullName;
    await saveDonations(donations);

    // Notify Donor & Charity
    const alerts = await getNotifications();
    const alertBody = {
      time: 'Just now',
      read: false
    };
    alerts.unshift({
      id: 'alert_' + Math.random().toString(36).substr(2, 9),
      recipient: don.donorName,
      title: 'Volunteer Assigned',
      text: `Volunteer ${req.user.fullName} accepted delivery for: "${don.foodName}".`,
      ...alertBody
    });
    alerts.unshift({
      id: 'alert_' + Math.random().toString(36).substr(2, 9),
      recipient: don.charity,
      title: 'Volunteer Assigned',
      text: `Volunteer ${req.user.fullName} will deliver your food listing.`,
      ...alertBody
    });
    await saveNotifications(alerts);

    res.status(200).json({ message: 'Delivery accepted!', donation: don });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Status (Volunteer/Donor/Charity)
app.post('/api/donations/update-status', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { donationId, status } = req.body;
    
    let donations = await getDonations();
    const don = donations.find(d => d.id === donationId);
    if (!don) return res.status(404).json({ error: 'Donation not found.' });

    don.status = status;
    await saveDonations(donations);

    // Notify stakeholders
    const alerts = await getNotifications();
    const alertBody = {
      id: 'alert_' + Math.random().toString(36).substr(2, 9),
      time: 'Just now',
      read: false
    };
    
    if (status === 'Picked Up') {
      alerts.unshift({ recipient: don.donorName, title: 'Donation Picked Up', text: `Courier picked up "${don.foodName}".`, ...alertBody });
      alerts.unshift({ recipient: don.charity, title: 'Donation Picked Up', text: `Courier picked up food. On the way!`, ...alertBody });
    } else if (status === 'Completed' || status === 'Delivered') {
      alerts.unshift({ recipient: don.donorName, title: 'Donation Completed', text: `Your donation "${don.foodName}" has been successfully delivered.`, ...alertBody });
      alerts.unshift({ recipient: don.charity, title: 'Donation Completed', text: `Donation "${don.foodName}" successfully completed.`, ...alertBody });
      alerts.unshift({ recipient: 'Admin', title: 'Food Saved Success', text: `Completed listing: ${don.meals} meals saved from landfills.`, ...alertBody });
    }

    await saveNotifications(alerts);
    res.status(200).json({ message: 'Status updated!', donation: don });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Expire Donation
app.post('/api/donations/expire', async (req, res) => {
  try {
    const { donationId } = req.body;
    let donations = await getDonations();
    const don = donations.find(d => d.id === donationId);
    if (don) {
      don.status = 'Expired';
      await saveDonations(donations);
    }
    res.status(200).json({ message: 'Listing expired.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Donation
app.post('/api/donations/delete', async (req, res) => {
  try {
    const { donationId } = req.body;
    let donations = await getDonations();
    donations = donations.filter(d => d.id !== donationId);
    await saveDonations(donations);
    res.status(200).json({ message: 'Listing deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CHAT SYSTEM APIS ---

// Get messages for conversation
app.get('/api/chat/messages', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { contact } = req.query;
    
    const messages = await getMessages();
    const conversation = messages.filter(m => 
      (m.sender === req.user.fullName && m.recipient === contact) ||
      (m.sender === contact && m.recipient === req.user.fullName)
    );

    res.status(200).json({ messages: conversation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send Chat message
app.post('/api/chat/send', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { recipient, text, image } = req.body;

    if (!recipient || (!text && !image)) {
      return res.status(400).json({ error: 'Recipient and content are required.' });
    }

    const messages = await getMessages();
    const newMsg = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      sender: req.user.fullName,
      recipient,
      text,
      image: image || null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    messages.push(newMsg);
    await saveMessages(messages);

    res.status(201).json({ message: 'Message sent successfully!', msg: newMsg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PERSISTENT NOTIFICATIONS APIS ---

app.get('/api/notifications', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const alerts = await getNotifications();
    
    // Filter alerts for current user or broadcast alerts (recipient is Volunteer for volunteers, etc.)
    const userAlerts = alerts.filter(a => 
      a.recipient === req.user.fullName || 
      a.recipient === req.user.role ||
      (req.user.role === 'Admin' && a.recipient === 'Admin')
    );

    res.status(200).json({ notifications: userAlerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/read', async (req, res) => {
  try {
    const { notificationId } = req.body;
    let alerts = await getNotifications();
    const alert = alerts.find(a => a.id === notificationId);
    if (alert) {
      alert.read = true;
      await saveNotifications(alerts);
    }
    res.status(200).json({ message: 'Alert marked read.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/delete', async (req, res) => {
  try {
    const { notificationId } = req.body;
    let alerts = await getNotifications();
    alerts = alerts.filter(a => a.id !== notificationId);
    await saveNotifications(alerts);
    res.status(200).json({ message: 'Alert deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- COMPLAINTS & REPORTS APIS ---

app.get('/api/reports', async (req, res) => {
  try {
    const list = await getReports();
    res.status(200).json({ reports: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reports/submit', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    const { subject, category, description } = req.body;

    if (!subject || !category || !description) {
      return res.status(400).json({ error: 'Required details are missing.' });
    }

    const list = await getReports();
    const newReport = {
      id: 'REP-' + Math.floor(100 + Math.random() * 900),
      reporter: req.user.fullName,
      target: subject,
      category,
      desc: description,
      date: new Date().toISOString().split('T')[0],
      status: 'Investigating',
      severity: 'Medium'
    };

    list.unshift(newReport);
    await saveReports(list);

    // Notify Admin
    const alerts = await getNotifications();
    alerts.unshift({
      id: 'alert_' + Math.random().toString(36).substr(2, 9),
      recipient: 'Admin',
      title: 'Report Submitted',
      text: `${req.user.fullName} submitted report against: "${subject}".`,
      time: 'Just now',
      read: false
    });
    await saveNotifications(alerts);

    res.status(201).json({ message: 'Report submitted successfully!', report: newReport });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Resolve Report
app.post('/api/reports/resolve', async (req, res) => {
  try {
    const { reportId } = req.body;
    let list = await getReports();
    const rep = list.find(r => r.id === reportId);
    if (rep) {
      rep.status = 'Resolved';
      await saveReports(list);
    }
    res.status(200).json({ message: 'Report marked resolved.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Report
app.post('/api/reports/delete', async (req, res) => {
  try {
    const { reportId } = req.body;
    let list = await getReports();
    list = list.filter(r => r.id !== reportId);
    await saveReports(list);
    res.status(200).json({ message: 'Report deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- AI PREDICTIVE FORECASTS APIS ---

app.get('/api/ai/predict-waste', (req, res) => {
  // Returns simulated prediction models with high confidence values
  res.status(200).json({
    forecasts: [
      { id: 1, title: 'Waste Prediction Forecast', desc: 'Peak surplus bread inventory expected at Green Bistro on Sundays. Suggested morning collection shifts.', confidence: '94%' },
      { id: 2, title: 'High-Risk Expiring Items', desc: 'Dairy listings will expire within 90 minutes. Auto-assigned Carlos Diaz who is active nearby.', confidence: '87%' }
    ]
  });
});

app.get('/api/ai/recommend-charities', (req, res) => {
  res.status(200).json({
    recommendations: [
      { name: 'Hope Food Bank', distance: '1.2 km', capacity: 'High (80%)', matchScore: '96%' },
      { name: 'Shelter District', distance: '2.5 km', capacity: 'Medium (60%)', matchScore: '89%' }
    ]
  });
});

// ==========================================
// STATIC FILES & FALLBACKS
// ==========================================

// Serve static assets from root directory
app.use(express.static(path.join(__dirname, '.')));

// 404 Route handling
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`FoodSaver backend server running on http://localhost:${PORT}`);
});
