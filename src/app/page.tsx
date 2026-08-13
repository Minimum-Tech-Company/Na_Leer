import Link from 'next/link'
import {
  FileText, CreditCard, Shield, Zap, CheckCircle, ArrowRight, Smartphone,
  Globe, BarChart3, Clock, Users, Send, Receipt, Lock, Star, ChevronRight,
  Building2, TrendingUp, Mail
} from 'lucide-react'
import { WaveLogo, OrangeMoneyLogo, FreeMoneyLogo, VisaLogo, MastercardLogo, WizallLogo } from '@/components/payment-logos'

const features = [
  {
    icon: FileText,
    title: 'Factures professionnelles',
    desc: 'Générez des factures PDF propres avec votre logo, vos mentions légales et votre NINEA en quelques clics.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: CreditCard,
    title: 'Paiements mobiles',
    desc: 'Acceptez Wave, Orange Money, Free Money et carte bancaire. Vos clients paient en un clic depuis leur téléphone.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: Smartphone,
    title: 'Paiement en un clic',
    desc: 'Envoyez le lien de paiement par SMS ou email. Vos clients payent sans créer de compte.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: BarChart3,
    title: 'Suivi en temps réel',
    desc: 'Tableau de bord complet avec revenus, factures payées, en attente et en retard. Tout est visualisé.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Clock,
    title: 'Relances automatiques',
    desc: 'Envoyez des rappels automatiques aux clients en retard de paiement. Plus besoin de relancer manuellement.',
    color: 'bg-yellow-50 text-yellow-600',
  },
  {
    icon: Shield,
    title: 'Sécurisé & conforme',
    desc: 'Données chiffrées, stockage sécurisé sur Supabase. Conforme aux normes bancaires ouest-africaines.',
    color: 'bg-red-50 text-red-600',
  },
]

const steps = [
  { num: '1', title: 'Créez votre compte', desc: 'Inscrivez votre entreprise avec votre NINEA et vos informations en 30 secondes.' },
  { num: '2', title: 'Ajoutez vos clients', desc: 'Enregistrez vos clients avec leurs coordonnées pour les retrouver en un clic.' },
  { num: '3', title: 'Créez vos factures', desc: 'Générez des factures PDF professionnelles avec vos articles et taxes.' },
  { num: '4', title: 'Envoyez & faites payer', desc: 'Envoyez par email ou partagez le lien de paiement. Le client paye sur Wave ou OM.' },
]

const paymentMethods = [
  { name: 'Wave', color: 'bg-blue-500', textColor: 'text-white' },
  { name: 'Orange Money', color: 'bg-orange-500', textColor: 'text-white' },
  { name: 'Free Money', color: 'bg-red-500', textColor: 'text-white' },
  { name: 'Visa / Mastercard', color: 'bg-gray-800', textColor: 'text-white' },
]

