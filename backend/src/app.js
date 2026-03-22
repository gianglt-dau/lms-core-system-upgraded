const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admissionRoutes = require('./routes/admissionRoutes');

dotenv.config();

const app = express();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

app.use(cors({
  origin: CLIENT_ORIGIN === '*' ? true : CLIENT_ORIGIN,
  credentials: false
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'API is running smoothly' });
});

app.use('/api/admissions', admissionRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint không tồn tại.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    message: 'Đã xảy ra lỗi nội bộ server.'
  });
});

module.exports = app;
