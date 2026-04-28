const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const { category, keyword, page = 1, limit = 20 } = req.query;
    
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (category) {
      conditions.push(`category = $${paramCount++}`);
      values.push(category);
    }

    if (keyword) {
      conditions.push(`(name ILIKE $${paramCount} OR code ILIKE $${paramCount})`);
      values.push(`%${keyword}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const offset = (page - 1) * limit;
    values.push(Number(limit), offset);

    const result = await query(
      `SELECT * FROM majors ${whereClause} ORDER BY id ASC LIMIT $${paramCount++} OFFSET $${paramCount}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM majors ${whereClause}`,
      values.slice(0, -2)
    );

    const majors = result.rows.map(m => ({
      ...m,
      tags: m.tags || []
    }));

    res.json({
      success: true,
      data: {
        list: majors,
        total: parseInt(countResult.rows[0].count),
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM majors WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '专业不存在' });
    }

    const major = result.rows[0];
    major.tags = major.tags || [];

    res.json({ success: true, data: major });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
