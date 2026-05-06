// prisma/seed.ts
// Script de peuplement de la base de données
// Exécuter avec : npx prisma db seed

import prisma from '@/lib/prisma';



async function main() {
  console.log("Nettoyage des données existantes...");
  // Supprimer dans l'ordre pour respecter les contraintes de clés étrangères
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();

  console.log("Création des produits...");
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "T-shirt Next.js",
        description: "T-shirt 100% coton avec le logo Next.js",
        price: 29.99,
      },
    }),
    prisma.product.create({
      data: {
        name: "Mug Prisma",
        description: "Mug en céramique avec le logo Prisma",
        price: 14.99,
      },
    }),
    prisma.product.create({
      data: {
        name: "Sticker Pack",
        description: "Pack de 10 stickers développeur",
        price: 9.99,
      },
    }),
    prisma.product.create({
      data: {
        name: "Casquette TypeScript",
        description: "Casquette brodée TypeScript",
        price: 24.99,
      },
    }),
  ]);

  console.log(`${products.length} produits créés.`);

  console.log("Création du panier demo...");
  const cart = await prisma.cart.create({
    data: {
      userId: "demo-user-id",
      items: {
        create: [
          {
            quantity: 2,
            productId: products[0].id, // T-shirt Next.js
          },
          {
            quantity: 1,
            productId: products[1].id, // Mug Prisma
          },
        ],
      },
    },
  });

  console.log(`Panier créé (id: ${cart.id}) avec 2 articles.`);
  console.log("Seed terminé.");
}

main()
  .catch((error) => {
    console.error("Erreur lors du seed :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
