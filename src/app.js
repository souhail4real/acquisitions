import express from 'express';
import logger from '#config/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from '#routes/auth.routes.js';
import usersRoutes from '#routes/users.routes.js';
import securityMiddleware, { corsConfig } from '#middleware/security.middleware.js';
import { apiRateLimiter, authRateLimiter } from '#middleware/rateLimiter.middleware.js';
import { apiValidation, authValidation } from '#middleware/validation.middleware.js';

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

app.use(helmet());
app.use(corsConfig); // Custom CORS instead of cors()
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(
    morgan('combined', {
        stream: { write: message => logger.info(message.trim()) },
    })
);

// Apply security middleware
app.use(securityMiddleware);
// app.use(apiRateLimiter); // Temporarily disabled for testing
app.use(apiValidation);

app.get('/', (req, res) => {
    logger.info('Hello from Acquisitions!');

    res.status(200).send('Hello from Acquisitions!');
});

app.get('/health', (req, res) => {
    res
        .status(200)
        .json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
});

app.get('/api', (req, res) => {
    res.status(200).json({ message: 'Acquisitions API is running!' });
});

app.use('/api/auth', authRateLimiter, authValidation, authRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

export default app;