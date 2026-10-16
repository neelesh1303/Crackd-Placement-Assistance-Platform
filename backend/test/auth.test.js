const { after, test } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { protect } = require("../src/middleware/auth");

const jwtSecret = "test-secret";
const originalJwtSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = jwtSecret;

after(() => {
  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }
});

function runMiddleware(authorization) {
  let nextCalled = false;
  let statusCode;
  let responseBody;

  const req = { headers: {} };
  if (authorization !== undefined) {
    req.headers.authorization = authorization;
  }

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  protect(req, res, () => {
    nextCalled = true;
  });

  return { req, nextCalled, statusCode, responseBody };
}

test("rejects a request without an Authorization header", () => {
  const result = runMiddleware(undefined);

  assert.equal(result.statusCode, 401);
  assert.equal(result.responseBody.message, "Not authorized to access this route");
  assert.equal(result.nextCalled, false);
});

test("rejects an invalid token", () => {
  const result = runMiddleware("Bearer invalid-token");

  assert.equal(result.statusCode, 401);
  assert.equal(result.responseBody.message, "Token is not valid");
  assert.equal(result.nextCalled, false);
});

test("accepts a valid token and attaches its payload to the request", () => {
  const token = jwt.sign({ id: "user-123" }, jwtSecret);
  const result = runMiddleware(`Bearer ${token}`);

  assert.equal(result.nextCalled, true);
  assert.equal(result.statusCode, undefined);
  assert.equal(result.req.user.id, "user-123");
});
