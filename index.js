const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello, Welcome to the Hansei Project!');
});

app.listen(PORT, async() => {
  console.log(`Server is running on http://localhost:${PORT}`);
});