import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '@/components/common/Header'
import { Sidebar } from '@/components/common/Sidebar'

export function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const handleMobileClose = useCallback(() => {
    setMobileSidebarOpen(false)
  }, [])

  const handleMenuClick = useCallback(() => {
    setMobileSidebarOpen(true)
  }, [])

  return (
    <div className="flex h-screen bg-zinc-50">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={handleMobileClose}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={handleMenuClick} />
        <main className="relative flex-1">
          <div className="absolute inset-0 overflow-x-hidden overflow-y-auto px-6 pt-6 pb-4 flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

