require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database/db')
const authenticate = require('./middleware/authenticate');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json());

app.get('/', authenticate,(req, res) => {
  res.send('Hello, Welcome to the Hansei Project!');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api', require('./routes/userRoutes'));

app.listen(PORT, HOST,async() => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});