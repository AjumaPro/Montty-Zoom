/**
 * Activity Logger Utility
 * Tracks all admin actions and system events
 */

const logger = require('./logger');
const db = require('./database');

class ActivityLogger {
  async logActivity(userId, userEmail, action, entityType = null, entityId = null, details = {}, req = null) {
    try {
      const activityLog = {
        userId,
        userEmail,
        action,
        entityType,
        entityId,
        details,
        ipAddress: req ? req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress : null,
        userAgent: req ? req.headers['user-agent'] : null,
        createdAt: new Date()
      };

      if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
        await db.db.query(
          `INSERT INTO activity_logs (user_id, user_email, action, entity_type, entity_id, details, ip_address, user_agent, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            activityLog.userId,
            activityLog.userEmail,
            activityLog.action,
            activityLog.entityType,
            activityLog.entityId,
            JSON.stringify(activityLog.details),
            activityLog.ipAddress,
            activityLog.userAgent,
            activityLog.createdAt
          ]
        );
      } else {
        // In-memory storage fallback
        if (!global.activityLogs) {
          global.activityLogs = [];
        }
        global.activityLogs.push(activityLog);
        // Keep only last 10000 logs in memory
        if (global.activityLogs.length > 10000) {
          global.activityLogs.shift();
        }
      }

      logger.info(`Activity logged: ${action} by ${userEmail}`, { entityType, entityId });
    } catch (error) {
      logger.error('Error logging activity:', error);
      // Don't throw - logging should not break main functionality
    }
  }

  async getActivityLogs(filters = {}) {
    try {
      let logs = [];

      if (db.useDatabase && db.db && db.db.constructor.name === 'Pool') {
        let query = 'SELECT * FROM activity_logs WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (filters.userId) {
          query += ` AND user_id = $${paramIndex++}`;
          params.push(filters.userId);
        }
        if (filters.action) {
          query += ` AND action = $${paramIndex++}`;
          params.push(filters.action);
        }
        if (filters.entityType) {
          query += ` AND entity_type = $${paramIndex++}`;
          params.push(filters.entityType);
        }
        if (filters.startDate) {
          query += ` AND created_at >= $${paramIndex++}`;
          params.push(filters.startDate);
        }
        if (filters.endDate) {
          query += ` AND created_at <= $${paramIndex++}`;
          params.push(filters.endDate);
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex++}`;
        params.push(filters.limit || 1000);

        const result = await db.db.query(query, params);
        logs = result.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          userEmail: row.user_email,
          action: row.action,
          entityType: row.entity_type,
          entityId: row.entity_id,
          details: row.details || {},
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          createdAt: row.created_at
        }));
      } else {
        logs = global.activityLogs || [];
        // Apply filters
        if (filters.userId) logs = logs.filter(l => l.userId === filters.userId);
        if (filters.action) logs = logs.filter(l => l.action === filters.action);
        if (filters.entityType) logs = logs.filter(l => l.entityType === filters.entityType);
        if (filters.startDate) logs = logs.filter(l => new Date(l.createdAt) >= new Date(filters.startDate));
        if (filters.endDate) logs = logs.filter(l => new Date(l.createdAt) <= new Date(filters.endDate));
        logs = logs.slice(0, filters.limit || 1000);
      }

      return logs;
    } catch (error) {
      logger.error('Error fetching activity logs:', error);
      return [];
    }
  }
}

module.exports = new ActivityLogger();

