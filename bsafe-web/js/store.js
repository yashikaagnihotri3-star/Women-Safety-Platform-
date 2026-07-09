/**
 * bSafe Data Store
 * Simulates a backend using localStorage so the entire app works standalone
 * without a server. All functions are async (return Promises) so swapping
 * this out for real fetch() calls to a Node/Express API later is a drop-in change.
 */

const DB_KEY = 'bsafe_db_v1';
const SESSION_KEY = 'bsafe_session_v1';

function uid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function delay(ms = 220) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ───────────────────────── Seed Data ───────────────────────── */

function seedData() {
  const now = Date.now();
  return {
    users: [
      {
        id: 'u_admin', role: 'admin', name: 'Admin User', phone: '+91 90000 00000',
        email: 'admin@bsafe.in', password: 'admin123', status: 'active', createdAt: now,
      },
      {
        id: 'u_demo_woman', role: 'woman', name: 'Priya Sharma', phone: '+91 98765 43210',
        email: 'priya@example.com', password: 'demo1234', status: 'active', createdAt: now,
        safetyProfile: {
          bloodGroup: 'O+', medicalNotes: 'No known allergies',
          address: 'Flat 302, Green Residency, Sector 12, Noida', defaultSafeZone: 'Home',
        },
        location: { lat: 28.5708, lng: 77.3260, updatedAt: now },
      },
      {
        id: 'u_demo_vol', role: 'volunteer', name: 'Sunita Verma', phone: '+91 99888 11111',
        email: 'sunita@example.com', password: 'demo1234', status: 'active', createdAt: now,
        location: { lat: 28.5750, lng: 77.3300, updatedAt: now },
      },
      {
        id: 'u_vol2', role: 'volunteer', name: 'Rahul Kumar', phone: '+91 99888 44444',
        email: 'rahul@example.com', password: 'demo1234', status: 'active', createdAt: now,
        location: { lat: 28.5600, lng: 77.3100, updatedAt: now },
      },
      {
        id: 'u_w2', role: 'woman', name: 'Anjali Rao', phone: '+91 98765 11122',
        email: 'anjali@example.com', password: 'demo1234', status: 'active', createdAt: now - 86400000 * 50,
        safetyProfile: {}, location: { lat: 28.6139, lng: 77.2090, updatedAt: now },
      },
      {
        id: 'u_w3', role: 'woman', name: 'Meena Gupta', phone: '+91 98765 33344',
        email: 'meena@example.com', password: 'demo1234', status: 'active', createdAt: now - 86400000 * 30,
        safetyProfile: {}, location: { lat: 28.6304, lng: 77.2177, updatedAt: now },
      },
      {
        id: 'u_w4', role: 'woman', name: 'Kavita Singh', phone: '+91 98765 55566',
        email: 'kavita@example.com', password: 'demo1234', status: 'suspended', createdAt: now - 86400000 * 10,
        safetyProfile: {}, location: null,
      },
    ],

    volunteers: [
      {
        id: 'v_1', userId: 'u_demo_vol', zone: 'Central Delhi / Noida Sector 12',
        idType: 'Aadhaar Card', idNumber: 'xxxx-xxxx-1111', experience: 'NGO volunteer, first-aid trained',
        verification: 'verified', availability: 'available', alertsHandled: 12, createdAt: now,
      },
      {
        id: 'v_2', userId: 'u_vol2', zone: 'Noida Sector 18',
        idType: 'Voter ID', idNumber: 'xxxx-xxxx-4444', experience: '',
        verification: 'pending', availability: 'offline', alertsHandled: 0, createdAt: now,
      },
    ],

    contacts: [
      { id: 'c_1', userId: 'u_demo_woman', name: 'Mom', relation: 'Family', phone: '+91 98100 00001' },
      { id: 'c_2', userId: 'u_demo_woman', name: 'Riya (Best Friend)', relation: 'Friend', phone: '+91 98100 00002' },
    ],

    safeZones: [
      { id: 'z_1', name: 'Connaught Place Police Booth', type: 'Police', address: 'CP Inner Circle, New Delhi', lat: 28.6315, lng: 77.2167, status: 'active' },
      { id: 'z_2', name: 'Fortis Hospital, Noida', type: 'Hospital', address: 'Sector 62, Noida', lat: 28.6147, lng: 77.3676, status: 'active' },
      { id: 'z_3', name: 'Women Helpline Centre', type: 'Helpline', address: 'Lajpat Nagar, Delhi', lat: 28.5677, lng: 77.2433, status: 'active' },
      { id: 'z_4', name: '24/7 Safe Cafe - Brew Point', type: 'Safe Space', address: 'Sector 18, Noida', lat: 28.5697, lng: 77.3260, status: 'inactive' },
    ],

    alerts: [
      {
        id: 'a_1', raisedBy: 'u_w3', location: { lat: 28.6304, lng: 77.2177 }, address: 'Sector 18, Noida',
        notes: '', status: 'resolved', responderId: 'v_1', createdAt: now - 86400000 * 7,
        respondedAt: now - 86400000 * 7 + 60000, resolvedAt: now - 86400000 * 7 + 11 * 60000, responseTimeSeconds: 660,
      },
      {
        id: 'a_2', raisedBy: 'u_w2', location: { lat: 28.6139, lng: 77.2090 }, address: 'Near Rajiv Chowk, New Delhi',
        notes: '', status: 'resolved', responderId: 'v_1', createdAt: now - 86400000 * 2,
        respondedAt: now - 86400000 * 2 + 30000, resolvedAt: now - 86400000 * 2 + 6 * 60000, responseTimeSeconds: 360,
      },
    ],
  };
}

