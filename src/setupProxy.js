const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/cryptocompare',
    createProxyMiddleware({
      target: 'https://min-api.cryptocompare.com',
      changeOrigin: true,
      pathRewrite: {
        '^/cryptocompare': '', // Remove the /cryptocompare prefix when forwarding
      },
    })
  );
};