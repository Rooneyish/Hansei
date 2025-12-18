const express = require('express');
const authenticate = require('./middleware/authenticate');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', authenticate,(req, res) => {
  res.send('Hello, Welcome to the Hansei Project!');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api', require('./routes/userRoutes'));

app.listen(PORT, async() => {
  console.log(`Server is running on http://localhost:${PORT}`);
});