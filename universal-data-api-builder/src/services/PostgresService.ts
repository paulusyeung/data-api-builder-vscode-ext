import { Client } from 'pg';

export interface TableDefinition {
    schema: string;
    name: string;
    type: 'table' | 'view';
    keyFields: string[];
    columns: string[];
}

export class PostgresService {
    private client: Client | undefined;

    async connect(connectionString: string): Promise<void> {
        this.client = new Client({ connectionString });
        await this.client.connect();
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.end();
            this.client = undefined;
        }
    }

    async getTablesAndViews(schemas: string[] = ['public']): Promise<TableDefinition[]> {
        if (!this.client) {
            throw new Error('Not connected to database.');
        }

        // 1. Get Tables and Views
        const tablesQuery = `
            SELECT table_schema, table_name, table_type
            FROM information_schema.tables
            WHERE table_schema = ANY($1)
            ORDER BY table_schema, table_name;
        `;
        const tablesRes = await this.client.query(tablesQuery, [schemas]);

        // 2. Get Columns in bulk
        const columnsQuery = `
            SELECT table_schema, table_name, column_name
            FROM information_schema.columns
            WHERE table_schema = ANY($1)
            ORDER BY table_schema, table_name, ordinal_position;
        `;
        const columnsRes = await this.client.query(columnsQuery, [schemas]);

        // 3. Get Primary Keys in bulk
        const pkQuery = `
            SELECT kcu.table_schema, kcu.table_name, kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
              ON tc.constraint_name = kcu.constraint_name 
              AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY' 
              AND tc.table_schema = ANY($1);
        `;
        const pksRes = await this.client.query(pkQuery, [schemas]);

        // Group columns and PKs
        const columnsMap = new Map<string, string[]>();
        columnsRes.rows.forEach(row => {
            const key = `${row.table_schema}.${row.table_name}`;
            if (!columnsMap.has(key)) columnsMap.set(key, []);
            columnsMap.get(key)!.push(row.column_name);
        });

        const pksMap = new Map<string, string[]>();
        pksRes.rows.forEach(row => {
            const key = `${row.table_schema}.${row.table_name}`;
            if (!pksMap.has(key)) pksMap.set(key, []);
            pksMap.get(key)!.push(row.column_name);
        });

        return tablesRes.rows.map(row => {
            const key = `${row.table_schema}.${row.table_name}`;
            return {
                schema: row.table_schema,
                name: row.table_name,
                type: row.table_type === 'VIEW' ? 'view' : 'table',
                keyFields: pksMap.get(key) || [],
                columns: columnsMap.get(key) || []
            };
        });
    }
}
