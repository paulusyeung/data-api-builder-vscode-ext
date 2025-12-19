import { WebviewApi } from "vscode-webview";

/**
 * A utility wrapper around the vscode.postMessage API.
 */
class VSCodeAPIWrapper {
    private readonly vsCodeApi: WebviewApi<unknown> | undefined;

    constructor() {
        // Check if the acquireVsCodeApi function exists in the current window object
        if (typeof acquireVsCodeApi === "function") {
            this.vsCodeApi = acquireVsCodeApi();
        }
    }

    /**
     * Post a message to the extension host.
     *
     * @param message The message to send.
     */
    public async postMessage(message: any) {
        if (this.vsCodeApi) {
            this.vsCodeApi.postMessage(message);
        } else {
            console.log("VS Code API not available (running in browser?)", message);
            try {
                const response = await fetch("http://localhost:5000/api/message", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(message),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data) {
                        // Dispatch a message event to simulate VS Code response
                        window.postMessage(data, "*");
                    }
                }
            } catch (err) {
                console.error("Failed to communicate with standalone server:", err);
            }
        }
    }

    /**
     * Get the persistent state stored for this webview.
     *
     * @returns The current state.
     */
    public getState(): unknown | undefined {
        if (this.vsCodeApi) {
            return this.vsCodeApi.getState();
        } else {
            const state = localStorage.getItem("vscodeState");
            return state ? JSON.parse(state) : undefined;
        }
    }

    /**
     * Set the persistent state stored for this webview.
     *
     * @param newState The new state.
     */
    public setState<T>(newState: T): T {
        if (this.vsCodeApi) {
            this.vsCodeApi.setState(newState);
        } else {
            localStorage.setItem("vscodeState", JSON.stringify(newState));
        }
        return newState;
    }
}

// Singleton instance
export const vscode = new VSCodeAPIWrapper();
