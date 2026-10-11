const logRequest = (req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
};

const errorHandler = (err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ message: 'Internal server error' });
};

export { logRequest, errorHandler };
