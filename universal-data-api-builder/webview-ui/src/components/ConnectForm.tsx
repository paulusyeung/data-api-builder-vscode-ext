import React, { useState, useEffect } from 'react';
import { vscode } from '../utilities/vscode';

interface ConnectFormProps {
    isLoading: boolean;
    initialState?: { dbType: string; connectionString: string };
}

export const ConnectForm: React.FC<ConnectFormProps> = ({ isLoading, initialState }) => {
    const [dbType, setDbType] = useState('mssql');
    const [connStr, setConnStr] = useState('');

    useEffect(() => {
        if (initialState) {
            setDbType(initialState.dbType);
            setConnStr(initialState.connectionString);
        }
    }, [initialState]);

    const handleConnect = () => {
        vscode.postMessage({
            command: 'connect',
            dbType,
            connectionString: connStr
        });
    };

    return (
        <div className="container">
            <header style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <h1 style={{ color: 'var(--accent-primary)', fontSize: '2rem', marginBottom: '0.5rem' }}>DAB Scaffolder</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Connect to your database to start scaffolding</p>
            </header>

            <section className="config-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Database Connection</h2>

                <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Database Type</label>
                    <vscode-dropdown value={dbType} onChange={(e: any) => setDbType(e.target.value)} style={{ width: '100%' }}>
                        <vscode-option value="mssql">Microsoft SQL Server</vscode-option>
                        <vscode-option value="postgres">PostgreSQL</vscode-option>
                    </vscode-dropdown>
                </div>

                <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Connection String</label>
                    <vscode-text-field
                        placeholder="Server=...;Database=...;"
                        value={connStr}
                        onInput={(e: any) => setConnStr(e.target.value)}
                        style={{ width: '100%' }}
                    ></vscode-text-field>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '4px' }}>
                        {dbType === 'postgres' ? 'e.g. postgres://user:pass@localhost:5432/db' : 'e.g. Server=localhost;Database=db;User=sa;...'}
                    </p>
                </div>

                <div className="button-group" style={{ marginTop: '1rem' }}>
                    <vscode-button
                        onClick={handleConnect}
                        disabled={isLoading || !connStr}
                        style={{ width: '100%', height: '40px' }}
                    >
                        {isLoading ? 'Connecting...' : 'Connect to Database'}
                    </vscode-button>
                </div>
            </section>
        </div>
    );
};
