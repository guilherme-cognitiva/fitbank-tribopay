import supabase from '../config/database.js';

export class AuditService {
  static async log(userId, action, entity, entityId, ipAddress, userAgent, metadata = {}) {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action,
          entity,
          entity_id: entityId,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata
        });

      if (error) {
        console.error('Audit log error:', error);
      }
    } catch (err) {
      console.error('Audit service error:', err);
    }
  }

  static async getAuditLogs(page = 1, limit = 50, userId = null) {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Get audit logs error:', err);
      throw err;
    }
  }
}