export function notFound(req, res, next) {
  const error = new Error(`Not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || (error.name === 'CastError' ? 400 : 500);

  res.status(statusCode).json({
    message: error.message || 'Server error',
  });
}
