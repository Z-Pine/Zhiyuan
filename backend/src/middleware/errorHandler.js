const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: err.errors
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: '未授权访问'
    });
  }

  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: '数据已存在'
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: '关联数据不存在'
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
};

module.exports = { errorHandler };
