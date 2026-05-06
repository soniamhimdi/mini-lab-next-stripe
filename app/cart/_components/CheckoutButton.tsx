// app/cart/_components/CheckoutButton.tsx
// Ce composant affiche un bouton de paiement qui appelle la Server Action Stripe

// 'use client' : obligatoire car ce composant utilise des hooks React (useTransition)
// Les hooks ne fonctionnent que cote client (navigateur)
'use client';

// useTransition : hook React pour gerer un etat de chargement pendant une action asynchrone
import { useTransition } from 'react';
// Importer notre Server Action qui cree la session Stripe
import { createCheckoutSession } from '@/app/actions/checkout';

// Definition des props (proprietes) acceptees par ce composant
type CheckoutButtonProps = {
  cartId: string;       // L'identifiant du panier a payer (obligatoire)
  disabled?: boolean;   // Permet de desactiver le bouton depuis le parent (optionnel)
};

// Composant fonctionnel React exporte
// On destructure les props avec une valeur par defaut pour disabled (false)
export function CheckoutButton({
  cartId,
  disabled = false,
}: CheckoutButtonProps) {
  // useTransition retourne :
  // - isPending : booleen qui vaut true pendant l'execution de l'action
  // - startTransition : fonction pour envelopper une action asynchrone
  const [isPending, startTransition] = useTransition();

  // Fonction appelee quand l'utilisateur clique sur le bouton
  function handleClick() {
    // startTransition enveloppe l'action async pour que React gere le loading
    startTransition(async () => {
      try {
        // Appeler la Server Action avec l'identifiant du panier
        // Si tout va bien, l'utilisateur est redirige vers Stripe
        await createCheckoutSession({ cartId });
      } catch (error) {
        // En cas d'erreur, on l'affiche dans la console pour le debogage
        console.error(error);

        // Verifier si l'erreur est une instance d'Error pour acceder a .message
        if (error instanceof Error) {
          alert(error.message); // Afficher le message d'erreur clair
        } else {
          // Erreur inconnue : afficher un message generique
          alert('Une erreur inconnue est survenue pendant le paiement.');
        }
      }
    });
  }

  // Rendu JSX du bouton
  return (
    <>
      {/* type="button" pour eviter un submit de formulaire accidentel */}
      {/* Gestionnaire de clic */}
      {/* Desactive si prop disabled OU si action en cours */}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isPending}
        className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {/* Texte dynamique : change pendant le chargement */}
        {isPending ? 'Redirection vers Stripe...' : 'Payer avec Stripe'}
      </button>
    </>
  );
}