/* ───────────────────────── Low-level persistence ───────────────────────── */

function loadDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const seeded = seedData();
    localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw);
  } catch {
    const seeded = seedData();
    localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}

function setSession(userId) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, ts: Date.now() }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/* ───────────────────────── Public API (async, REST-like) ───────────────────────── */

const Store = {

  /* ---- Auth ---- */
  async register({ name, phone, password, role, email }) {
    await delay();
    const db = loadDB();
    if (db.users.find(u => u.phone === phone)) {
      throw new Error('An account with this phone number already exists');
    }
    const user = {
      id: uid('u'), name, phone, email: email || '', password, role,
      status: 'active', createdAt: Date.now(),
      safetyProfile: role === 'woman' ? {} : undefined,
      location: null,
    };
    db.users.push(user);
    saveDB(db);
    setSession(user.id);
    return sanitizeUser(user);
  },

  async login({ phone, password }) {
    await delay();
    const db = loadDB();
    const user = db.users.find(u => u.phone === phone);
    if (!user || user.password !== password) {
      throw new Error('Invalid phone number or password');
    }
    if (user.status === 'suspended') {
      throw new Error('Your account has been suspended. Please contact support.');
    }
    setSession(user.id);
    return sanitizeUser(user);
  },

  logout() {
    clearSession();
  },

  async getCurrentUser() {
    const session = getSession();
    if (!session) return null;
    const db = loadDB();
    const user = db.users.find(u => u.id === session.userId);
    return user ? sanitizeUser(user) : null;
  },

  requireAuth(allowedRoles) {
    const session = getSession();
    if (!session) {
      window.location.href = resolvePath('index.html');
      return null;
    }
    const db = loadDB();
    const user = db.users.find(u => u.id === session.userId);
    if (!user || user.status === 'suspended') {
      clearSession();
      window.location.href = resolvePath('index.html');
      return null;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      window.location.href = resolvePath(roleHome(user.role));
      return null;
    }
    return sanitizeUser(user);
  },

  /* ---- Safety Profile ---- */
  async updateSafetyProfile(userId, profile) {
    await delay(150);
    const db = loadDB();
    const user = db.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    user.safetyProfile = { ...(user.safetyProfile || {}), ...profile };
    saveDB(db);
    return sanitizeUser(user);
  },

  async updateLocation(userId, { lat, lng }) {
    const db = loadDB();
    const user = db.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    user.location = { lat, lng, updatedAt: Date.now() };
    saveDB(db);
    return user.location;
  },

  /* ---- Contacts ---- */
  async getContacts(userId) {
    await delay(120);
    const db = loadDB();
    return db.contacts.filter(c => c.userId === userId);
  },

  async addContact(userId, { name, relation, phone }) {
    await delay(150);
    const db = loadDB();
    const contact = { id: uid('c'), userId, name, relation: relation || '', phone };
    db.contacts.push(contact);
    saveDB(db);
    return contact;
  },

  async removeContact(userId, contactId) {
    await delay(120);
    const db = loadDB();
    db.contacts = db.contacts.filter(c => !(c.id === contactId && c.userId === userId));
    saveDB(db);
    return true;
  },

  /* ---- Volunteers ---- */
  async registerVolunteer(userId, { zone, idType, idNumber, experience }) {
    await delay(250);
    const db = loadDB();
    const existing = db.volunteers.find(v => v.userId === userId);
    if (existing) return existing;
    const volunteer = {
      id: uid('v'), userId, zone, idType, idNumber, experience: experience || '',
      verification: 'pending', availability: 'offline', alertsHandled: 0, createdAt: Date.now(),
    };
    db.volunteers.push(volunteer);
    saveDB(db);
    return volunteer;
  },

  async getVolunteerByUserId(userId) {
    const db = loadDB();
    return db.volunteers.find(v => v.userId === userId) || null;
  },

  async getAllVolunteers() {
    await delay(150);
    const db = loadDB();
    return db.volunteers.map(v => ({ ...v, user: db.users.find(u => u.id === v.userId) }))
      .map(v => ({ ...v, user: v.user ? sanitizeUser(v.user) : null }));
  },

  async setVolunteerAvailability(userId, availability) {
    await delay(100);
    const db = loadDB();
    const v = db.volunteers.find(v => v.userId === userId);
    if (!v) throw new Error('Volunteer profile not found');
    v.availability = availability;
    saveDB(db);
    return v;
  },

  async verifyVolunteer(volunteerId) {
    await delay(200);
    const db = loadDB();
    const v = db.volunteers.find(v => v.id === volunteerId);
    if (!v) throw new Error('Volunteer not found');
    v.verification = 'verified';
    saveDB(db);
    return v;
  },

  async rejectVolunteer(volunteerId) {
    await delay(200);
    const db = loadDB();
    const v = db.volunteers.find(v => v.id === volunteerId);
    if (!v) throw new Error('Volunteer not found');
    v.verification = 'rejected';
    saveDB(db);
    return v;
  },

  /* ---- Alerts (SOS) ---- */
  async createAlert(userId, { lat, lng, address, notes }) {
    await delay(200);
    const db = loadDB();
    const alert = {
      id: uid('a'), raisedBy: userId,
      location: { lat, lng }, address: address || 'Current Location',
      notes: notes || '', status: 'active', responderId: null,
      createdAt: Date.now(), respondedAt: null, resolvedAt: null, responseTimeSeconds: null,
    };
    db.alerts.unshift(alert);
    saveDB(db);
    return alert;
  },

  async getMyActiveAlert(userId) {
    const db = loadDB();
    return db.alerts.find(a => a.raisedBy === userId && !['resolved', 'cancelled', 'declined'].includes(a.status)) || null;
  },

  async getMyAlertHistory(userId) {
    await delay(150);
    const db = loadDB();
    return db.alerts
      .filter(a => a.raisedBy === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(a => enrichAlert(a, db));
  },

  async cancelAlert(alertId, userId) {
    await delay(100);
    const db = loadDB();
    const alert = db.alerts.find(a => a.id === alertId && a.raisedBy === userId);
    if (!alert) throw new Error('Alert not found');
    alert.status = 'cancelled';
    saveDB(db);
    return alert;
  },

  async getIncomingAlerts(volunteerUserId) {
    await delay(150);
    const db = loadDB();
    const volunteer = db.volunteers.find(v => v.userId === volunteerUserId);
    if (!volunteer) return [];
    return db.alerts
      .filter(a => a.status === 'active' && !(a.declinedBy || []).includes(volunteer.id))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(a => enrichAlert(a, db));
  },

  async getAssignedAlerts(volunteerUserId) {
    await delay(150);
    const db = loadDB();
    const volunteer = db.volunteers.find(v => v.userId === volunteerUserId);
    if (!volunteer) return [];
    return db.alerts
      .filter(a => a.responderId === volunteer.id && !['resolved', 'cancelled', 'declined'].includes(a.status))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(a => enrichAlert(a, db));
  },

  async getMyAlertResponseHistory(volunteerUserId) {
    await delay(150);
    const db = loadDB();
    const volunteer = db.volunteers.find(v => v.userId === volunteerUserId);
    if (!volunteer) return [];
    return db.alerts
      .filter(a => a.responderId === volunteer.id && ['resolved', 'declined'].includes(a.status))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(a => enrichAlert(a, db));
  },

  async acceptAlert(alertId, volunteerUserId) {
    await delay(180);
    const db = loadDB();
    const volunteer = db.volunteers.find(v => v.userId === volunteerUserId);
    if (!volunteer) throw new Error('Volunteer profile not found');
    if (volunteer.verification !== 'verified') throw new Error('Only verified volunteers can accept alerts');

    const alert = db.alerts.find(a => a.id === alertId);
    if (!alert) throw new Error('Alert not found');
    if (alert.status !== 'active') throw new Error('Alert already being handled');

    alert.status = 'accepted';
    alert.responderId = volunteer.id;
    alert.respondedAt = Date.now();
    volunteer.availability = 'busy';
    saveDB(db);
    return enrichAlert(alert, db);
  },

  async declineAlert(alertId, volunteerUserId) {
    await delay(120);
    const db = loadDB();
    const volunteer = db.volunteers.find(v => v.userId === volunteerUserId);
    if (!volunteer) throw new Error('Volunteer profile not found');
    const alert = db.alerts.find(a => a.id === alertId);
    if (!alert) throw new Error('Alert not found');
    alert.declinedBy = alert.declinedBy || [];
    if (!alert.declinedBy.includes(volunteer.id)) alert.declinedBy.push(volunteer.id);
    saveDB(db);
    return true;
  },

  async updateAlertStatus(alertId, volunteerUserId, status) {
    await delay(150);
    const db = loadDB();
    const volunteer = db.volunteers.find(v => v.userId === volunteerUserId);
    if (!volunteer) throw new Error('Volunteer profile not found');
    const alert = db.alerts.find(a => a.id === alertId && a.responderId === volunteer.id);
    if (!alert) throw new Error('Alert not found or not assigned to you');

    alert.status = status;
    if (status === 'resolved') {
      alert.resolvedAt = Date.now();
      alert.responseTimeSeconds = Math.round((alert.resolvedAt - alert.createdAt) / 1000);
      volunteer.availability = 'available';
      volunteer.alertsHandled = (volunteer.alertsHandled || 0) + 1;
    }
    saveDB(db);
    return enrichAlert(alert, db);
  },

  /* ---- Safe Zones ---- */
  async getSafeZones() {
    await delay(120);
    const db = loadDB();
    return db.safeZones;
  },

  async addSafeZone({ name, type, address, lat, lng }) {
    await delay(150);
    const db = loadDB();
    const zone = { id: uid('z'), name, type, address, lat: lat || 0, lng: lng || 0, status: 'active' };
    db.safeZones.push(zone);
    saveDB(db);
    return zone;
  },

  async toggleSafeZone(zoneId) {
    await delay(120);
    const db = loadDB();
    const zone = db.safeZones.find(z => z.id === zoneId);
    if (!zone) throw new Error('Zone not found');
    zone.status = zone.status === 'active' ? 'inactive' : 'active';
    saveDB(db);
    return zone;
  },

  /* ---- Admin: Users ---- */
  async getAllUsers(roleFilter) {
    await delay(150);
    const db = loadDB();
    let users = db.users.filter(u => u.role !== 'admin');
    if (roleFilter) users = users.filter(u => u.role === roleFilter);
    return users.map(sanitizeUser);
  },

  async setUserStatus(userId, status) {
    await delay(150);
    const db = loadDB();
    const user = db.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    user.status = status;
    saveDB(db);
    return sanitizeUser(user);
  },

  /* ---- Admin: Alerts / Reports ---- */
  async getAllAlerts(statusFilter) {
    await delay(150);
    const db = loadDB();
    let alerts = db.alerts;
    if (statusFilter) alerts = alerts.filter(a => a.status === statusFilter);
    return alerts.sort((a, b) => b.createdAt - a.createdAt).map(a => enrichAlert(a, db));
  },

  async getReportSummary() {
    await delay(180);
    const db = loadDB();
    const total = db.alerts.length;
    const resolved = db.alerts.filter(a => a.status === 'resolved').length;
    const active = db.alerts.filter(a => ['active', 'accepted', 'en_route', 'arrived', 'assisting'].includes(a.status)).length;
    const resolvedWithTime = db.alerts.filter(a => a.status === 'resolved' && a.responseTimeSeconds != null);
    const avgResponseSeconds = resolvedWithTime.length
      ? Math.round(resolvedWithTime.reduce((s, a) => s + a.responseTimeSeconds, 0) / resolvedWithTime.length)
      : null;
    const verifiedVolunteers = db.volunteers.filter(v => v.verification === 'verified').length;
    const totalUsers = db.users.filter(u => u.role === 'woman').length;

    return {
      totalIncidents: total, resolved, active,
      resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
      avgResponseSeconds, verifiedVolunteers, totalUsers,
    };
  },

  /* ---- Utility: reset demo data ---- */
  resetDemoData() {
    localStorage.removeItem(DB_KEY);
    loadDB();
  },
};

/* ───────────────────────── Helpers ───────────────────────── */

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

function enrichAlert(alert, db) {
  const raiser = db.users.find(u => u.id === alert.raisedBy);
  const responder = alert.responderId ? db.volunteers.find(v => v.id === alert.responderId) : null;
  const responderUser = responder ? db.users.find(u => u.id === responder.userId) : null;
  return {
    ...alert,
    raisedByUser: raiser ? sanitizeUser(raiser) : null,
    responder: responder ? { ...responder, user: responderUser ? sanitizeUser(responderUser) : null } : null,
  };
}

function roleHome(role) {
  if (role === 'admin') return 'pages/admin.html';
  if (role === 'volunteer') return 'pages/volunteer.html';
  return 'pages/app.html';
}

// Resolves a relative path correctly whether called from root or /pages/
function resolvePath(path) {
  const inPages = window.location.pathname.includes('/pages/');
  if (inPages && !path.startsWith('pages/')) return path.startsWith('../') ? path : path;
  if (inPages && path.startsWith('pages/')) return path.replace('pages/', '');
  if (!inPages && path.startsWith('pages/')) return path;
  return path;
}

window.Store = Store;
window.bsafeUtil = { uid, roleHome, resolvePath };
