import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-display font-bold text-primary-800 mb-4">
          Tea Boys Management System
        </h1>
        <p className="text-lg text-secondary-600 mb-8">
          Multi-store POS & Inventory Management
        </p>
        <button
          onClick={() => setCount((count) => count + 1)}
          className="btn-primary"
        >
          Count is {count}
        </button>
        <p className="mt-4 text-sm text-secondary-500">
          Phase 0 Setup Complete ✅
        </p>
      </div>
    </div>
  )
}

export default App
