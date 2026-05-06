import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
//import { orderCreateSchema } from "@/schemas/order";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request){
    let raw: unknown

    try{
        raw = await req.json()
    }catch{
        return NextResponse.json({ok : false, error: "JSON Invalide"}, {status:400})
    }


    const parsed = orderCreateSchema.safeParse(raw)
    if(!parsed.success){
        return NextResponse.json(
            {ok: false, error: "Validation echouee", details: parsed.error.flatten().fieldErrors},
            {status:422}
        )
    }

    const { productId, quantity } = parsed.data

    // (a) trouve le produit qu'on veut acheter
    const product = await prisma.product.findUnique({ where: {id: productId} })
    if(!product){
        return NextResponse.json({ok: false, error:"Produit pas trouve"},{status:404}) // ROLLBACK
    }

    // (b) verification de la quantite 
    if(product.inStock < quantity){
        return NextResponse.json(
                {ok: false, error:"Stock insuffisant !"},
                {status:409} // 409 : Etat de la ressource qui ne permet pas de continuer la transaction
            )
    }

    const total = product.price * quantity
    const order = await prisma.order.create({
        data:{productId, quantity, total, status:"pending"},
    })

    const intent = await stripe.paymentIntents.create({
        amount: total,
        currency: "cad",
        automatic_payment_methods : {enabled: true}, // Confirmation
        metadata: {orderId : order.id}
    })

    //await stripe.paymentIntents.capture() // Capture

    await prisma.order.update({
        where: {id: order.id},
        data: {stripePaymentIntentId : intent.id}
    })

    return NextResponse.json(
        {ok: true, data: { orderId: order.id , clientSecret : intent.client_secret }}, {status:201}
    )

    /*
    try{
        const Myorder = await prisma.$transaction(async(tx) => {
            // (a) trouve le produit qu'on veut acheter
            const product = await tx.product.findUnique({ where: {id: productId} })
            if(!product){
                throw new Error("Produit pas trouve") // ROLLBACK
            }

            // (b) verification de la quantite 
            if(product.inStock < quantity){
                throw new Error("Stock insuffisant ! pour ce produit")
            }

            // (c) reserve la quantite qu'on veut acheter 
            await tx.product.update({
                where: {id : productId},
                data: {inStock:{decrement: quantity}}
            })

            // (d) creation de la commande 
            await tx.order.create({
                data: {
                    productId, 
                    quantity,
                    total : product.price * quantity
                }
            })
        })
        return NextResponse.json(
                {ok: true, data: Myorder},
                {status: 201}
            )
    }catch(e:any){
        if(e.message === "Produit pas trouve"){
            return NextResponse.json(
                {ok: false, error:"Produit introuvable"},
                {status:404}
            )
        }

        if(e.message === "Stock insuffisant ! pour ce produit"){
            return NextResponse.json(
                {ok: false, error:"Stock insuffisant !"},
                {status:409} // 409 : Etat de la ressource qui ne permet pas de continuer la transaction
            )
        }

        console.error(e)
        return NextResponse.json(
            {ok: false, error: "Erreur interne"},
            {status:500}
        )
    
    }*/


}