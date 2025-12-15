import { Client } from 'pg';

export interface TableDefinition {
    schema: string;
    name: string;
    type: 'table' | 'view';
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

        const query = `
      SELECT table_schema, table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = ANY($1)
      ORDER BY table_schema, table_name;
    `;

        const res = await this.client.query(query, [schemas]);

        return res.rows.map(row => ({
            schema: row.table_schema,
            name: row.table_name,
            type: row.table_type === 'VIEW' ? 'view' : 'table'
        }));
    }
}
