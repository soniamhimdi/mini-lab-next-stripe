// app/cart/page.tsx
// Page du panier — Server Component (pas de 'use client')
// Les Server Components peuvent acceder directement a la base de donnees

// Importer le composant bouton de paiement (Client Component)
import { CheckoutButton } from './_components/CheckoutButton';
// Importer le singleton Prisma pour acceder a la BDD
import prisma from '@/lib/prisma';

// Fonction async (possible car Server Component) — Next.js l'appelle cote serveur
export default async function CartPage() {
  // Recuperer le premier panier de l'utilisateur demo depuis la BDD
  // findFirst : retourne le premier enregistrement correspondant (ou null)
  const cart = await prisma.cart.findFirst({
    where: {
      userId: 'demo-user-id', // Utilisateur en dur pour le demo
    },
    // Charger les relations necessaires (articles + produits)
    include: {
      items: {               // Inclure les articles du panier
        include: {
          product: true,     // Pour chaque article, inclure le produit
        },
      },
    },
  });

  // Si le panier n'existe pas OU est vide, afficher un message
  if (!cart || cart.items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="mb-4 text-3xl font-bold">Votre panier</h1>
        <p className="text-gray-600">Votre panier est vide.</p>
      </main>
    );
  }

  // Calculer le total du panier
  // reduce : parcourt tous les articles et accumule le prix total
  // Number() : convertit le Decimal Prisma en number JavaScript
  const total = cart.items.reduce((sum, item) => {
    return sum + Number(item.product.price) * item.quantity;
  }, 0); // 0 = valeur initiale de l'accumulateur

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-3xl font-bold">Votre panier</h1>

      {/* Section listant tous les articles du panier */}
      <section className="mb-6 space-y-4">
        {/* Boucle sur chaque article du panier avec .map() */}
        {/* key unique obligatoire pour les listes React */}
        {cart.items.map((item) => (
          <article
            key={item.id}  
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div>
              {/* Nom du produit */}
              <h2 className="font-semibold">{item.product.name}</h2>
              {/* Quantite commandee */}
              <p className="text-sm text-gray-600">
                Quantite : {item.quantity}
              </p>
            </div>

            {/* Sous-total pour cet article (prix × quantite) */}
            <p className="font-semibold">
              {(Number(item.product.price) * item.quantity).toFixed(2)} $ CAD
            </p>
          </article>
        ))}
      </section>

      {/* Ligne de total avec separateur */}
      <div className="mb-6 flex justify-between border-t pt-4 text-xl font-bold">
        <span>Total</span>
        {/* toFixed(2) : afficher toujours 2 decimales (ex: 19.90 au lieu de 19.9) */}
        <span>{total.toFixed(2)} $ CAD</span>
      </div>

      {/* Bouton de paiement — composant client avec cartId et etat disabled */}
      <CheckoutButton cartId={cart.id} disabled={cart.items.length === 0} />
    </main>
  );
}