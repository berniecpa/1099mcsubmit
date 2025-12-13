import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import businessRoutes from './routes/business.js';
import recipientRoutes from './routes/recipients.js';
import form1099Routes from './routes/forms1099.js';
import subscriptionRoutes from './routes/subscription.js';
import { errorHandler } from './middleware/errorHandler.js';
import './config/firebase.js'; // Initialize Firebase

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());

// Stripe webhook needs raw body
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));

// JSON middleware for all other routes
app.use(express.json());

// Routes
app.use('/api/business', businessRoutes);
app.use('/api/recipients', recipientRoutes);
app.use('/api/forms1099', form1099Routes);
app.use('/api/subscription', subscriptionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
