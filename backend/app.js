const express = require('express');
const cors = require('cors');
const authenticate = require('./middleware/authenticate');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors())
app.use(express.json());

app.get('/', authenticate,(req, res) => {
  res.send('Hello, Welcome to the Hansei Project!');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api', require('./routes/userRoutes'));

app.listen(PORT, '0.0.0.0',async() => {
  console.log(`Server is running on http://localhost:${PORT}`);
});