import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@smartgrocery.app' },
    update: {},
    create: {
      email: 'demo@smartgrocery.app',
      name: 'Demo User',
      timezone: 'America/New_York',
      dietaryTags: 'vegetarian,low-sodium',
      reminderWindowDays: 3,
    },
  });
  console.log(`✅ Created user: ${user.name} (${user.email})`);

  // Create pantry items
  const pantryItems = await Promise.all([
    prisma.pantryItem.create({
      data: {
        userId: user.userId,
        name: 'Milk',
        quantity: 1,
        unit: 'gallon',
        category: 'Dairy',
        expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: user.userId,
        name: 'Eggs',
        quantity: 12,
        unit: 'pcs',
        category: 'Dairy',
        expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: user.userId,
        name: 'Bread',
        quantity: 1,
        unit: 'loaf',
        category: 'Bakery',
        expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days - expiring soon!
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: user.userId,
        name: 'Chicken Breast',
        quantity: 2,
        unit: 'lbs',
        category: 'Meat',
        expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days - expiring soon!
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: user.userId,
        name: 'Rice',
        quantity: 5,
        unit: 'lbs',
        category: 'Grains',
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: user.userId,
        name: 'Tomatoes',
        quantity: 4,
        unit: 'pcs',
        category: 'Produce',
        expirationDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: user.userId,
        name: 'Onions',
        quantity: 3,
        unit: 'pcs',
        category: 'Produce',
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: user.userId,
        name: 'Butter',
        quantity: 1,
        unit: 'stick',
        category: 'Dairy',
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        source: 'manual',
      },
    }),
  ]);
  console.log(`✅ Created ${pantryItems.length} pantry items`);

  // Create a grocery list
  const groceryList = await prisma.groceryList.create({
    data: {
      userId: user.userId,
      title: 'Weekly Shopping',
      status: 'active',
      items: {
        create: [
          { name: 'Pasta', quantity: 2, unit: 'boxes', category: 'Grains' },
          { name: 'Olive Oil', quantity: 1, unit: 'bottle', category: 'Condiments' },
          { name: 'Garlic', quantity: 1, unit: 'head', category: 'Produce' },
        ],
      },
    },
  });
  console.log(`✅ Created grocery list: ${groceryList.title}`);

  // Create meal ideas
  const mealIdeas = await Promise.all([
    prisma.mealIdea.create({
      data: {
        userId: user.userId,
        title: 'Chicken Stir Fry',
        notes: 'Use chicken breast, rice, and vegetables. Season with soy sauce and ginger.',
      },
    }),
    prisma.mealIdea.create({
      data: {
        userId: user.userId,
        title: 'Veggie Omelette',
        notes: 'Eggs with tomatoes, onions, and cheese. Serve with toast.',
      },
    }),
  ]);
  console.log(`✅ Created ${mealIdeas.length} meal ideas`);

  // Create notifications for expiring items
  const expiringItems = pantryItems.filter(
    (item) => item.expirationDate && item.expirationDate <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  );

  for (const item of expiringItems) {
    await prisma.notification.create({
      data: {
        pantryItemId: item.pantryItemId,
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        status: 'pending',
      },
    });
  }
  console.log(`✅ Created ${expiringItems.length} notifications for expiring items`);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

