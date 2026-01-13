export const cookies = {
  getOptions: () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours, matches JWT_EXPIRES_IN
  }),

  set: (res, name, value, options = {}) => {
    res.cookie(name, value, { ...cookies.getOptions(), ...options });
  },

  clear: (res, name, options = {}) => {
    res.clearCookie(name, { path: '/', ...options });
  },

  get: (req, name) => {
    return req.cookies[name];
  },
};
