const app = require('./app');
const { initializeDatabase } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Backend Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

bootstrap();
