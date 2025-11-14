// Catch-all Vercel Serverless entry for /api/* routes
const app = require('../app');

module.exports = async (req, res) => {
  try {
    // Vercel serverless functions need proper handling
    // The Express app will handle the routing
    return app(req, res);
  } catch (error) {
    console.error('[Serverless] Unhandled error:', error);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: 'Internal Server Error' });
    }
  }
};
