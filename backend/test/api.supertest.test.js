const jwt = require("jsonwebtoken");
const request = require("supertest");

const jwtSecret = "api-test-secret";
const originalJwtSecret = process.env.JWT_SECRET;
const originalGeminiApiKey = process.env.GEMINI_API_KEY;

process.env.JWT_SECRET = jwtSecret;
process.env.GEMINI_API_KEY = "test-gemini-key";

const app = require("../src/app");
const User = require("../src/models/User");
const Company = require("../src/models/Company");

const companies = [
  { _id: "company-1", name: "Acme", slug: "acme" },
  { _id: "company-2", name: "Globex", slug: "globex" },
];

let geminiRequestCount = 0;
let fetchSpy;
let authToken;

beforeAll(() => {
  jest.spyOn(User, "findById").mockImplementation(async (id) => ({
    _id: id,
    name: "Test User",
    email: "test@nie.ac.in",
    branch: "CSE",
    year: 3,
  }));

  jest.spyOn(Company, "find").mockImplementation(() => ({
    sort: async () => companies,
  }));

  jest.spyOn(Company, "findOne").mockImplementation(async ({ slug }) =>
    companies.find((company) => company.slug === slug) || null
  );

  fetchSpy = jest.spyOn(global, "fetch").mockImplementation(async (url) => {
    expect(String(url)).toMatch(/generativelanguage\.googleapis\.com/);
    geminiRequestCount += 1;

    return new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    weeklyPlan: [
                      {
                        week: 1,
                        focus: ["Arrays", "Strings"],
                        tasks: [
                          "Practice array problems",
                          "Review string patterns",
                          "Complete a timed set",
                          "Review mistakes",
                        ],
                      },
                    ],
                  }),
                },
              ],
            },
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  });

  authToken = jwt.sign({ id: "user-123" }, jwtSecret);
});

afterAll(() => {
  jest.restoreAllMocks();

  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }

  if (originalGeminiApiKey === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = originalGeminiApiKey;
  }
});

test("GET /api/auth/me rejects requests without a token", async () => {
  const response = await request(app).get("/api/auth/me");

  expect(response.status).toBe(401);
  expect(response.body.message).toBe("Not authorized to access this route");
});

test("GET /api/auth/me returns the authenticated user", async () => {
  const response = await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${authToken}`);

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.user.id || response.body.user._id).toBe("user-123");
  expect(response.body.user.email).toBe("test@nie.ac.in");
});

test("POST /api/roadmap/generate requires authentication", async () => {
  const requestsBefore = geminiRequestCount;
  const response = await request(app)
    .post("/api/roadmap/generate")
    .send({ role: "SDE Intern", weeks: 2, hoursPerDay: 3 });

  expect(response.status).toBe(401);
  expect(geminiRequestCount).toBe(requestsBefore);
});

test("POST /api/roadmap/generate returns a Gemini roadmap for an authenticated user", async () => {
  const response = await request(app)
    .post("/api/roadmap/generate")
    .set("Authorization", `Bearer ${authToken}`)
    .send({
      role: "SDE Intern",
      weeks: 2,
      hoursPerDay: 3,
      weakTopics: ["Arrays"],
      strongTopics: ["Strings"],
    });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.roadmap.source).toBe("gemini");
  expect(response.body.roadmap.meta.role).toBe("SDE Intern");
  expect(Array.isArray(response.body.roadmap.weeklyPlan)).toBe(true);
  expect(Array.isArray(response.body.roadmap.checklist)).toBe(true);
  expect(response.body.roadmap.weeklyPlan[0].focus[0]).toBe("Arrays");
  expect(fetchSpy).toHaveBeenCalledTimes(1);
});

test("GET /api/companies returns the company list", async () => {
  const response = await request(app).get("/api/companies");

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.count).toBe(companies.length);
  expect(response.body.companies).toEqual(companies);
});

test("GET /api/companies/:slug returns a matching company", async () => {
  const response = await request(app).get("/api/companies/acme");

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.company.slug).toBe("acme");
});

test("GET /api/companies/:slug returns 404 for an unknown company", async () => {
  const response = await request(app).get("/api/companies/unknown-company");

  expect(response.status).toBe(404);
  expect(response.body.message).toBe("Company not found");
});
