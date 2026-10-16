const test = require("node:test");
const assert = require("node:assert/strict");
const collegeEmailMiddleware = require("../src/middleware/collegeEmail");

function runMiddleware(email) {
  let nextCalled = false;
  let statusCode;
  let responseBody;

  const req = { body: { email } };
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

  collegeEmailMiddleware(req, res, () => {
    nextCalled = true;
  });

  return { nextCalled, statusCode, responseBody };
}

test("allows an NIE email address", () => {
  const result = runMiddleware("student@nie.ac.in");

  assert.equal(result.nextCalled, true);
  assert.equal(result.statusCode, undefined);
});

test("rejects an email from another domain", () => {
  const result = runMiddleware("student@example.com");

  assert.equal(result.statusCode, 403);
  assert.equal(result.responseBody.message, "Only @nie.ac.in college emails are allowed");
  assert.equal(result.nextCalled, false);
});

test("rejects a missing email", () => {
  const result = runMiddleware(undefined);

  assert.equal(result.statusCode, 403);
  assert.equal(result.nextCalled, false);
});
