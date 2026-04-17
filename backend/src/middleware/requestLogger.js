const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    };
    
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}]`, JSON.stringify(log));
    }
  });

  next();
};

module.exports = { requestLogger };
