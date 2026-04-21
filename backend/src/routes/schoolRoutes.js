const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

router.get('/', async (req, res, next) => {
  try {
    const { province, category, keyword, page = 1, limit = 20 } = req.query;
    
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (province) {
      conditions.push(`province = $${paramCount++}`);
      values.push(province);
    }

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
      `SELECT * FROM universities ${whereClause} ORDER BY id ASC LIMIT $${paramCount++} OFFSET $${paramCount}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM universities ${whereClause}`,
      values.slice(0, -2)
    );

    const schools = result.rows.map(s => ({
      ...s,
      tags: s.tags || [],
      features: s.features || [])
    }));

    res.json({
      success: true,
      data: {
        list: schools,
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

    const result = await query('SELECT * FROM universities WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '院校不存在' });
    }

    const school = result.rows[0];
    school.tags = school.tags || [];
    school.features = school.features || [];

    res.json({ success: true, data: school });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/scores', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { year, category } = req.query;

    const conditions = ['school_id = $1'];
    const values = [id];
    let paramCount = 2;

    if (year) {
      conditions.push(`year = $${paramCount++}`);
      values.push(year);
    }

    if (category) {
      conditions.push(`category = $${paramCount++}`);
      values.push(category);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const result = await query(
      `SELECT * FROM school_scores ${whereClause} ORDER BY year DESC`,
      values
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
