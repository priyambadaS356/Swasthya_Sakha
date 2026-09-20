import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import triageRoutes from './routes/triageRoutes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Register Triage API Endpoint
app.use('/api/triage', triageRoutes);

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

// Mock Users Data
const users = [
  { id: 'u1', name: 'Asha Patil', role: 'patient', username: 'patient', password: bcrypt.hashSync('demo123', 8) },
  { id: 'u2', name: 'Neha Deshmukh', role: 'healthWorker', username: 'worker', password: bcrypt.hashSync('demo123', 8) },
  { id: 'u3', name: 'Dr. Meera Shah', role: 'doctor', username: 'doctor', password: bcrypt.hashSync('demo123', 8) },
  { id: 'u4', name: 'Rahul Kulkarni', role: 'facilityAdmin', username: 'facility', password: bcrypt.hashSync('demo123', 8) },
  { id: 'u5', name: 'Priya Nair', role: 'districtAdmin', username: 'district', password: bcrypt.hashSync('demo123', 8) }
];

// Appointment Schema & Model
const appointmentSchema = new mongoose.Schema({
  patient: String,
  doctor: String,
  time: String,
  reason: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
});

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

// Auth Middleware
function auth(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    req.user = jwt.verify(h.replace('Bearer ', ''), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

// Health & Status Check Routes
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'Swasthya Sakha API' }));

// Authentication Route
app.post('/api/auth/login', async (req, res) => {
  const { username, password, role } = req.body || {};
  const u = users.find((x) => x.username === username && x.role === role);
  if (!u || !(await bcrypt.compare(password || '', u.password))) {
    return res.status(401).json({ message: 'Invalid demo credentials' });
  }
  const token = jwt.sign({ id: u.id, name: u.name, role: u.role }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: { id: u.id, name: u.name, role: u.role } });
});

app.get('/api/me', auth, (req, res) => res.json({ user: req.user }));

// Appointment Routes
app.get('/api/appointments', auth, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.json([]);
  res.json(await Appointment.find().sort({ createdAt: -1 }).limit(100));
});

app.post('/api/appointments', auth, async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'MongoDB is not connected' });
  const a = await Appointment.create(req.body);
  res.status(201).json(a);
});

// MongoDB Connection with Clear Diagnostics
let mongo = 'not configured';
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('CRITICAL WARNING: MONGO_URI environment variable is missing on Render!');
}

const connectionString = MONGO_URI || 'mongodb://127.0.0.1:27017/swasthya_sakha';

mongoose
  .connect(connectionString)
  .then(() => {
    mongo = 'connected';
    console.log('>>> MongoDB Connected Successfully! <<<');
  })
  .catch((e) => {
    mongo = 'error';
    console.error('>>> MongoDB Connection Failed: <<<', e.message);
  });

app.get('/api/status', (req, res) => res.json({ api: 'ok', mongo }));

app.listen(PORT, () => console.log(`Swasthya Sakha API running on port ${PORT}`));