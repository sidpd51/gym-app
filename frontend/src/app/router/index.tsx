import { createBrowserRouter } from 'react-router-dom'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold">Gym Management System</h1>
        <p className="mt-2 text-gray-500">Frontend foundation is ready.</p>
      </div>
    ),
  },
])
