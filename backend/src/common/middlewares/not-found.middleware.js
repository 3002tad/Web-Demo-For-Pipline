function notFoundMiddleware(req, res) {
  res.status(404).json({
    success: false,
    error: "Not found"
  });
}

module.exports = notFoundMiddleware;
