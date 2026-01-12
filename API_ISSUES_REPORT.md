# API Issues Report

## Critical Issues Found

### 1. **JWT Token Error Handling Issue** ⚠️
**File:** `src/utils/jwt.js`
**Problem:** Both `sign()` and `verify()` methods catch errors but throw a generic error message instead of re-throwing the original error.

```javascript
// Current (problematic):
verify: token => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (e) {
        logger.error('Failed to authenticate token', e);
        throw new Error('Failed to authenticate token'); // ❌ Loses original error
    }
},
```

**Impact:** The middleware in `auth.middleware.js` tries to check for specific error names (`TokenExpiredError`, `JsonWebTokenError`) but never receives them because the error is replaced with a generic `Error`.

**Fix:** Re-throw the original error or customize the error object.

---

### 2. **Auth Middleware Error Name Detection Fails** ⚠️
**File:** `src/middleware/auth.middleware.js` (Lines 35-50)
**Problem:** The error handling code checks for `error.name === 'TokenExpiredError'` and `error.name === 'JsonWebTokenError'`, but due to issue #1, these will never match.

```javascript
// This block never executes because error is always 'Error'
if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
        error: 'Access denied',
        message: 'Token expired',
    });
}
```

**Impact:** Token expiration errors won't be distinguished from other errors.

---

### 3. **Cookies Not Attached to Responses** ⚠️
**File:** `src/utils/cookies.js`
**Problem:** Cookie `maxAge` is set to 15 minutes (15 * 60 * 1000 = 900,000ms), but JWT token expiration is set to 1 day in `src/utils/jwt.js`.

```javascript
// jwt.js
const JWT_EXPIRES_IN = '1d'; // 1 day

// cookies.js
maxAge: 15 * 60 * 1000, // 15 minutes ❌ Mismatch!
```

**Impact:** Users will be logged out in 15 minutes due to cookie expiration, even though the JWT token is still valid (1 day). This creates a poor UX.

---

### 4. **Email Field Not Unique in Database Schema** ⚠️
**File:** `src/models/user.model.js`
**Problem:** The `email` field is not marked as unique in the database schema, even though the application treats it as unique.

```javascript
email: varchar('email', { length: 256 }).notNull(), // ❌ Missing .unique()
```

**Impact:** Database constraints won't prevent duplicate emails. The application only checks this in code, which can fail under concurrent requests or direct database writes.

---

### 5. **No Error Handler for Async Operations** ⚠️
**File:** `src/app.js`
**Problem:** No global error handler middleware is defined for catching unhandled errors from async route handlers.

```javascript
// Missing:
app.use((err, req, res, next) => {
    // Error handler
});
```

**Impact:** If an error occurs and `next(e)` is called (as in auth controller), but there's no error handler, the request hangs or returns a 500 with no meaningful response.

---

### 6. **Validation Middleware Conflicts** ⚠️
**File:** `src/app.js` (Line 32-35)
**Problem:** The app applies `apiValidation` middleware globally, but auth routes re-apply `authValidation`:

```javascript
app.use(apiValidation); // Applied globally
app.use('/api/auth', authRateLimiter, authValidation, authRoutes); // Applied again
```

**Impact:** Potential double-validation and inconsistent behavior.

---

### 7. **Missing Environment Variables Validation** ⚠️
**Files:** `src/utils/jwt.js`, `src/config/database.js`
**Problem:** Critical environment variables are not validated at startup:

```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-please-change-in-production';
```

**Impact:** The app will run with insecure defaults in production if env vars are missing, creating a security vulnerability.

---

### 8. **Users Routes Missing Rate Limiter** ⚠️
**File:** `src/app.js`
**Problem:** Auth routes have rate limiting, but users routes don't:

```javascript
app.use('/api/auth', authRateLimiter, authValidation, authRoutes); // ✅ Has rate limiter
app.use('/api/users', usersRoutes); // ❌ No rate limiter
```

**Impact:** Users endpoints are vulnerable to abuse and brute force attacks.

---

### 9. **No Duplicate Email Check Unique Constraint** ⚠️
**File:** `src/models/user.model.js`
**Problem:** Email field needs a unique constraint at the database level.

---

### 10. **Missing Cookie Options in Clear Function** ⚠️
**File:** `src/utils/cookies.js`
**Problem:** When clearing cookies, the options don't include `path: '/'`:

```javascript
clear: (res, name, options = {}) => {
    res.clearCookie(name, { ...cookies.getOptions(), ...options });
},
```

**Impact:** If cookies were set with a specific path, they won't be cleared properly because the path must match.

---

## Summary of Issues by Severity

| Issue | Severity | Location | Type |
|-------|----------|----------|------|
| JWT Error Handling | 🔴 Critical | jwt.js | Bug |
| Auth Middleware Errors | 🔴 Critical | auth.middleware.js | Bug |
| Cookie/JWT TTL Mismatch | 🟠 High | cookies.js, jwt.js | Design |
| Missing Email Unique Constraint | 🟠 High | user.model.js | Database |
| No Global Error Handler | 🟠 High | app.js | Design |
| Validation Middleware Conflict | 🟡 Medium | app.js | Design |
| Missing Env Var Validation | 🟡 Medium | jwt.js, database.js | Security |
| Missing Rate Limiter (Users) | 🟡 Medium | app.js | Security |
| Cookie Clear Path Issue | 🟡 Medium | cookies.js | Bug |

