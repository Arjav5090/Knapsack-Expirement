"use client"

import { Suspense, lazy } from 'react'

const AdminDashboard = lazy(() => import('@/components/admin-dashboard'))

const AdminLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent mb-4"></div>
      <p className="text-white">Loading Admin Dashboard...</p>
    </div>
  </div>
)

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminLoader />}>
      <AdminDashboard />
    </Suspense>
  )
}
