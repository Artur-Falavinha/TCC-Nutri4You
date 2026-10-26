const target = process.env.NUTRI_API_URL || 'http://localhost:8080';

module.exports = [
  {
    context: ['/api/v1'],
    target,
    changeOrigin: true
  }
];
