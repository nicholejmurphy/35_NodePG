const db = require("../db");
const express = require("express");
const slugify = require("slugify");
const ExpressError = require("../expressError");

const router = new express.Router();

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM companies_industries`);
    return res.json(results.rows);
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    let { code, industry } = req.body;

    const results = await db.query(
      `INSERT INTO industries (code, industry)
        VALUES ($1, $2)
        RETURNING code, industry`,
      [code, industry]
    );
    return res.status(201).send({ industry: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.post("/:comp_code", async (req, res, next) => {
  try {
    const { comp_code } = req.params;
    const { ind_code } = req.body;
    const compRes = await db.query(
      `SELECT *
          FROM companies      
          WHERE code = $1`,
      [comp_code]
    );
    const indRes = await db.query(
      `SELECT * 
        FROM companies_industries
        WHERE comp_code = $1`,
      [comp_code]
    );
    if (compRes.rows.length === 0 || indRes.rows.length === 0) {
      throw new ExpressError("Invalid company or industry code.", 404);
    }
    const results = await db.query(
      `INSERT INTO companies_industries (comp_code, ind_code) 
      VALUES ($1,$2) 
      RETURNING comp_code, ind_code`,
      [comp_code, ind_code]
    );
    return res.status(201).send({ association: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
