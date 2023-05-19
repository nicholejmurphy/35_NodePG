const db = require("../db");
const express = require("express");
const slugify = require("slugify");
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
    let { code } = req.params;
    const compRes = await db.query(
      `SELECT *
        FROM companies      
        WHERE code = $1`,
      [code]
    );
    const invRes = await db.query(
      `SELECT *
        FROM invoices
        WHERE comp_code = $1`,
      [code]
    );
    const indRes = await db.query(
      `SELECT * 
      FROM companies_industries
      WHERE comp_code = $1`,
      [code]
    );
    const company = compRes.rows[0];
    const invoices = invRes.rows;
    const industries = indRes.rows;
    company.invoices = invoices.map((r) => r.id);
    company.industries = industries.map((r) => r.ind_code);
    if (compRes.rows.length === 0) {
      throw new ExpressError(
        `Could not find company with code: ${req.params.code}`,
        404
      );
    }
    return res.send({ company: company });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const results = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1,$2,$3) RETURNING code, name, description`,
      [slugify(name), name, description]
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
