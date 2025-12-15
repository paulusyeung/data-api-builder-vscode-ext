import * as sql from 'mssql';

export interface TableDefinition {
    schema: string;
    name: string;
    type: 'table' | 'view';
}

export class MssqlService {
    private pool: sql.ConnectionPool | undefined;

    async connect(connectionString: string): Promise<void> {
        this.pool = await sql.connect(connectionString);
    }

    async disconnect(): Promise<void> {
        if (this.pool) {
            await this.pool.close();
            this.pool = undefined;
        }
    }

    async getTablesAndViews(): Promise<TableDefinition[]> {
        if (!this.pool || !this.pool.connected) {
            throw new Error('Not connected to database.');
        }

        const query = `
      SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE IN ('BASE TABLE', 'VIEW')
      ORDER BY TABLE_SCHEMA, TABLE_NAME;
    `;

        const result = await this.pool.request().query(query);

        return result.recordset.map(row => ({
            schema: row.TABLE_SCHEMA,
            name: row.TABLE_NAME,
            type: row.TABLE_TYPE === 'VIEW' ? 'view' : 'table'
        }));
    }
}
