// app/actions/checkout.ts
// Ce fichier contient la Server Action pour creer une session de paiement Stripe

// ’use server’ : directive obligatoire pour indiquer que ce code s’execute UNIQUEMENT cote serveur
// Cela protege la cle secrete Stripe qui ne doit jamais etre envoyee au navigateur 
'use server';

// redirect : fonction Next.js pour rediriger l’utilisateur vers une autre page
import { redirect } from 'next/navigation';
// stripe : notre singleton Stripe configure dans lib/stripe.ts
import { stripe } from '@/lib/stripe';
// prisma : notre singleton Prisma pour acceder a la base de donnees
import prisma from '@/lib/prisma';
// zod : bibliotheque de validation de schema
import { z } from 'zod';

// Schema Zod pour valider l’entree de la fonction
// On s’assure que cartId est une chaine non vide
const createCheckoutSessionSchema = z.object({
cartId: z.string().min(1, 'cartId est obligatoire'),
});
 
// Inferer automatiquement le type TypeScript a partir du schema Zod
type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;

// Fonction asynchrone exportee — c’est la Server Action appelee depuis le
// client
// Elle retourne void car elle termine par une redirection
export async function createCheckoutSession(
input: CreateCheckoutSessionInput
): Promise<void> {
  // Validation Zod : verifier que l’entree respecte le schema
  const parsed = createCheckoutSessionSchema.safeParse(input);

  if (!parsed.success) {
    // Si la validation echoue, on lance une erreur avec le premier message de Zod
    throw new Error(parsed.error.issues[0].message);
  }

// Destructurer l’objet valide pour extraire cartId
  const { cartId } = parsed.data;

  // Identifiant utilisateur en dur pour le demo (sera remplace par l’auth plus tard)
  const userId = 'demo-user-id';

  // Recuperer le panier depuis la base de donnees avec Prisma
  // findUnique : cherche un enregistrement unique par son id
  const cart = await prisma.cart.findUnique({
    where: {
      id: cartId, // Chercher le panier correspondant a cartId
    },
    // include : charger aussi les relations (jointures) necessaires
    include: {
      items: { // Charger les articles du panier
        include: {
          product: true, // Pour chaque article, charger aussi le produit
        },
      },
    },
  });


// Verification : le panier existe-t-il en base de donnees ?
if (!cart) {
  throw new Error('Panier introuvable');
}

// Verification : le panier contient-il au moins un article ?
if (cart.items.length === 0) {
  throw new Error('Votre panier est vide');
}

// Transformer les articles du panier au format attendu par Stripe (line_items)
// Stripe ne comprend pas notre modele Prisma, il faut convertir
const lineItems = cart.items.map((item) => {
  // Convertir le prix en cents (Stripe exige la plus petite unite monetaire)
  // Number() : convertit le Decimal Prisma en number JavaScript
  // Math.round() : evite les imprecisions des nombres decimaux (ex: 19.99 * 100 = 1998.999...)
const priceInCents = Math.round(Number(item.product.price) * 100);

  // Verification : le prix doit etre un entier positif pour Stripe
if (priceInCents <= 0) {
    throw new Error(`Prix invalide pour le produit : ${item.product.name}`);
  }

return {
    price_data: {
      currency: 'cad', // Devise : dollar canadien
      product_data: {
        name: item.product.name,// Nom du produit affiche sur la page Stripe
        description: item.product.description ?? undefined, // Description optionnelle (?? undefined si null)
      },
      unit_amount: priceInCents, // Prix unitaire en cents
    },
    quantity: item.quantity,// Quantite commandee
  };
});

  // Recuperer l’URL de base de l’application pour les redirections
const appUrl = process.env.APP_URL;

 // Verification : APP_URL doit etre definie pour construire les URLs de redirection
if (!appUrl) {
  throw new Error('APP_URL est manquante dans .env.local');
}

 // Creer la session Stripe Checkout via l’API Stripe
const checkoutSession = await stripe.checkout.sessions.create({
  mode: 'payment', // Mode paiement unique (pas abonnement)
  line_items: lineItems, // Les articles a payer
// URL de redirection apres paiement reussi {CHECKOUT_SESSION_ID} est un placeholder remplace automatiquement par Stripe
success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
// URL de redirection si l’utilisateur annule le paiement
cancel_url: `${appUrl}/checkout/cancel`,
// Metadata : donnees personnalisees attachees a la session Stripe
// Tres utiles pour retrouver la commande dans notre BDD via les webhooks
metadata: {
cartId: cart.id, // Identifiant du panier
  userId, // Identifiant de l’utilisateur
},
locale: 'fr', // Afficher la page Stripe Checkout en francais
});
// Verification : Stripe doit retourner une URL de paiement
if (!checkoutSession.url) {
  throw new Error("Stripe n'a pas retourne d'URL de paiement");
}

// Rediriger l’utilisateur vers la page de paiement Stripe
// redirect() lance une exception interne controlee par Next.js (pas besoin de return)
redirect(checkoutSession.url);
}
