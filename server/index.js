import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes.js';
import accountsRoutes from './routes/accounts.routes.js';
import balancesRoutes from './routes/balances.routes.js';
import pixRoutes from './routes/pix.routes.js';
import { balanceUpdater } from './jobs/balanceUpdater.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/balances', balancesRoutes);
app.use('/api/pix', pixRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Check configuration
  if (!process.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL.includes('your-project-id') || !process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your_supabase_service_role_key')) {
    console.log('');
    console.log('⚠️  CONFIGURATION REQUIRED:');
    console.log('📝 Please update your .env file with real Supabase credentials:');
    console.log('   - VITE_SUPABASE_URL (your Supabase project URL)');
    console.log('   - VITE_SUPABASE_ANON_KEY (your Supabase anon/public key)');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY (your Supabase service role key)');
    console.log('🔗 Get these from: https://supabase.com/dashboard/project/[your-project]/settings/api');
    console.log('');
  } else {
    console.log('✅ Supabase configuration detected');
  }
  
  // Start background jobs
  balanceUpdater.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});