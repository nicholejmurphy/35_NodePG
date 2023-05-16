const db = require("../db");
const express = require("express");
const ExpressError = require("../expressError");

const router = new express.Router();

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM companies`);
    return res.json(results.rows);
  } catch (e) {
    return next(e);
  }
});

router.get("/:code", async (req, res, next) => {
  try {
    const results = await db.query(
      `SELECT c.code,
        c.name, 
        c.description, 
        i.id,
        i.amt, 
        i.paid, 
        i.add_date, 
        i.paid_date 
        FROM companies AS c 
        INNER JOIN invoices AS i 
        ON (c.code=i.comp_code)      
        WHERE code = $1`,
      [req.params.code]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(
        `Could not find company with code: ${req.params.code}`,
        404
      );
    }
    const data = results.rows[0];
    const company = {
      code: data.code,
      name: data.name,
      description: data.description,
      invoice: {
        id: data.id,
        amt: data.amt,
        paid: data.paid,
        add_date: data.add_date,
        paid_date: data.paid_date,
      },
    };
    return res.send(company);
  } catch (e) {
    return next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const results = await db.query(
      `SELECT i.id, 
        i.comp_code, 
        i.amt, 
        i.paid, 
        i.add_date, 
        i.paid_date, 
        c.name, 
        c.description 
        FROM invoices AS i 
        INNER JOIN companies AS c 
        ON (i.comp_code=c.code)      
        WHERE id = $1 
  `,
      [req.params.id]
    );
    if (!results.rows[0]) {
      throw new ExpressError(
        `Could not find invoice with id: ${req.params.id}`,
        404
      );
    }

    return res.send(invoice);
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    const results = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1,$2,$3) RETURNING code, name, description`,
      [code, name, description]
    );
    return res.status(201).send({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.put("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const results = await db.query(
      `UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`,
      [name, description, code]
    );
    if (!results.rows[0]) {
      throw new ExpressError(
        `Could not find company with code: ${req.params.code}`,
        404
      );
    }
    return res.send({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:code", async (req, res, next) => {
  try {
    const results = await db.query(`DELETE FROM companies WHERE code = $1`, [
      req.params.code,
    ]);
    if (results.rowCount === 0) {
      throw new ExpressError(
        `Could not find company with code: ${req.params.code}`,
        404
      );
    }
    return res.send({ status: "Deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
