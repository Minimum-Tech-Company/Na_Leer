'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Users,
  Receipt,
  CreditCard,
  Settings,
  LogOut,
  Shield,
  FileText,
} from 'lucide-react'
import { Profile } from '@/types'

const adminNavigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Utilisateurs', href: '/admin/users', icon: Users },
  { name: 'Factures', href: '/admin/invoices', icon: Receipt },
  { name: 'Paiements', href: '/admin/payments', icon: CreditCard },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const checkAdmin = async () => {
      const res = await fetch('/api/admin/auth/verify')
      if (!res.ok) {
        router.push('/admin/login')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (data) setProfile(data)
      }

      setAuthenticated(true)
      setLoading(false)
    }

    checkAdmin()
  }, [supabase, router])

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading || !authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Vérification des accès...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col bg-gray-900 border-r border-gray-800">
          <div className="flex items-center gap-2 p-5 border-b border-gray-800">
            <Shield className="h-7 w-7 text-red-500" />
            <span className="text-lg font-bold text-white">NA-Leer Admin</span>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-red-500/10 text-red-400'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-red-400">
                  {profile?.full_name?.charAt(0) || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.full_name}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  Administrateur
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard" className="flex-1">
                <Button variant="ghost" className="w-full justify-start gap-3 text-gray-400 hover:text-white">
                  <FileText className="h-4 w-4" />
                  App
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="justify-start gap-3 text-gray-400 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
