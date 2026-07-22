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

export async function rejectDonation(donationId) {
  return apiFetch('POST', '/api/donations/reject', { donationId });
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
  const toastBox = document.getElementById('toast-container') || document.body;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
  };

  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.success}</div>
    <div class="toast-body">
      <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" aria-label="Close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
    <div class="toast-progress"></div>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 350);
  });

  toastBox.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 350);
  }, 4000);
}

export function confirmDialog(message, onConfirm) {
  if (window.confirm(message)) onConfirm();
}

export function skeleton(lines = 3) {
  return Array.from({ length: lines }, () =>
    `<div class="skeleton-line"></div>`
  ).join('');
}

export function emptyState(icon, title, desc) {
  return `
  <div class="empty-state">
    <div class="empty-state-icon">${icon}</div>
    <h3>${title}</h3>
    <p>${desc}</p>
  </div>`;
}

// Auto-hide page loader
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const loader = document.getElementById('page-loader');
      if (loader) loader.classList.add('hidden');
    }, 300);
  });
  // Fallback timeout in case DOMContentLoaded already fired
  setTimeout(() => {
    const loader = document.getElementById('page-loader');
    if (loader) loader.classList.add('hidden');
  }, 800);
}

