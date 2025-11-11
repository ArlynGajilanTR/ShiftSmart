'use client'

import { useState } from 'react'

export default function TestAPI() {
  const [result, setResult] = useState('')

  const testDirectFetch = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: 'arlyn.gajilan@thomsonreuters',
          password: 'testtest'
        })
      })
      
      const data = await response.json()
      setResult(`Direct fetch: ${response.status} - ${JSON.stringify(data)}`)
    } catch (error: any) {
      setResult(`Direct fetch error: ${error.message}`)
    }
  }

  const testApiClient = async () => {
    try {
      const { api } = await import('@/lib/api-client')
      const response = await api.auth.login('arlyn.gajilan@thomsonreuters', 'testtest')
      setResult(`API client success: ${JSON.stringify(response)}`)
    } catch (error: any) {
      setResult(`API client error: ${error.message}`)
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Test API</h1>
      <button onClick={testDirectFetch} style={{ marginRight: '1rem' }}>Test Direct Fetch</button>
      <button onClick={testApiClient}>Test API Client</button>
      <pre>{result}</pre>
    </div>
  )
}
