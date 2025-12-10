export default function handler(req, res) {
  res.status(200).json({
    name: 'Whitelist System API',
    status: 'operational',
    version: '1.0.0',
    endpoints: {
      root: '/api',
      validate_license: '/api/license/validate',
      generate_license: '/api/license/generate',
      test: '/api/test'
    },
    instructions: 'Send POST request to /api/license/validate with {license_key: "YOUR_KEY"}'
  });
}
