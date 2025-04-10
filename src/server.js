const express = require('express');
const cors = require('cors');
// const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware
// app.use(cors());
// app.use(express.json());

// app.use('/api/admin', adminRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});