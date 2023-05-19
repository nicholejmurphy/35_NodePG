process.env.NODE_ENV == "test";

const request = require("supertest");
const app = require("./app");
const db = require("./db");

let testCompany;

beforeEach(async () => {
  const compResults = await db.query(
    `INSERT INTO companies (code, name, description)
        VALUES ('walmart', 'Walmart', 'Company purchases')
        RETURNING code, name, description`
  );
  testCompany = compResults.rows[0];
  const invResults = await db.query(
    `INSERT INTO invoices (comp_code, amt)
        VALUES ('${testCompany.code}', '100')
        RETURNING id, comp_code, amt, paid, add_date, paid_date`
  );
  testInvoice = invResults.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
  await db.end();
});

describe("GET /companies", () => {
  test("Gets all companies", async () => {
    const response = await request(app).get("/companies");
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual([testCompany]);
  });
});

describe("GET /companies/:code", () => {
  //   test("Gets a company and return company details", async () => {
  //     const response = await request(app).get(`/companies/${testCompany.code}`);
  //     console.log(testInvoice.add_date);
  //     expect(response.statusCode).toEqual(200);
  //     expect(response.body).toBe({
  //       code: testCompany.code,
  //       name: testCompany.name,
  //       description: testCompany.description,
  //       invoice: {
  //         id: testInvoice.id,
  //         amt: testInvoice.amt,
  //         paid: testInvoice.paid,
  //         add_date: expect.any(Date),
  //         paid_date: testInvoice.paid_date,
  //       },
  //     });
  //   });
  test("Gets an invalid company and returns 404", async () => {
    const response = await request(app).get(`/companies/invalid`);
    expect(response.statusCode).toEqual(404);
  });
});

describe("POST /comapnies", () => {
  test("Send comapny data to create new", async () => {
    const newCompany = {
      name: "Target",
      description: "Company groceries",
    };
    const response = await request(app).post("/companies").send(newCompany);
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      company: {
        code: "Target",
        name: "Target",
        description: "Company groceries",
      },
    });
  });
});

describe("PUT /companies/:code", () => {
  test("Update company's data", async () => {
    const response = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send({ name: "Walmart", description: "Updated description" });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      company: {
        code: testCompany.code,
        name: testCompany.name,
        description: "Updated description",
      },
    });
  });
  test("Puts an invalid company and returns 404", async () => {
    const response = await request(app)
      .put(`/companies/invalid`)
      .send({ name: "name", description: "description" });
    expect(response.statusCode).toEqual(404);
  });
});

describe("DELETE /companies/:code", () => {
  test("Delete company's data", async () => {
    const response = await request(app).delete(
      `/companies/${testCompany.code}`
    );
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ status: "Deleted" });
  });
  test("Deletes an invalid company and returns 404", async () => {
    const response = await request(app).delete(`/companies/invalid`);
    expect(response.statusCode).toEqual(404);
  });
});

describe("GET /invoices", () => {
  //   test("Gets all invoices", async () => {
  //     const response = await request(app).get("/invoices");
  //     expect(response.statusCode).toEqual(200);
  //     expect(response.body).toEqual([testInvoice]);
  //   });
});

describe("GET /invoices/:id", () => {
  // test("Gets an invoice and returns invoice details", async () => {
  //   const response = await request(app).get(`/invoices/${testInvoice.id}`);
  //   expect(response.statusCode).toEqual(200);
  //   expect(response.body).toBe({
  //     id: testInvoice.id,
  //     company: {
  //       code: testCompany.code,
  //       name: testCompany.name,
  //     },
  //     amt: testInvoice.amt,
  //     paid: testInvoice.paid,
  //     add_date: expect.any(Date),
  //     paid_date: testInvoice.paid_date,
  //   });
  // });
  test("Gets an invalid invoice and returns 404", async () => {
    const response = await request(app).get(`/invoices/0`);
    expect(response.statusCode).toEqual(404);
  });
});

describe("POST /invoices", () => {
  test("Send invoice data to create new", async () => {
    const newInvoice = {
      comp_code: testCompany.code,
      amt: 200,
    };
    const response = await request(app).post("/invoices").send(newInvoice);
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      invoice: {
        id: expect.any(Number),
        amt: newInvoice.amt,
        comp_code: newInvoice.comp_code,
        paid: false,
        paid_date: null,
        add_date: expect.any(String),
      },
    });
  });
});

describe("PUT /invoices/:id", () => {
  test("Update invoice's data", async () => {
    const response = await request(app)
      .put(`/invoices/${testInvoice.id}`)
      .send({ amt: 200, paid: null });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      invoice: {
        id: expect.any(Number),
        amt: 200,
        comp_code: testInvoice.comp_code,
        paid: false,
        add_date: expect.any(Date),
        paid_date: expect.any(Date),
      },
    });
  });
  test("Puts an invalid invoice and returns 404", async () => {
    const response = await request(app).put(`/invoices/0`).send({ amt: 200 });
    expect(response.statusCode).toEqual(404);
  });
});

describe("DELETE /invoices/:id", () => {
  test("Delete invoice's data", async () => {
    const response = await request(app).delete(`/invoices/${testInvoice.id}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ status: "Deleted" });
  });
  test("Deletes an invalid invoice and returns 404", async () => {
    const response = await request(app).delete(`/invoices/0`);
    expect(response.statusCode).toEqual(404);
  });
});
