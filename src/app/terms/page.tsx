import Link from 'next/link'
import { FileText } from 'lucide-react'

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Conditions d&apos;utilisation</h1>
        <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : 16 août 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Objet</h2>
            <p className="text-gray-600 leading-relaxed">
              Les présentes Conditions d&apos;utilisation (les « Conditions ») régissent l&apos;utilisation de la plateforme
              NA-Leer (le « Service »), accessible à l&apos;adresse https://na-leer.org, éditée par Minimum Tech Company
              (« l&apos;éditeur », « nous »).
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Le Service propose une solution de facturation en ligne destinée aux petites et moyennes entreprises
              en Afrique de l&apos;Ouest, incluant la création de factures, la gestion de clients, les paiements en ligne
              et le suivi des revenus.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              En créant un compte ou en utilisant NA-Leer, vous acceptez sans réserve les présentes Conditions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Inscription et compte</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>L&apos;inscription est réservée aux personnes physiques ou morales ayant la capacité juridique de contracter</li>
              <li>Vous devez fournir des informations exactes et complètes lors de l&apos;inscription</li>
              <li>Vous êtes responsable de la confidentialité de vos identifiants de connexion</li>
              <li>Vous vous engagez à notifier immédiatement tout usage non autorisé de votre compte</li>
              <li>Un seul compte par entreprise. La création de comptes multiples est interdite</li>
              <li>Na-leer se réserve le droit de suspendre ou supprimer tout compte en cas de manquement aux présentes Conditions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Description du service</h2>
            <p className="text-gray-600 leading-relaxed mb-3">Le Service comprend notamment :</p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Création et envoi de factures</strong> — Génération de factures PDF professionnelles avec logo, NINEA et mentions légales</li>
                <li><strong>Gestion de clients</strong> — Base de données des clients avec coordonnées</li>
                <li><strong>Paiements en ligne</strong> — Acceptation des paiements Wave, Orange Money, Free Money et carte bancaire via FedaPay et DexPay</li>
                <li><strong>Tableau de bord</strong> — Suivi des revenus, statut des factures et analytics</li>
        <li><strong>Relances automatiques</strong> — Notifications par email pour les factures impayées et les abonnements expirés</li>
                <li><strong>Abonnements</strong> — Plans Free, Pro et Business avec fonctionnalités progressives</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Obligations de l&apos;utilisateur</h2>
            <p className="text-gray-600 leading-relaxed mb-3">En utilisant NA-Leer, vous vous engagez à :</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Utiliser le Service conformément à la législation en vigueur au Sénégal et en Afrique de l&apos;Ouest</li>
              <li>Émettre des factures conformes aux réglementations fiscales en vigueur</li>
              <li>Ne pas utiliser le Service à des fins illégales, frauduleuses ou abusive</li>
              <li>Ne pas tenter de compromettre la sécurité ou l&apos;intégrité du Service</li>
              <li>Ne pas reproduire, copier ou revendre le Service ou une partie de celui-ci</li>
              <li>Maintenir vos informations de facturation à jour (NINEA, RCCM, coordonnées)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Tarification et paiements</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Plan Free</strong> — Gratuit, 5 factures/mois, 5 clients</li>
              <li><strong>Plan Pro</strong> — 15 000 FCFA/mois, factures et clients illimités, paiements en ligne</li>
              <li><strong>Plan Business</strong> — 35 000 FCFA/mois, multi-utilisateurs, accès API, support prioritaire</li>
              <li>Les paiements sont traités de manière sécurisée par nos prestataires partenaires (FedaPay, DexPay)</li>
              <li>Les abonnements sont mensuels et renouvelables automatiquement</li>
              <li>Vous pouvez annuler votre abonnement à tout moment depuis vos paramètres</li>
              <li>En cas d&apos;annulation, vous conservez l&apos;accès jusqu&apos;à la fin de la période en cours</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Propriété intellectuelle</h2>
            <p className="text-gray-600 leading-relaxed">
              L&apos;ensemble du contenu du Service (code, design, logo, textes, images) est la propriété exclusive de
              Minimum Tech Company ou de ses concédants et est protégé par les lois relatives à la propriété
              intellectuelle. Toute reproduction, modification ou exploitation non autorisée est interdite.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Les contenus que vous créez via le Service (factures, données clients) vous appartiennent.
              Vous conservez tous vos droits sur vos données.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Responsabilité</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>NA-Leer est fourni « en l&apos;état ». Nous ne garantissons pas l&apos;absence d&apos;interruption ou d&apos;erreur</li>
              <li>Nous ne sommes pas responsables des pertes financières résultant de l&apos;utilisation du Service</li>
              <li>La responsabilité de Minimum Tech Company ne peut excéder le montant payé par l&apos;utilisateur au cours des 12 derniers mois</li>
              <li>Nous ne sommes pas responsables des opérations de paiement traitées par les prestataires tiers (FedaPay, DexPay)</li>
              <li>Vous êtes seul responsable de la conformité fiscale de vos factures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Disponibilité du service</h2>
            <p className="text-gray-600 leading-relaxed">
              Nous nous efforçons d&apos;assurer une disponibilité maximale du Service, mais nous ne garantissons
              pas une disponibilité de 100%. Des opérations de maintenance peuvent avoir lieu sans préavis.
              Nous mettrons en œuvre tous les moyens raisonnables pour limiter les interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Résiliation</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Vous pouvez supprimer votre compte à tout moment depuis vos paramètres</li>
              <li>Nous nous réservons le droit de suspendre ou résilier votre compte en cas de violation des présentes Conditions</li>
              <li>En cas de résiliation, vos données seront supprimées dans un délai de 30 jours</li>
              <li>Les obligations de confidentialité et de responsabilité survivent à la résiliation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Droit applicable et juridiction</h2>
            <p className="text-gray-600 leading-relaxed">
              Les présentes Conditions sont régies par le droit de la République du Sénégal.
              En cas de litige, les parties s&apos;engagent à rechercher une solution amiable avant toute
              action judiciaire. À défaut, le litige sera porté devant les tribunaux compétents de Dakar, Sénégal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Modifications</h2>
            <p className="text-gray-600 leading-relaxed">
              Minimum Tech Company se réserve le droit de modifier ces Conditions à tout moment.
              Les modifications prennent effet dès leur publication. Nous vous informerons des
              changements importants par email ou via le Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">12. Contact</h2>
            <div className="bg-gray-100 rounded-xl p-5">
              <p className="text-gray-700 font-medium">Minimum Tech Company</p>
              <p className="text-gray-600 text-sm mt-1">Email : legal@na-leer.org</p>
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
