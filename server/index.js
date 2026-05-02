const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');

// Load env vars
dotenv.config();

const app = express();

// 🔄 Trust proxy - needed when behind reverse proxy (e.g., Railway, nginx)
app.set('trust proxy', 1);

// 🔐 Security: Set secure HTTP headers
app.use(helmet());

// 🚫 Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later'
});
app.use('/api', limiter);

// 🌐 CORS (temporary open — will restrict later)
app.use(cors({
  origin: "*"
}));

// 🧼 Prevent NoSQL injection & parse JSON
app.use(express.json());
app.use(mongoSanitize());

// 📊 Logging (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// 🗄️ Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// 📦 Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));

// 🏠 Base route
app.get('/', (req, res) => {
  res.json({ message: 'Team Task Manager API is running' });
});

// ❌ Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Something went wrong!'
      : err.message;

  res.status(500).json({ message });
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Mongoose connection error handler
mongoose.connection.on('error', (err) => {
  console.error('MongoDB Connection Error:', err.message);
});

// Mongoose connection disconnect handler
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB Disconnected');
});

module.exports = app;
