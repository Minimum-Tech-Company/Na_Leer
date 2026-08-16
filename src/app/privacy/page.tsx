import Link from 'next/link'
import { FileText } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">NA-Leer</span>
          </Link>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Politique de confidentialité</h1>
        <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : 16 août 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              La présente Politique de confidentialité décrit comment Minimum Tech Company (« nous », « notre » ou « NA-Leer »)
              collecte, utilise, protège et partage les informations personnelles des utilisateurs de la plateforme NA-Leer
              (le « Service »), accessible à l&apos;adresse https://na-leer.org.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              En utilisant NA-Leer, vous acceptez les pratiques décrites dans cette politique. Si vous n&apos;acceptez pas
              ces conditions, veuillez ne pas utiliser le Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Données collectées</h2>
            <p className="text-gray-600 leading-relaxed mb-3">Nous collectons les types de données suivants :</p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Données d&apos;identification</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Numéro de téléphone</li>
              </ul>
              <h3 className="font-semibold text-gray-900 mb-2">Données de l&apos;entreprise</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
                <li>Raison sociale / Nom de l&apos;entreprise</li>
                <li>NINEA et RCCM</li>
                <li>Forme juridique</li>
                <li>Adresse du siège et ville</li>
                <li>Logo de l&apos;entreprise</li>
              </ul>
              <h3 className="font-semibold text-gray-900 mb-2">Données d&apos;activité</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Factures créées (numéros, montants, statuts)</li>
                <li>Informations des clients du compte</li>
                <li>Historique des paiements</li>
                <li>Données d&apos;abonnement</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Utilisation des données</h2>
            <p className="text-gray-600 leading-relaxed mb-3">Vos données sont utilisées pour :</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Fournir et maintenir le Service (création de factures, gestion des clients, paiements)</li>
              <li>Traiter les transactions de paiement via nos prestataires (FedaPay, DexPay)</li>
              <li>Envoyer des emails transactionnels (confirmation, factures, relances d&apos;abonnement)</li>
              <li>Améliorer l&apos;expérience utilisateur et développer de nouvelles fonctionnalités</li>
              <li>Assurer la sécurité du Service et prévenir la fraude</li>
              <li>Communications relatives au Service (mises à jour, maintenances)</li>
              <li>Respecter nos obligations légales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Partage des données</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Nous ne vendons jamais vos données personnelles. Nous pouvons les partager uniquement avec :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Prestataires de paiement</strong> — FedaPay et DexPay pour le traitement sécurisé des paiements Wave, Orange Money, Free Money et carte bancaire</li>
              <li><strong>Hébergeur</strong> — Supabase (infrastructure base de données) et Vercel (hébergement de l&apos;application)</li>
              <li><strong>Service d&apos;email</strong> — Resend pour l&apos;envoi des emails transactionnels</li>
              <li><strong>Autorités compétentes</strong> — En cas d&apos;obligation légale ou de réquisition judiciaire</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Sécurité des données</h2>
            <p className="text-gray-600 leading-relaxed">
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mt-3">
              <li>Chiffrement des données sensibles (clés API) via AES-256-GCM</li>
              <li>Connexions sécurisées (HTTPS / TLS)</li>
              <li>Authentification sécurisée via Supabase Auth</li>
              <li>Politiques de sécurité au niveau des lignes (RLS) sur la base de données</li>
              <li>Journalisation sécurisée des erreurs sans données sensibles</li>
              <li>Cookies d&apos;authentification httpOnly</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Conservation des données</h2>
            <p className="text-gray-600 leading-relaxed">
              Vos données sont conservées tant que votre compte est actif. Après la suppression de votre compte,
              nous conservons les données pendant une durée maximale de 30 jours pour permettre la récupération,
              puis elles sont définitivement supprimées de nos serveurs. Les données anonymisées peuvent être
              conservées à des fins statistiques.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Vos droits</h2>
            <p className="text-gray-600 leading-relaxed mb-3">Conformément à la législation en vigueur, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Droit d&apos;accès</strong> — Consulter les données personnelles que nous détenons à votre sujet</li>
              <li><strong>Droit de rectification</strong> — Corriger les données inexactes ou incomplètes</li>
              <li><strong>Droit de suppression</strong> — Demander la suppression de vos données personnelles</li>
              <li><strong>Droit à la portabilité</strong> — Exporter vos données dans un format structuré</li>
              <li><strong>Droit d&apos;opposition</strong> — Vous opposer au traitement de vos données à des fins de prospection</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Pour exercer ces droits, contactez-nous à l&apos;adresse : <strong>privacy@na-leer.org</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              NA-Leer utilise uniquement des cookies strictement nécessaires au fonctionnement du Service
              (cookie d&apos;authentification httpOnly). Aucun cookie publicitaire ou de tracking n&apos;est utilisé.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Modifications</h2>
            <p className="text-gray-600 leading-relaxed">
              Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment.
              Les modifications prennent effet dès leur publication sur cette page. Nous vous informerons
              de tout changement important par email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              Pour toute question relative à cette politique de confidentialité, contactez-nous :
            </p>
            <div className="bg-gray-100 rounded-xl p-5 mt-3">
              <p className="text-gray-700 font-medium">Minimum Tech Company</p>
              <p className="text-gray-600 text-sm mt-1">Email : privacy@na-leer.org</p>
              <p className="text-gray-600 text-sm">Site web : https://na-leer.org</p>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-400">
        by Minimum Tech Company
      </footer>
    </div>
  )
}
