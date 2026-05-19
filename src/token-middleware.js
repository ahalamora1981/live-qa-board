function tokenMiddleware(req, res, next) {
  const token = req.headers['x-anonymous-token'];
  if (!token) {
    return res.status(401).json({ error: 'X-Anonymous-Token header is required' });
  }
  req.anonToken = token;
  next();
}

module.exports = tokenMiddleware;
