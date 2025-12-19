import * as sql from 'mssql';

export interface TableDefinition {
    schema: string;
    name: string;
    type: 'table' | 'view';
    keyFields: string[];
    columns: string[];
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

        // 1. Get Tables and Views
        const tablesQuery = `
            SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE IN ('BASE TABLE', 'VIEW')
            ORDER BY TABLE_SCHEMA, TABLE_NAME;
        `;
        const tablesResult = await this.pool.request().query(tablesQuery);

        // 2. Get Columns
        const columnsQuery = `
            SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION;
        `;
        const columnsResult = await this.pool.request().query(columnsQuery);

        // 3. Get Primary Keys
        const pkQuery = `
            SELECT 
                SCHEMA_NAME(t.schema_id) AS TABLE_SCHEMA,
                t.name AS TABLE_NAME,
                c.name AS COLUMN_NAME
            FROM sys.tables t
            INNER JOIN sys.indexes i ON t.object_id = i.object_id
            INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
            INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
            WHERE i.is_primary_key = 1;
        `;
        const pksResult = await this.pool.request().query(pkQuery);

        // Group columns and PKs
        const columnsMap = new Map<string, string[]>();
        columnsResult.recordset.forEach(row => {
            const key = `${row.TABLE_SCHEMA}.${row.TABLE_NAME}`;
            if (!columnsMap.has(key)) columnsMap.set(key, []);
            columnsMap.get(key)!.push(row.COLUMN_NAME);
        });

        const pksMap = new Map<string, string[]>();
        pksResult.recordset.forEach(row => {
            const key = `${row.TABLE_SCHEMA}.${row.TABLE_NAME}`;
            if (!pksMap.has(key)) pksMap.set(key, []);
            pksMap.get(key)!.push(row.COLUMN_NAME);
        });

        return tablesResult.recordset.map(row => {
            const key = `${row.TABLE_SCHEMA}.${row.TABLE_NAME}`;
            return {
                schema: row.TABLE_SCHEMA,
                name: row.TABLE_NAME,
                type: row.TABLE_TYPE === 'VIEW' ? 'view' : 'table',
                keyFields: pksMap.get(key) || [],
                columns: columnsMap.get(key) || []
            };
        });
    }
}
