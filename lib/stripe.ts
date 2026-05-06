// lib/stripe.ts
// Ce fichier cree un singleton Stripe reutilisable dans tout le projet



// Importer le SDK Stripe officiel
// lib/stripe.ts
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY manquante');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-04-22.dahlia",
});
