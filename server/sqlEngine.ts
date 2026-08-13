import alasql from 'alasql';
import { DataRecord } from './types';

export class SqlEngine {
  public static executeReadOnlyQuery(sql: string, records: DataRecord[]): { success: boolean; data?: any[]; error?: string; rowCount?: number } {
    const trimmedSql = sql.trim().toUpperCase();

    // Safety checks
    const forbiddenKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE', 'EXEC', 'GRANT', 'REVOKE'];
    for (const kw of forbiddenKeywords) {
      if (trimmedSql.includes(kw)) {
        return {
          success: false,
          error: `SQL Security Policy Violation: ${kw} statements are forbidden. Only read-only queries are permitted.`
        };
      }
    }

    if (!trimmedSql.startsWith('SELECT') && !trimmedSql.startsWith('WITH')) {
      return {
        success: false,
        error: 'Only SELECT and WITH queries are allowed.'
      };
    }

    try {
      // Register dataset tables in alaSQL
      alasql.tables = {}; // Reset tables
      
      // Register as both 'trips' and 'dataset'
      alasql('CREATE TABLE trips');
      alasql.tables.trips.data = records;

      alasql('CREATE TABLE dataset');
      alasql.tables.dataset.data = records;

      const result = alasql(sql);
      const rows = Array.isArray(result) ? result : [result];

      return {
        success: true,
        data: rows,
        rowCount: rows.length
      };
    } catch (err: any) {
      return {
        success: false,
        error: `SQL Execution Error: ${err.message || 'Syntax error in SQL query.'}`
      };
    }
  }
}
