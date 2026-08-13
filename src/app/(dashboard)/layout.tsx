'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  FileText,
  LayoutDashboard,
  Users,
  Receipt,
  Settings,
  LogOut,
  CreditCard,
  Menu,
  X,
  Zap,
  UserCog,
  Key,
  Headphones,
  Palette,
} from 'lucide-react'
import { Profile, Plan } from '@/types'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Factures', href: '/invoices', icon: Receipt },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Paiements', href: '/payments', icon: CreditCard },
  { name: 'Abonnement', href: '/pricing', icon: Zap },
  { name: 'Paramètres', href: '/settings', icon: Settings },
]

const businessNavigation = [
  { name: 'Équipe', href: '/team', icon: UserCog },
  { name: 'API & Intégrations', href: '/api-docs', icon: Key },
  { name: 'Templates', href: '/templates', icon: Palette },
  { name: 'Support', href: '/support', icon: Headphones },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isBusiness, setIsBusiness] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(data)

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plans(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setIsBusiness(sub?.plans?.id === 'business')
    }

    getProfile()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <Link href="/" className="flex items-center gap-2">
              <FileText className="h-7 w-7 text-blue-600" />
              <span className="text-lg font-bold text-gray-900">NA-Leer</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
            {isBusiness && (
              <>
                <div className="pt-3 pb-1 px-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Business</p>
                </div>
                {businessNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-purple-50 text-purple-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col bg-white border-r border-gray-200">
          <div className="flex items-center gap-2 p-5 border-b">
            <FileText className="h-7 w-7 text-blue-600" />
            <span className="text-lg font-bold text-gray-900">NA-Leer</span>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
            {isBusiness && (
              <>
                <div className="pt-3 pb-1 px-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Business</p>
                </div>
                {businessNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-purple-50 text-purple-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </>
            )}
          </nav>
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-600">
                  {profile?.full_name?.charAt(0) || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.full_name || 'Chargement...'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {profile?.email || ''}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-600"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white px-4 sm:px-6 lg:px-8">
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">
              {profile?.company_name || profile?.email}
            </span>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
