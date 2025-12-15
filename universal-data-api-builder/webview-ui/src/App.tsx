import React, { useState, useEffect } from 'react';
import { ConnectForm } from './components/ConnectForm';
import { EntitySelector } from './components/EntitySelector';
import { vscode } from './utilities/vscode';

const App = () => {
    const [view, setView] = useState<'connect' | 'select'>('connect');
    const [loading, setLoading] = useState(false);
    const [tables, setTables] = useState<any[]>([]);

    const [initialState, setInitialState] = useState<{ dbType: string; connectionString: string } | undefined>(undefined);

    useEffect(() => {
        // Notify extension that UI is ready 
        vscode.postMessage({ command: 'ready' });

        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            switch (message.command) {
                case 'init':
                    setInitialState({ dbType: message.dbType, connectionString: message.connectionString });
                    break;
                case 'tablesLoaded':
                    setTables(message.tables);
                    setLoading(false);
                    setView('select');
                    break;
                case 'error':
                    setLoading(false);
                    // Error handling is done via VS Code window messages mainly, simple console log here
                    console.error(message.error);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <main>
            <h1>Universal DAB Scaffolder</h1>
            <vscode-divider></vscode-divider>

            {view === 'connect' && (
                <ConnectForm isLoading={loading} initialState={initialState} />
            )}

            {view === 'select' && (
                <EntitySelector
                    tables={tables}
                    onBack={() => setView('connect')}
                />
            )}
        </main>
    );
};

export default App;
