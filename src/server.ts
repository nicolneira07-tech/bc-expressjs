// ============================================
// SERVER — Entry point
// ============================================
// Único lugar del proyecto que llama app.listen(). Ya no hay console.log:
// todo el logging pasa por Winston.

import app from './app';
import { logger } from './config/logger';

const PORT = parseInt(process.env['PORT'] ?? '3000', 10);

app.listen(PORT, () => {
  logger.info(`Servidor escuchando en http://localhost:${PORT}`);
  logger.info(`Health:  http://localhost:${PORT}/health`);
  logger.info(`API v1:  http://localhost:${PORT}/api/v1/inventory-items`);
});
