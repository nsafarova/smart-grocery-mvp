import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create multiple users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'demo@smartgrocery.app' },
      update: {},
      create: {
        email: 'demo@smartgrocery.app',
        name: 'Demo User',
        timezone: 'America/New_York',
        dietaryTags: 'vegetarian,low-sodium',
        allergies: 'peanuts',
        reminderWindowDays: 3,
        notifyEmail: true,
        notifyPush: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'sarah@smartgrocery.app' },
      update: {},
      create: {
        email: 'sarah@smartgrocery.app',
        name: 'Sarah Johnson',
        timezone: 'America/Los_Angeles',
        dietaryTags: 'vegan,gluten-free',
        allergies: 'dairy,eggs',
        reminderWindowDays: 5,
        notifyEmail: true,
        notifyPush: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'mike@smartgrocery.app' },
      update: {},
      create: {
        email: 'mike@smartgrocery.app',
        name: 'Mike Chen',
        timezone: 'America/Chicago',
        dietaryTags: 'keto,high-protein',
        allergies: 'shellfish',
        reminderWindowDays: 2,
        notifyEmail: true,
        notifyPush: false,
      },
    }),
    prisma.user.upsert({
      where: { email: 'emily@smartgrocery.app' },
      update: {},
      create: {
        email: 'emily@smartgrocery.app',
        name: 'Emily Rodriguez',
        timezone: 'America/New_York',
        dietaryTags: 'mediterranean',
        allergies: 'tree-nuts',
        reminderWindowDays: 4,
        notifyEmail: false,
        notifyPush: true,
      },
    }),
  ]);
  console.log(`✅ Created ${users.length} users`);

  const user = users[0]; // Keep first user as primary for demo

  // Create pantry items for User 1 (Demo User)
  const user1PantryItems = await Promise.all([
    prisma.pantryItem.create({
      data: {
        userId: users[0].userId,
        name: 'Milk',
        quantity: 1,
        unit: 'gallon',
        category: 'Dairy',
        expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: users[0].userId,
        name: 'Eggs',
        quantity: 12,
        unit: 'pcs',
        category: 'Dairy',
        expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: users[0].userId,
        name: 'Bread',
        quantity: 1,
        unit: 'loaf',
        category: 'Bakery',
        expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Expiring soon
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: users[0].userId,
        name: 'Chicken Breast',
        quantity: 2,
        unit: 'lbs',
        category: 'Meat',
        expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Expiring soon
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: users[0].userId,
        name: 'Rice',
        quantity: 5,
        unit: 'lbs',
        category: 'Grains',
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: users[0].userId,
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
        userId: users[0].userId,
        name: 'Onions',
        quantity: 3,
        unit: 'pcs',
        category: 'Produce',
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: users[0].userId,
        name: 'Butter',
        quantity: 1,
        unit: 'stick',
        category: 'Dairy',
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: users[0].userId,
        name: 'Spinach',
        quantity: 1,
        unit: 'bag',
        category: 'Produce',
        expirationDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Expiring very soon
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: users[0].userId,
        name: 'Yogurt',
        quantity: 0.5,
        unit: 'container',
        category: 'Dairy',
        expirationDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        source: 'manual',
      },
    }),
  ]);

  // Create pantry items for User 2 (Sarah - Vegan)
  const user2PantryItems = await Promise.all([
    prisma.pantryItem.create({
      data: {
        userId: users[1].userId,
        name: 'Almond Milk',
        quantity: 2,
        unit: 'cartons',
        category: 'Dairy Alternatives',
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: users[1].userId,
        name: 'Tofu',
        quantity: 3,
        unit: 'blocks',
        category: 'Protein',
        expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: users[1].userId,
        name: 'Quinoa',
        quantity: 2,
        unit: 'lbs',
        category: 'Grains',
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: users[1].userId,
        name: 'Avocados',
        quantity: 4,
        unit: 'pcs',
        category: 'Produce',
        expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: users[1].userId,
        name: 'Black Beans',
        quantity: 0.5,
        unit: 'can',
        category: 'Canned Goods',
        source: 'manual',
      },
    }),
  ]);

  // Create pantry items for User 3 (Mike - Keto)
  const user3PantryItems = await Promise.all([
    prisma.pantryItem.create({
      data: {
        userId: users[2].userId,
        name: 'Ground Beef',
        quantity: 3,
        unit: 'lbs',
        category: 'Meat',
        expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: users[2].userId,
        name: 'Salmon',
        quantity: 1.5,
        unit: 'lbs',
        category: 'Seafood',
        expirationDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Expiring soon
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: users[2].userId,
        name: 'Broccoli',
        quantity: 2,
        unit: 'heads',
        category: 'Produce',
        expirationDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: users[2].userId,
        name: 'Cheese',
        quantity: 1,
        unit: 'block',
        category: 'Dairy',
        expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: users[2].userId,
        name: 'Eggs',
        quantity: 18,
        unit: 'pcs',
        category: 'Dairy',
        expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        source: 'manual',
      },
    }),
  ]);

  // Create pantry items for User 4 (Emily - Mediterranean)
  const user4PantryItems = await Promise.all([
    prisma.pantryItem.create({
      data: {
        userId: users[3].userId,
        name: 'Olive Oil',
        quantity: 1,
        unit: 'bottle',
        category: 'Condiments',
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: users[3].userId,
        name: 'Feta Cheese',
        quantity: 1,
        unit: 'container',
        category: 'Dairy',
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: users[3].userId,
        name: 'Chickpeas',
        quantity: 2,
        unit: 'cans',
        category: 'Canned Goods',
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: users[3].userId,
        name: 'Bell Peppers',
        quantity: 3,
        unit: 'pcs',
        category: 'Produce',
        expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        source: 'manual',
      },
    }),
    prisma.pantryItem.create({
      data: {
        userId: users[3].userId,
        name: 'Pasta',
        quantity: 1,
        unit: 'box',
        category: 'Grains',
        source: 'manual',
      },
    }),
  ]);

  const allPantryItems = [...user1PantryItems, ...user2PantryItems, ...user3PantryItems, ...user4PantryItems];
  console.log(`✅ Created ${allPantryItems.length} pantry items across ${users.length} users`);

  // Create grocery lists for multiple users
  const groceryLists = await Promise.all([
    prisma.groceryList.create({
      data: {
        userId: users[0].userId,
        title: 'Weekly Shopping',
        status: 'active',
        items: {
          create: [
            { name: 'Pasta', quantity: 2, unit: 'boxes', category: 'Grains', isChecked: false },
            { name: 'Olive Oil', quantity: 1, unit: 'bottle', category: 'Condiments', isChecked: true },
            { name: 'Garlic', quantity: 1, unit: 'head', category: 'Produce', isChecked: false },
            { name: 'Carrots', quantity: 1, unit: 'bunch', category: 'Produce', isChecked: false },
          ],
        },
      },
    }),
    prisma.groceryList.create({
      data: {
        userId: users[0].userId,
        title: 'Party Prep',
        status: 'active',
        items: {
          create: [
            { name: 'Chips', quantity: 3, unit: 'bags', category: 'Snacks', isChecked: false },
            { name: 'Soda', quantity: 2, unit: 'bottles', category: 'Beverages', isChecked: true },
          ],
        },
      },
    }),
    prisma.groceryList.create({
      data: {
        userId: users[1].userId,
        title: 'Vegan Essentials',
        status: 'active',
        items: {
          create: [
            { name: 'Nutritional Yeast', quantity: 1, unit: 'container', category: 'Pantry', isChecked: false },
            { name: 'Tempeh', quantity: 2, unit: 'packages', category: 'Protein', isChecked: false },
            { name: 'Coconut Milk', quantity: 2, unit: 'cans', category: 'Dairy Alternatives', isChecked: true },
          ],
        },
      },
    }),
    prisma.groceryList.create({
      data: {
        userId: users[2].userId,
        title: 'Keto Meal Prep',
        status: 'active',
        items: {
          create: [
            { name: 'Bacon', quantity: 2, unit: 'packages', category: 'Meat', isChecked: false },
            { name: 'Cauliflower', quantity: 2, unit: 'heads', category: 'Produce', isChecked: false },
            { name: 'Heavy Cream', quantity: 1, unit: 'carton', category: 'Dairy', isChecked: true },
          ],
        },
      },
    }),
  ]);
  console.log(`✅ Created ${groceryLists.length} grocery lists`);

  // Create meal ideas for multiple users
  const mealIdeas = await Promise.all([
    // User 1 (Demo User)
    prisma.mealIdea.create({
      data: {
        userId: users[0].userId,
        title: 'Chicken Stir Fry',
        notes: 'Use chicken breast, rice, and vegetables. Season with soy sauce and ginger. Cook rice first, then stir fry chicken and veggies together.',
      },
    }),
    prisma.mealIdea.create({
      data: {
        userId: users[0].userId,
        title: 'Veggie Omelette',
        notes: 'Eggs with tomatoes, onions, and cheese. Serve with toast. Perfect for breakfast or brunch.',
      },
    }),
    prisma.mealIdea.create({
      data: {
        userId: users[0].userId,
        title: 'Tomato Soup',
        notes: 'Use fresh tomatoes, onions, and butter. Simmer until soft, then blend. Serve with bread.',
      },
    }),
    // User 2 (Sarah - Vegan)
    prisma.mealIdea.create({
      data: {
        userId: users[1].userId,
        title: 'Tofu Scramble',
        notes: 'Crumble tofu and cook with turmeric, black salt, and veggies. Serve with avocado toast.',
      },
    }),
    prisma.mealIdea.create({
      data: {
        userId: users[1].userId,
        title: 'Quinoa Bowl',
        notes: 'Cook quinoa, top with black beans, avocado, and fresh vegetables. Drizzle with tahini dressing.',
      },
    }),
    // User 3 (Mike - Keto)
    prisma.mealIdea.create({
      data: {
        userId: users[2].userId,
        title: 'Keto Salmon & Broccoli',
        notes: 'Pan-sear salmon, steam broccoli. Season with lemon, butter, and garlic. High protein, low carb.',
      },
    }),
    prisma.mealIdea.create({
      data: {
        userId: users[2].userId,
        title: 'Beef & Cheese Casserole',
        notes: 'Ground beef with cheese, eggs, and vegetables. Bake until golden. Perfect meal prep.',
      },
    }),
    // User 4 (Emily - Mediterranean)
    prisma.mealIdea.create({
      data: {
        userId: users[3].userId,
        title: 'Mediterranean Pasta',
        notes: 'Pasta with chickpeas, bell peppers, feta cheese, and olive oil. Add fresh herbs.',
      },
    }),
    prisma.mealIdea.create({
      data: {
        userId: users[3].userId,
        title: 'Greek Salad Bowl',
        notes: 'Mixed greens with feta, chickpeas, bell peppers, olives, and olive oil dressing.',
      },
    }),
  ]);
  console.log(`✅ Created ${mealIdeas.length} meal ideas`);

  // Create notifications for expiring items across all users
  const expiringItems = allPantryItems.filter(
    (item) => item.expirationDate && item.expirationDate <= new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
  );

  const notifications = await Promise.all(
    expiringItems.map((item) =>
      prisma.notification.create({
        data: {
          pantryItemId: item.pantryItemId,
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          status: 'pending',
        },
      })
    )
  );
  console.log(`✅ Created ${notifications.length} notifications for expiring items`);

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


