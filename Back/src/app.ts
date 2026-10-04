import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import scheduleRoutes from './routes/schedules.routes';
import taskRoutes from './routes/tasks.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', env: process.env.NODE_ENV || 'development' });
});

app.use('/api/v1/schedules', scheduleRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.use(errorHandler as any);

export default app;
