/**
 * FoodSaver API Client
 * Shared API utility for all dashboards
 */

const BASE = '';

// --- Generic Fetch Helper ---
async function apiFetch(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Request failed.');
  return json;
}

// --- Auth ---
export async function getMe() {
  return apiFetch('GET', '/api/auth/me');
}

export async function logout() {
  return apiFetch('POST', '/api/auth/logout');
}

// --- Donations ---
export async function getDonations() {
  return apiFetch('GET', '/api/donations');
}

export async function createDonation(data) {
  return apiFetch('POST', '/api/donations/create', data);
}

export async function requestDonation(donationId) {
  return apiFetch('POST', '/api/donations/request', { donationId });
}

export async function approveDonation(donationId) {
  return apiFetch('POST', '/api/donations/approve', { donationId });
}

export async function acceptDelivery(donationId) {
  return apiFetch('POST', '/api/donations/accept-delivery', { donationId });
}

export async function updateDonationStatus(donationId, status) {
  return apiFetch('POST', '/api/donations/update-status', { donationId, status });
}

export async function expireDonation(donationId) {
  return apiFetch('POST', '/api/donations/expire', { donationId });
}

export async function deleteDonation(donationId) {
  return apiFetch('POST', '/api/donations/delete', { donationId });
}

// --- Chat ---
export async function getMessages(contact) {
  return apiFetch('GET', `/api/chat/messages?contact=${encodeURIComponent(contact)}`);
}

export async function sendMessage(recipient, text, image = null) {
  return apiFetch('POST', '/api/chat/send', { recipient, text, image });
}

// --- Notifications ---
export async function getNotifications() {
  return apiFetch('GET', '/api/notifications');
}

export async function markNotificationRead(notificationId) {
  return apiFetch('POST', '/api/notifications/read', { notificationId });
}

export async function deleteNotification(notificationId) {
  return apiFetch('POST', '/api/notifications/delete', { notificationId });
}

// --- Reports ---
export async function submitReport(data) {
  return apiFetch('POST', '/api/reports/submit', data);
}

export async function getReports() {
  return apiFetch('GET', '/api/reports');
}

export async function resolveReport(reportId) {
  return apiFetch('POST', '/api/reports/resolve', { reportId });
}

export async function deleteReport(reportId) {
  return apiFetch('POST', '/api/reports/delete', { reportId });
}

// --- AI Insights ---
export async function predictWaste() {
  return apiFetch('GET', '/api/ai/predict-waste');
}

export async function recommendCharities() {
  return apiFetch('GET', '/api/ai/recommend-charities');
}

// --- Helpers ---
export function statusColor(status) {
  const map = {
    'Available': '#10b981',
    'Requested': '#f59e0b',
    'Approved': '#3b82f6',
    'Volunteer Assigned': '#8b5cf6',
    'Picked Up': '#06b6d4',
    'Delivering': '#f97316',
    'Completed': '#6b7280',
    'Expired': '#ef4444',
    'Cancelled': '#ef4444'
  };
  return map[status] || '#6b7280';
}

export function badge(status) {
  const color = statusColor(status);
  return `<span style="display:inline-block;padding:0.2rem 0.75rem;border-radius:999px;font-size:0.75rem;font-weight:700;background:${color}22;color:${color};border:1px solid ${color}55;">${status}</span>`;
}

export function timeSince(isoOrString) {
  if (!isoOrString || isoOrString === 'Just now') return isoOrString || 'Just now';
  return isoOrString;
}

export function showToast(container, message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `alert alert-${type}`;
  toast.textContent = message;
  toast.style.display = 'block';
  toast.style.position = 'fixed';
  toast.style.bottom = '2rem';
  toast.style.right = '2rem';
  toast.style.zIndex = '9999';
  toast.style.minWidth = '280px';
  toast.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
  toast.style.borderRadius = '0.75rem';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

export function confirmDialog(message, onConfirm) {
  if (window.confirm(message)) onConfirm();
}

export function skeleton(lines = 3) {
  return Array.from({ length: lines }, () =>
    `<div style="background:var(--border-color);border-radius:0.5rem;height:1rem;margin-bottom:0.75rem;animation:shimmer 1.5s infinite;"></div>`
  ).join('');
}

export function emptyState(icon, title, desc) {
  return `
  <div style="text-align:center;padding:4rem 2rem;color:var(--text-secondary);">
    <div style="font-size:3rem;margin-bottom:1rem;">${icon}</div>
    <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:0.5rem;color:var(--text-primary);">${title}</h3>
    <p style="font-size:0.9rem;">${desc}</p>
  </div>`;
}
