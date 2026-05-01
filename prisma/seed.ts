import { PrismaClient, TransactionType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Create a User
  const user1 = await prisma.user.upsert({
    where: { email: 'dhinakar.s1s1@gmail.com' },
    update: {},
    create: {
      email: 'dhinakar.s1s1@gmail.com',
      name: 'Dhinakar',
      image: 'https://i.pravatar.cc/150?u=dhinakar',
    },
  })

  // 2. Create System Categories (isDefault: true)
  const categoryDefs = [
    { name: 'Food & Dining', color: '#EF4444', icon: 'pizza', isDefault: true },
    { name: 'Transportation', color: '#3B82F6', icon: 'car', isDefault: true },
    { name: 'Housing', color: '#10B981', icon: 'home', isDefault: true },
    { name: 'Entertainment', color: '#8B5CF6', icon: 'film', isDefault: true },
    { name: 'Salary', color: '#14B8A6', icon: 'briefcase', isDefault: true },
    { name: 'Shopping', color: '#F59E0B', icon: 'shopping-bag', isDefault: true },
  ]

  for (const cat of categoryDefs) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
  }

  const foodCat = await prisma.category.findFirst({ where: { name: 'Food & Dining' } })
  const transportCat = await prisma.category.findFirst({ where: { name: 'Transportation' } })
  const housingCat = await prisma.category.findFirst({ where: { name: 'Housing' } })
  const shoppingCat = await prisma.category.findFirst({ where: { name: 'Shopping' } })

  if (foodCat && transportCat && housingCat && shoppingCat) {
    const sampleExpenses = [
      // April 26
      { title: 'Bus ticket Arrival', amount: 950, date: new Date('2026-04-26'), categoryId: transportCat.id },
      { title: 'Cab to Dinesh room', amount: 55, date: new Date('2026-04-26'), categoryId: transportCat.id },
      { title: 'Food', amount: 70, date: new Date('2026-04-26'), categoryId: foodCat.id },
      { title: 'Bus to search Pg', amount: 25, date: new Date('2026-04-26'), categoryId: transportCat.id },
      { title: 'Juice', amount: 20, date: new Date('2026-04-26'), categoryId: foodCat.id },
      { title: 'Advance For Pg', amount: 4000, date: new Date('2026-04-26'), categoryId: housingCat.id },
      { title: 'Bus to friend room', amount: 20, date: new Date('2026-04-26'), categoryId: transportCat.id },
      { title: 'Cab to Pg from dins room', amount: 116, date: new Date('2026-04-26'), categoryId: transportCat.id },

      // April 27
      { title: 'Rent for 4 days of this month', amount: 1000, date: new Date('2026-04-27'), categoryId: housingCat.id },
      { title: 'Auto to D-Mart', amount: 50, date: new Date('2026-04-27'), categoryId: transportCat.id },
      { title: 'D-Mart(Pillow, cover, Fab, chocolate, Sandals)', amount: 570, date: new Date('2026-04-27'), categoryId: shoppingCat.id },
      { title: 'Return Auto to PG', amount: 60, date: new Date('2026-04-27'), categoryId: transportCat.id },

      // April 28
      { title: 'From Pg to CTS Tambaram', amount: 96, date: new Date('2026-04-28'), categoryId: transportCat.id },
      { title: 'CTS Morning Food + Coffee', amount: 55, date: new Date('2026-04-28'), categoryId: foodCat.id },
      { title: 'Tambaram Lunch food @Erode Amman mess', amount: 124, date: new Date('2026-04-28'), categoryId: foodCat.id },
      { title: 'CTS Tambaram to PG', amount: 64, date: new Date('2026-04-28'), categoryId: transportCat.id },
    ]

    for (const expense of sampleExpenses) {
      const existing = await prisma.expense.findFirst({
        where: {
          title: expense.title,
          amount: expense.amount,
          date: expense.date,
          userId: user1.id
        }
      })

      if (!existing) {
        await prisma.expense.create({
          data: {
            ...expense,
            userId: user1.id,
            type: TransactionType.EXPENSE,
          }
        })
      }
    }
  }

  console.log('Seeding completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
