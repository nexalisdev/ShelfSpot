/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from 'react';
import { backendApi } from '@/lib/backend-api';

export default function TestConnection() {
    const [result, setResult] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const testConnection = async () => {
        setLoading(true);
        setResult('Testing connection...');

        try {
            await backendApi.getProfile();
            setResult('✅ Backend connection successful');
        } catch (error) {
            setResult(`❌ Connection failed: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const testRegister = async () => {
        setLoading(true);
        setResult('Testing registration...');

        try {
            const testUser = {
                email: 'test@example.com',
                password: 'test123456',
                name: 'Test User'
            };

            const response = await backendApi.register(testUser.email, testUser.password, testUser.name);
            setResult(`✅ Registration successful: ${JSON.stringify(response)}`);
        } catch (error: any) {
            setResult(`❌ Registration failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testLogin = async () => {
        setLoading(true);
        setResult('Testing login...');

        try {
            const response = await backendApi.login('test@example.com', 'test123456');
            setResult(`✅ Login successful: ${JSON.stringify(response)}`);
        } catch (error: any) {
            setResult(`❌ Login failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">Backend Connection Test</h2>
            <div className="space-y-2 mb-4">
                <button
                    onClick={testConnection}
                    disabled={loading}
                    className="w-full p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                    Test Connection
                </button>
                <button
                    onClick={testRegister}
                    disabled={loading}
                    className="w-full p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                    Test Register
                </button>
                <button
                    onClick={testLogin}
                    disabled={loading}
                    className="w-full p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                    Test Login
                </button>
            </div>
            <div className="p-4 bg-muted rounded-lg min-h-[100px]">
                <pre className="text-sm">{result}</pre>
            </div>
        </div>
    );
}