const testimonials = [
  { name: 'Amadou Diallo', role: 'Gérant, Diallo Import SARL', text: 'NA-Leer a transformé ma façon de gérer mes factures. Je gagne un temps fou et mes clients paient plus vite.' },
  { name: 'Fatou Sow', role: 'Directrice, Sow Consulting', text: 'Le paiement Wave directement sur la facture, c\'est révolutionnaire. Mes clients adorent la simplicité.' },
  { name: 'Moussa Ndiaye', role: 'CEO, Ndiaye Tech', text: 'Enfin un outil de facturation adapté au Sénégal. Le NINEA, les taxes, tout est pensé pour nous.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">NA-Leer</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Connexion
              </Link>
              <Link href="/register" className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-200">
                Commencer gratuitement
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap className="h-4 w-4" />
                Plateforme de facturation n°1 en Afrique de l&apos;Ouest
              </div>
              <h1 className="text-4xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                Facturez &amp; encaissez
                <span className="text-blue-600"> en quelques clics</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Créez des factures professionnelles, envoyez-les par email et acceptez les paiements
                Wave, Orange Money et carte bancaire. Tout est simple, rapide et adapté au Sénégal.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register" className="bg-blue-600 text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-blue-700 transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                  Créer mon compte gratuit
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="#how" className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-base font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all inline-flex items-center justify-center gap-2">
                  Voir comment ça marche
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Gratuit sans cb
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Setup en 30s
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Sans engagement
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 rounded-3xl blur-3xl opacity-40" />
              <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Facture FF-202508-0042</p>
                    <p className="text-xs text-gray-500">Client: Diallo Import SARL</p>
                  </div>
                  <span className="ml-auto bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">Payée</span>
                </div>
                <div className="space-y-3 mb-6">
                  {[
                    { desc: 'Service de conseil', qty: '10h', price: '25 000' },
                    { desc: 'Développement site web', qty: '1', price: '350 000' },
                    { desc: 'Hébergement annuel', qty: '1', price: '60 000' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.desc}</span>
                      <span className="font-medium">{item.price} XOF</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 flex justify-between">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-lg text-blue-600">435 000 XOF</span>
                </div>
                <div className="mt-6 flex gap-1 items-center flex-wrap">
                  <WaveLogo className="h-6" />
                  <OrangeMoneyLogo className="h-6" />
                  <VisaLogo className="h-6" />
                  <MastercardLogo className="h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Payment methods banner */}
      <section className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Moyens de paiement acceptés</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-1">
            <WaveLogo className="h-10" />
            <OrangeMoneyLogo className="h-10" />
            <FreeMoneyLogo className="h-10" />
            <VisaLogo className="h-10" />
            <MastercardLogo className="h-10" />
            <WizallLogo className="h-10" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Fonctionnalités</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-3 mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Un outil de facturation complet, pensé pour les PME africaines</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="group p-8 rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-lg transition-all duration-300">
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Processus</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-3 mb-4">Comment ça marche</h2>
            <p className="text-lg text-gray-600">4 étapes pour commencer à facturer</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 text-white font-bold text-xl shadow-lg shadow-blue-200">
                  {s.num}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Tableau de bord</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-3 mb-6">
                Suivez vos revenus<br />en temps réel
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Un dashboard complet avec vos KPI, graphiques de revenus, répartition des factures
                et liste des paiements récents. Vous savez toujours où en est votre business.
              </p>
              <ul className="space-y-4">
                {[
                  'Revenus totaux et par période',
                  'Factures payées, en attente, en retard',
                  'Comparaison mois en cours vs précédent',
                  'Liste des paiements avec méthode et statut',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl blur-3xl opacity-30" />
              <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900">Dashboard</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { label: 'Revenus', value: '2 450 000', color: 'text-green-600', icon: TrendingUp },
                    { label: 'Factures', value: '24', color: 'text-blue-600', icon: Receipt },
                    { label: 'En attente', value: '580 000', color: 'text-yellow-600', icon: Clock },
                    { label: 'Clients', value: '18', color: 'text-purple-600', icon: Users },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">{stat.label}</span>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                      <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 mb-3">Revenus ce mois</p>
                  <div className="flex items-end gap-2 h-20">
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <div key={i} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-400">
                    <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Tarifs</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-3 mb-4">Simples et transparents</h2>
            <p className="text-lg text-gray-600">Commencez gratuitement, évoluez quand vous êtes prêt</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-5">
                <Zap className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Gratuit</h3>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">0</span>
                <span className="text-gray-500 ml-1">FCFA/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['3 factures/mois', '5 clients', 'Export PDF', '1 utilisateur'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center bg-gray-100 text-gray-900 px-4 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                Commencer
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-blue-600 relative scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                ⭐ Populaire
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-5">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">15 000</span>
                <span className="text-gray-500 ml-1">FCFA/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Factures illimitées', 'Clients illimités', 'Paiements Wave / OM / Visa', 'Relances automatiques', 'Support prioritaire'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center bg-blue-600 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                Choisir Pro
              </Link>
            </div>

            {/* Business */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-5">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Business</h3>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">35 000</span>
                <span className="text-gray-500 ml-1">FCFA/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Tout dans Pro', 'Multi-utilisateurs', 'API & intégrations', 'Support dédié', 'Personnalisation avancée'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center bg-gray-100 text-gray-900 px-4 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                Contacter-nous
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Témoignages</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-3 mb-4">Ils nous font confiance</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">&quot;{t.text}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">{t.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Prêt à simplifier votre facturation ?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Rejoignez des centaines d&apos;entreprises sénégalaises qui facturent avec NA-Leer.
            Commencez gratuitement, sans engagement.
          </p>
          <Link href="/register" className="bg-white text-blue-600 px-10 py-4 rounded-xl text-base font-bold hover:bg-blue-50 transition-all inline-flex items-center gap-2 shadow-lg">
            Créer mon compte gratuit
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">NA-Leer</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                La plateforme de facturation pour PME africaines. Simple, rapide, sécurisée.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="#how" className="hover:text-white transition-colors">Comment ça marche</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Tarifs</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Fonctionnalités</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><span>Support: support@na-leer.com</span></li>
                <li><span>Dakar, Sénégal</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><span>Politique de confidentialité</span></li>
                <li><span>Conditions d&apos;utilisation</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} NA-Leer. Tous droits réservés. Fait avec ❤️ au Sénégal
          </div>
        </div>
      </footer>
    </div>
  )
}
