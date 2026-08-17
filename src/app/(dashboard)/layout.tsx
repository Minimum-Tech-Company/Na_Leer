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
  Shield,
  History,
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
  { name: 'Journal d\'activité', href: '/activity', icon: History },
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
        .select('plan:plans(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setIsBusiness((sub?.plan as any)?.id === 'business')
    }

    getProfile()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const NavLink = ({ item, onClick }: { item: { name: string; href: string; icon: any }; onClick?: () => void }) => {
    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
    return (
      <Link
        href={item.href}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-100'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
        onClick={onClick}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          isActive ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-gray-200'
        }`}>
          <item.icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
        </div>
        {item.name}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className={`fixed inset-y-0 left-0 w-72 bg-white shadow-2xl transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">NA-Leer</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <nav className="p-4 space-y-1">
            {navigation.map((item) => (
              <NavLink key={item.name} item={item} onClick={() => setSidebarOpen(false)} />
            ))}
            {isBusiness && (
              <>
                <div className="pt-4 pb-2 px-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Business</p>
                </div>
                {businessNavigation.map((item) => (
                  <NavLink key={item.name} item={item} onClick={() => setSidebarOpen(false)} />
                ))}
              </>
            )}
            {profile?.is_admin && (
              <>
                <div className="pt-4 pb-2 px-3">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Admin</p>
                </div>
                <Link
                  href="/admin/login"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-red-500" />
                  </div>
                  Admin Panel
                </Link>
              </>
            )}
          </nav>
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-3 p-2 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-sm font-bold text-white">
                  {profile?.full_name?.charAt(0) || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {profile?.full_name || 'Chargement...'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {profile?.email || ''}
                </p>
              </div>
            </div>
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col bg-white border-r border-gray-200/80">
          {/* Logo */}
          <div className="flex items-center gap-2.5 p-5 border-b border-gray-100">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">NA-Leer</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
            {isBusiness && (
              <>
                <div className="pt-4 pb-2 px-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Business</p>
                </div>
                {businessNavigation.map((item) => (
                  <NavLink key={item.name} item={item} />
                ))}
              </>
            )}
            {profile?.is_admin && (
              <>
                <div className="pt-4 pb-2 px-3">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Admin</p>
                </div>
                <Link
                  href="/admin/login"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-red-500" />
                  </div>
                  Admin Panel
                </Link>
              </>
            )}
          </nav>

          {/* User profile */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-sm font-bold text-white">
                  {profile?.full_name?.charAt(0) || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {profile?.full_name || 'Chargement...'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {profile?.email || ''}
                </p>
              </div>
            </div>
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-gray-200/80 bg-white/80 backdrop-blur-lg px-4 sm:px-6 lg:px-8">
          <button
            className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block font-medium">
              {profile?.company_name || profile?.email}
            </span>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center lg:hidden">
              <span className="text-xs font-bold text-white">
                {profile?.full_name?.charAt(0) || '?'}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
          {children}
        </main>

        <footer className="border-t border-gray-200/80 bg-white px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400 font-medium">
          <span>by Minimum Tech Company</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Politique de confidentialité</Link>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Conditions d&apos;utilisation</Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
