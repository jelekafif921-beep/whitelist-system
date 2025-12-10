export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Whitelist System API',
    endpoints: {
      validate: '/api/license/validate',
      generate: '/api/license/generate',
      whitelist: '/api/license/whitelist'
    }
  })
}
