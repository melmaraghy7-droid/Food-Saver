import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'foodsaver_secret_jwt_key_2026';

// Middleware to parse and verify the JWT cookie on all incoming requests
export function authenticateToken(req, res, next) {
  const token = req.cookies.foodsaver_session;
  
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, fullName }
    next();
  } catch (error) {
    console.error('Invalid token, clearing session cookie:', error.message);
    res.clearCookie('foodsaver_session');
    req.user = null;
    next();
  }
}

// Middleware to require authentication (logged in)
export function requireAuth(req, res, next) {
  if (!req.user) {
    if (req.xhr || req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    return res.redirect('/login.html');
  }
  next();
}

// Middleware to require role-based access control (RBAC)
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      if (req.xhr || req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Authentication required.' });
      }
      return res.redirect('/login.html');
    }

    const userRole = req.user.role;
    
    // Check if the user's role is in the allowedRoles list
    const hasRole = allowedRoles.some(role => role.toLowerCase() === userRole.toLowerCase());
    
    if (!hasRole) {
      if (req.xhr || req.path.startsWith('/api/')) {
        return res.status(403).json({ error: 'Forbidden: Access denied.' });
      }
      return res.redirect('/unauthorized.html');
    }

    next();
  };
}

// Helper to sign JWTs
export function generateToken(user, rememberMe = false) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName
  };

  const expiresIn = rememberMe ? '30d' : '24h';
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
