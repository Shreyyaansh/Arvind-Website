// Catch-all Vercel Serverless entry for /api/* routes
const app = require('../backend/app');

module.exports = (req, res) => {
  return app(req, res);
};
