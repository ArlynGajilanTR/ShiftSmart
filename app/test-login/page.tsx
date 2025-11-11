'use client'

import { useState } from 'react'

export default function TestLogin() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword'
        })
      })
      
      const data = await response.json()
      setResult(`Status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`)
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Test Login API</h1>
      <button 
        onClick={testLogin}
        disabled={loading}
        style={{
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '1rem'
        }}
      >
        {loading ? 'Testing...' : 'Test Login API'}
      </button>
      <pre style={{ 
        background: '#f0f0f0', 
        padding: '1rem',
        borderRadius: '4px',
        whiteSpace: 'pre-wrap'
      }}>
        {result || 'Click button to test'}
      </pre>
    </div>
  )
}
