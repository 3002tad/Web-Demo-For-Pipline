function errorMiddleware(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error",
    error: error.message || "Internal server error"
  });
}

module.exports = errorMiddleware;
