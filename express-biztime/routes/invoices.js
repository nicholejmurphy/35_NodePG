const db = require("../db");
const express = require("express");
const ExpressError = require("../expressError");

const router = new express.Router();

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM invoices`);
    return res.json(results.rows);
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
    const data = results.rows[0];
    const invoice = {
      id: data.id,
      company: {
        code: data.comp_code,
        name: data.name,
      },
      amt: data.amt,
      paid: data.paid,
      add_date: data.add_date,
      paid_date: data.paid_date,
    };
    return res.send(invoice);
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const results = await db.query(
      `INSERT INTO invoices (comp_code, amt) VALUES ($1,$2) RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    );
    return res.status(201).send({ invoice: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amt, paid } = req.body;
    let paidDate;

    const invoice = await db.query(`SELECT * FROM invoices WHERE id=$1`, [id]);
    if (!invoice.rows[0]) {
      throw new ExpressError(
        `Could not find invoice with id: ${req.params.id}`,
        404
      );
    }

    let currPaidDate = invoice.rows[0].paidDate;

    if (!paid) {
      paidDate = null;
    } else if (paid && !currPaidDate) {
      paidDate = new Date();
    } else {
      paidDate = currPaidDate;
    }
    const results = await db.query(
      `UPDATE invoices 
      SET amt=$1, paid=$2, paid_date=$3 
      WHERE id=$4 
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, paid, paidDate, id]
    );
    return res.send({ invoice: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const results = await db.query(`DELETE FROM invoices WHERE id = $1`, [
      req.params.id,
    ]);
    if (results.rowCount === 0) {
      throw new ExpressError(
        `Could not find invoice with id: ${req.params.id}`,
        404
      );
    }
    return res.send({ status: "Deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
