/* eslint-disable react/no-unescaped-entities */
// app/checkout/success/page.tsx
// Page de confirmation de paiement — Server Component
// Affichee apres un paiement reussi sur Stripe

// Importer le singleton Stripe pour verifier la session de paiement
import { stripe } from '@/lib/stripe';
// redirect : fonction Next.js pour rediriger si la session est invalide
import { redirect } from 'next/navigation';
// Link : composant Next.js pour la navigation interne (prechargement automatique)
import Link from 'next/link';
// Importer le type Stripe pour typer la session (import de type uniquement)
import type Stripe from 'stripe';

// Type des props de la page — searchParams est une Promise dans Next.js 15+
type SuccessPageProps = {
  searchParams: Promise<{
    session_id?: string; // Parametre URL optionnel envoye par Stripe
  }>;
};

// Fonction async du Server Component — recoit les searchParams de l'URL
export default async function SuccessPage({
  searchParams,
}: SuccessPageProps) {
  // Attendre et extraire session_id depuis les parametres URL
  // Exemple d'URL : /checkout/success?session_id=cs_test_abc123
  const { session_id } = await searchParams;

  // Securite : si pas de session_id dans l'URL, rediriger vers le panier
  // Cela empeche l'acces direct a /checkout/success sans paiement
  if (!session_id) {
    redirect('/cart');
  }

  // Declarer la variable session avec le type Stripe approprie
  let session: Stripe.Checkout.Session;

  try {
    // Recuperer les details de la session Stripe depuis l'API
    // On ne fait PAS confiance a l'URL — on verifie directement avec Stripe
    session = await stripe.checkout.sessions.retrieve(session_id, {
      // expand : demander a Stripe d'inclure les details des articles et produits
      expand: ['line_items', 'line_items.data.price.product'],
    });
  } catch (error) {
    // Si la session n'existe pas ou est invalide, loguer l'erreur
    console.error('Erreur recuperation session Stripe :', error);
    // Rediriger vers le panier en cas d'erreur
    redirect('/cart');
  }

  // Verification critique : le paiement est-il reellement paye ?
  // Un utilisateur malveillant pourrait forger une URL avec un faux session_id
  if (session.payment_status !== 'paid') {
    redirect('/cart');
  }

  // Convertir le montant total de cents vers dollars (Stripe stocke en cents)
  // ?? 0 : si amount_total est null, utiliser 0 par defaut
  const total = (session.amount_total ?? 0) / 100;

  return (
    <main className="mx-auto max-w-2xl p-8">
      {/* Banniere de confirmation avec bordure verte */}
      <section className="mb-6 rounded-lg border-2 border-green-500 bg-green-50 p-6">
        <h1 className="mb-2 text-3xl font-bold text-green-800">
          Paiement confirme
        </h1>

        {/* Afficher le montant paye, formate avec 2 decimales */}
        <p className="text-green-700">
          Votre paiement de{' '}
          <strong>{total.toFixed(2)} $ CAD</strong> a ete confirme.
        </p>
      </section>

      {/* Section details de la commande */}
      <section className="mb-6 rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Details de la commande
        </h2>

        {/* Liste de definitions (dl/dt/dd) pour afficher les infos cle-valeur */}
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-600">Session Stripe :</dt>
            {/* Afficher l'ID de session Stripe (utile pour le support) */}
            <dd className="break-all font-mono">{session.id}</dd>
          </div>

          <div className="flex justify-between gap-4">
            <dt className="text-gray-600">Email :</dt>
            {/* ?. : chainage optionnel — evite une erreur si customer_details est null */}
            {/* ?? : operateur nullish — affiche 'Non disponible' si email est null */}
            <dd>{session.customer_details?.email ?? 'Non disponible'}</dd>
          </div>

          <div className="flex justify-between gap-4">
            <dt className="text-gray-600">Panier :</dt>
            {/* Recuperer le cartId depuis les metadata qu'on a envoyées à Stripe */}
            <dd className="font-mono">{session.metadata?.cartId ?? '—'}</dd>
          </div>
        </dl>
      </section>

      {/* Lien de retour à l'accueil — utilise le composant Link de Next.js */}
      <Link
        href="/"
        className="inline-block rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
      >
        Retour à l'accueil
      </Link>
    </main>
  );
}