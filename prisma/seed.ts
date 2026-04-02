import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    await prisma.deliveryJob.deleteMany({})
    await prisma.rider.deleteMany({})

    console.log("Seeding Database...")

    const rider = await prisma.rider.create({
        data: {
            email: "mario.rossi@email.com",
            fullName: "Mario Rossi",
            phone: "+39 333 1234567",
            status: "ACTIVE",
            availableNow: true,
            yearlyEarnings: 3400.00,
            monthlyEarnings: 150.00,
        }
    })

    const blockedRider = await prisma.rider.create({
        data: {
            email: "luigi.verdi@email.com",
            fullName: "Luigi Verdi",
            phone: "+39 333 7654321",
            status: "ACTIVE",
            availableNow: false,
            yearlyEarnings: 5010.00,
            monthlyEarnings: 0,
        }
    })

    await prisma.deliveryJob.create({
        data: {
            shopifyOrderId: "gid://shopify/Order/1029",
            shopifyOrderName: "#1029",
            restaurantName: "Osteria La Maremma",
            fee: 4.50,
            status: "OPEN",
            pickupAddress: "Via Roma, 10, 58100 Grosseto GR",
            pickupArea: "Centro Storico",
            deliveryAddress: "Via Aurelia Nord, 50, 58100 Grosseto GR",
            deliveryArea: "Grosseto Nord",
        }
    })

    await prisma.deliveryJob.create({
        data: {
            shopifyOrderId: "gid://shopify/Order/1030",
            shopifyOrderName: "#1030",
            restaurantName: "Pizzeria Il Buttero",
            fee: 6.00,
            status: "OPEN",
            pickupAddress: "Via dei Mille, 20, 58100 Grosseto GR",
            pickupArea: "Centro",
            deliveryAddress: "Via Castiglionese, 100, 58100 Grosseto GR",
            deliveryArea: "Grosseto Sud",
        }
    })

    console.log("Database seeded successfully.")
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
