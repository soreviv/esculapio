# Sentinel Security Notes

## 2026-02-04 - Session Fixation and Async Callbacks

**Vulnerability:** Session Fixation in `/api/login` where session ID was not regenerated upon authentication.
**Learning:** When fixing this by adding `req.session.regenerate(callback)`, I learned that using `async` functions as callbacks for libraries that expect synchronous or error-first callbacks (like `express-session`) requires careful error handling. If an `async` callback throws (rejects), the exception is not caught by the library or Express's default error handler, leading to hanging requests.
**Prevention:** Always wrap `await` calls inside error-first callbacks with `try/catch` blocks to ensure errors are handled and responses are sent.
