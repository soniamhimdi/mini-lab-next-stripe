// app/checkout/cancel/page.tsx
// Page d'annulation — affichee quand l'utilisateur annule le paiement sur Stripe
// C'est un Server Component simple (pas de logique async ni de hooks)

// Link : composant Next.js pour la navigation optimisee (prechargement)
import Link from 'next/link';

// Composant de page — pas async car aucune donnee a charger
export default function CancelPage() {
  return (
    // Conteneur principal centre horizontalement avec texte centre
    <main className="mx-auto max-w-2xl p-8 text-center">
      {/* Titre en orange pour signaler l'annulation (pas une erreur) */}
      <h1 className="mb-4 text-3xl font-bold text-orange-600">
        Paiement annulé
      </h1>

      {/* Message rassurant : le panier n'est pas perdu */}
      <p className="mb-6 text-gray-600">
        Votre paiement a été annulé. Votre panier est toujours disponible.
      </p>

      {/* Bouton-lien pour retourner au panier et réessayer */}
      <Link
        href="/cart"
        className="inline-block rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
      >
        Retour au panier
      </Link>
    </main>
  );
}