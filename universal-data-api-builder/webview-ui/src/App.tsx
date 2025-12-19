import React, { useState, useEffect } from 'react';
import { ConnectForm } from './components/ConnectForm';
import { EntitySelector } from './components/EntitySelector';
import { vscode } from './utilities/vscode';

const App = () => {
    const [view, setView] = useState<'connect' | 'select'>('connect');
    const [loading, setLoading] = useState(false);
    const [tables, setTables] = useState<any[]>([]);

    const [targetFolder, setTargetFolder] = useState<string>('');
    const [initialState, setInitialState] = useState<{ dbType: string; connectionString: string } | undefined>(undefined);

    useEffect(() => {
        // Notify extension that UI is ready 
        vscode.postMessage({ command: 'ready' });

        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            switch (message.command) {
                case 'init':
                    setInitialState({ dbType: message.dbType, connectionString: message.connectionString });
                    setTargetFolder(message.targetFolder || '');
                    break;
                case 'folderPicked':
                    setTargetFolder(message.path);
                    break;
                case 'tablesLoaded':
                    setTables(message.tables);
                    setLoading(false);
                    setView('select');
                    break;
                case 'generated':
                    setLoading(false);
                    // Pass a signal to EntitySelector that generation was successful
                    setTables(prev => [...prev]); // Trigger re-render with same data but new signal if needed
                    // Actually, let's use a dedicated state or event
                    window.dispatchEvent(new CustomEvent('dab-generated', { detail: message }));
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
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {view === 'connect' && (
                <ConnectForm isLoading={loading} initialState={initialState} />
            )}

            {view === 'select' && (
                <EntitySelector
                    tables={tables}
                    targetFolder={targetFolder}
                    onBack={() => setView('connect')}
                />
            )}
        </main>
    );
};

export default App;
