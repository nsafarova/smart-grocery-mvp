import { Router, Request, Response, NextFunction } from 'express';
import OpenAI from 'openai';
import prisma from '../lib/prisma.js';
import { createMealIdeaSchema, updateMealIdeaSchema, validateBody } from '../lib/validation.js';
import { createError } from '../middleware/errorHandler.js';
import { ZodError } from 'zod';

const router = Router();

// Initialize OpenAI client (will be null if no API key)
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

interface Ingredient {
  name: string;
  amount: string;
  unit?: string;
}

interface MealSuggestion {
  title: string;
  ingredients: string[] | Ingredient[];
  instructions: string;
  cookTime?: string;
  difficulty?: string;
  servings?: string;
  detailedSteps?: string[];
  tips?: string;
  nutrition?: {
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
  };
}

// AI-powered meal suggestion using OpenAI
async function getAIMealSuggestions(
  ingredients: string[],
  dietaryTags?: string | null,
  allergies?: string | null,
  additionalPreferences?: string
): Promise<MealSuggestion[]> {
  
  if (!openai) {
    console.log('OpenAI not configured, using fallback suggestions');
    return generateFallbackSuggestions(ingredients, dietaryTags, allergies);
  }

  try {
    const ingredientList = ingredients.slice(0, 15).join(', ');
    
    let constraints = [];
    if (dietaryTags) constraints.push(`Dietary preferences: ${dietaryTags}`);
    if (allergies) constraints.push(`Allergies to AVOID: ${allergies}`);
    if (additionalPreferences) constraints.push(`Additional preferences: ${additionalPreferences}`);
    
    const constraintsText = constraints.length > 0 
      ? `\n\nIMPORTANT CONSTRAINTS:\n${constraints.join('\n')}`
      : '';

    const prompt = `You are a helpful meal planning assistant. Based on these available ingredients, suggest 3 delicious meal ideas.

Available ingredients: ${ingredientList}
${constraintsText}

For each meal, provide:
1. A creative, appetizing title
2. List of ingredients with SPECIFIC AMOUNTS and UNITS (e.g., "2 cups rice", "1 lb chicken", "3 cloves garlic")
3. Brief cooking instructions (3-4 sentences) - keep this SHORT for the preview
4. Detailed step-by-step instructions (numbered list, 5-8 steps) - for the full recipe
5. Estimated cook time
6. Difficulty level (Easy/Medium/Hard)
7. Number of servings (be specific, e.g., "2 servings" or "4 servings")
8. Optional cooking tips
9. Optional nutrition info (calories, protein, carbs, fat per serving)

IMPORTANT: For ingredients, provide an array of objects with "name", "amount", and "unit" fields. Amounts should be specific and measurable.

Respond ONLY with valid JSON in this exact format:
[
  {
    "title": "Meal Name",
    "ingredients": [
      {"name": "chicken breast", "amount": "1", "unit": "lb"},
      {"name": "rice", "amount": "2", "unit": "cups"},
      {"name": "garlic", "amount": "3", "unit": "cloves"}
    ],
    "instructions": "Brief 3-4 sentence summary for preview...",
    "detailedSteps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
    "cookTime": "30 minutes",
    "difficulty": "Easy",
    "servings": "2 servings",
    "tips": "Optional cooking tip or variation",
    "nutrition": {
      "calories": "~350",
      "protein": "~25g",
      "carbs": "~40g",
      "fat": "~12g"
    }
  }
]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'You are a creative chef assistant. Always respond with valid JSON only, no markdown or extra text.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content || '';
    
    // Parse JSON from response
    let jsonContent = content.trim();
    
    // Remove markdown code blocks if present
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    const suggestions = JSON.parse(jsonContent) as MealSuggestion[];
    
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      return suggestions;
    }
    
    throw new Error('Invalid response format');
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateFallbackSuggestions(ingredients, dietaryTags, allergies);
  }
}

// Fallback suggestions when OpenAI is not available
function generateFallbackSuggestions(
  ingredients: string[],
  dietaryTags?: string | null,
  allergies?: string | null
): MealSuggestion[] {
  const ingredientsLower = ingredients.map(i => i.toLowerCase());
  const suggestions: MealSuggestion[] = [];
  
  const isVegetarian = dietaryTags?.toLowerCase().includes('vegetarian');
  const isVegan = dietaryTags?.toLowerCase().includes('vegan');
  const allergyList = (allergies || '').toLowerCase().split(',').map(a => a.trim());

  // Check for ingredient types
  const hasProtein = !isVegan && ingredientsLower.some(i =>
    ['chicken', 'beef', 'fish', 'tofu', 'eggs', 'egg', 'pork', 'shrimp', 'salmon'].some(p => i.includes(p))
  );
  const hasCarbs = ingredientsLower.some(i =>
    ['rice', 'pasta', 'bread', 'potato', 'noodles', 'quinoa'].some(c => i.includes(c))
  );
  const hasVeggies = ingredientsLower.some(i =>
    ['tomato', 'onion', 'pepper', 'carrot', 'lettuce', 'spinach', 'broccoli', 'garlic', 'zucchini'].some(v => i.includes(v))
  );
  const hasEggs = ingredientsLower.some(i => i.includes('egg'));
  const hasDairy = ingredientsLower.some(i => ['milk', 'cheese', 'butter', 'yogurt', 'cream'].some(d => i.includes(d)));

  if (hasProtein && hasVeggies && !isVegetarian) {
    suggestions.push({
      title: '🍳 Savory Stir-Fry Bowl',
      ingredients: ingredients.filter(i => 
        ['chicken', 'beef', 'tofu', 'tomato', 'onion', 'pepper', 'carrot', 'garlic', 'rice'].some(x => 
          i.toLowerCase().includes(x)
        )
      ).slice(0, 6),
      instructions: 'Cut protein into bite-sized pieces and season. Heat oil in a wok or large pan over high heat. Stir-fry protein until golden, then add vegetables. Season with soy sauce, garlic, and your favorite spices. Serve over rice or noodles.',
      detailedSteps: [
        'Step 1: Cut your protein (chicken, beef, or tofu) into bite-sized pieces and season with salt, pepper, and your favorite spices.',
        'Step 2: Heat 2 tablespoons of oil in a wok or large pan over high heat until shimmering.',
        'Step 3: Add the protein and stir-fry for 3-4 minutes until golden brown and cooked through. Remove and set aside.',
        'Step 4: Add a bit more oil if needed, then add chopped vegetables (onions, peppers, carrots) and stir-fry for 2-3 minutes until crisp-tender.',
        'Step 5: Return the protein to the pan, add 2-3 tablespoons of soy sauce, minced garlic, and any additional seasonings.',
        'Step 6: Toss everything together and cook for 1 more minute. Serve hot over cooked rice or noodles.',
      ],
      cookTime: '25 minutes',
      difficulty: 'Easy',
      servings: '2 servings',
      tips: 'For best results, make sure your pan is very hot before adding ingredients. Don\'t overcrowd the pan - cook in batches if needed.',
    });
  }

  if (hasEggs && !isVegan) {
    const eggIngredients = ['eggs', ...ingredients.filter(i => 
      ['cheese', 'tomato', 'onion', 'pepper', 'spinach', 'mushroom'].some(x => i.toLowerCase().includes(x))
    )].slice(0, 5);
    
    const omeletteIngredients: Ingredient[] = [
      { name: 'eggs', amount: '3', unit: 'large' },
      { name: 'milk', amount: '2', unit: 'tbsp' },
      { name: 'butter', amount: '1', unit: 'tbsp' },
    ];
    
    if (eggIngredients.some(i => i.toLowerCase().includes('cheese'))) {
      omeletteIngredients.push({ name: 'cheese', amount: '1/4', unit: 'cup shredded' });
    }
    if (eggIngredients.some(i => i.toLowerCase().includes('tomato'))) {
      omeletteIngredients.push({ name: 'tomato', amount: '1', unit: 'small diced' });
    }
    if (eggIngredients.some(i => i.toLowerCase().includes('spinach'))) {
      omeletteIngredients.push({ name: 'spinach', amount: '1/2', unit: 'cup' });
    }
    
    suggestions.push({
      title: '🥚 Fluffy Veggie Omelette',
      ingredients: omeletteIngredients,
      instructions: 'Beat eggs with a splash of milk, salt, and pepper. Heat butter in a non-stick pan over medium heat. Pour in eggs and let set slightly, then add your fillings to one half. Fold over and cook until just set. Serve with toast.',
      detailedSteps: [
        'Step 1: Crack 2-3 eggs into a bowl, add 1-2 tablespoons of milk, and season with salt and pepper. Beat until well combined.',
        'Step 2: Heat 1 tablespoon of butter in a non-stick pan over medium-low heat until melted.',
        'Step 3: Pour the egg mixture into the pan and let it cook undisturbed for 30 seconds until the edges start to set.',
        'Step 4: Gently lift the edges with a spatula and tilt the pan to let uncooked egg flow to the edges.',
        'Step 5: Once the bottom is set but the top is still slightly runny, add your fillings (cheese, vegetables) to one half of the omelette.',
        'Step 6: Carefully fold the other half over the fillings and cook for 1 more minute. Slide onto a plate and serve immediately with toast.',
      ],
      cookTime: '15 minutes',
      difficulty: 'Easy',
      servings: '1 serving',
      tips: 'The key to a fluffy omelette is low heat and patience. Don\'t rush the cooking process!',
    });
  }

  if (hasVeggies) {
    const saladIngredients = ingredients.filter(i =>
      ['tomato', 'lettuce', 'cucumber', 'pepper', 'onion', 'carrot', 'spinach', 'cheese'].some(v =>
        i.toLowerCase().includes(v)
      )
    ).slice(0, 6);
    
    if (saladIngredients.length >= 2) {
      const saladIngredientList: Ingredient[] = [];
      if (saladIngredients.some(i => i.toLowerCase().includes('lettuce'))) {
        saladIngredientList.push({ name: 'lettuce', amount: '4', unit: 'cups chopped' });
      }
      if (saladIngredients.some(i => i.toLowerCase().includes('tomato'))) {
        saladIngredientList.push({ name: 'tomato', amount: '2', unit: 'medium' });
      }
      if (saladIngredients.some(i => i.toLowerCase().includes('cucumber'))) {
        saladIngredientList.push({ name: 'cucumber', amount: '1', unit: 'medium' });
      }
      if (saladIngredients.some(i => i.toLowerCase().includes('pepper'))) {
        saladIngredientList.push({ name: 'bell pepper', amount: '1', unit: 'medium' });
      }
      if (saladIngredients.some(i => i.toLowerCase().includes('onion'))) {
        saladIngredientList.push({ name: 'onion', amount: '1/4', unit: 'cup sliced' });
      }
      if (saladIngredients.some(i => i.toLowerCase().includes('carrot'))) {
        saladIngredientList.push({ name: 'carrot', amount: '1', unit: 'medium' });
      }
      saladIngredientList.push({ name: 'olive oil', amount: '3', unit: 'tbsp' });
      saladIngredientList.push({ name: 'lemon juice', amount: '1', unit: 'tbsp' });
      
      suggestions.push({
        title: '🥗 Fresh Garden Salad',
        ingredients: saladIngredientList.length > 0 ? saladIngredientList : saladIngredients,
        instructions: 'Wash and chop all vegetables into bite-sized pieces. Combine in a large bowl. Make a simple dressing with olive oil, lemon juice, salt, pepper, and herbs. Toss everything together and serve immediately.',
        detailedSteps: [
          'Step 1: Wash all vegetables thoroughly under cold running water and pat dry.',
          'Step 2: Chop vegetables into bite-sized pieces - aim for uniform sizes for even eating.',
          'Step 3: Combine all chopped vegetables in a large salad bowl.',
          'Step 4: In a small bowl, whisk together 3 tablespoons olive oil, 1 tablespoon lemon juice, salt, pepper, and your favorite herbs (basil, oregano, or parsley work well).',
          'Step 5: Drizzle the dressing over the salad and toss gently to coat all ingredients.',
          'Step 6: Serve immediately for the freshest taste. Add cheese, nuts, or croutons as desired.',
        ],
        cookTime: '10 minutes',
        difficulty: 'Easy',
        servings: '2 servings',
        tips: 'Add the dressing just before serving to keep the vegetables crisp. You can prepare the vegetables ahead of time and store them in the fridge.',
      });
    }
  }

  if (hasCarbs && (hasVeggies || hasProtein)) {
    const comfortIngredients: Ingredient[] = [];
    const carbName = ingredients.find(i => 
      ['rice', 'pasta', 'bread', 'potato', 'noodles', 'quinoa'].some(c => 
        i.toLowerCase().includes(c)
      )
    );
    if (carbName) {
      comfortIngredients.push({ name: carbName, amount: '2', unit: 'cups cooked' });
    }
    if (ingredients.some(i => i.toLowerCase().includes('tomato'))) {
      comfortIngredients.push({ name: 'tomato', amount: '2', unit: 'medium' });
    }
    if (ingredients.some(i => i.toLowerCase().includes('onion'))) {
      comfortIngredients.push({ name: 'onion', amount: '1', unit: 'medium' });
    }
    if (ingredients.some(i => i.toLowerCase().includes('garlic'))) {
      comfortIngredients.push({ name: 'garlic', amount: '2', unit: 'cloves' });
    }
    comfortIngredients.push({ name: 'olive oil', amount: '2', unit: 'tbsp' });
    
    suggestions.push({
      title: '🍝 Comfort Bowl',
      ingredients: comfortIngredients.length > 0 ? comfortIngredients : ingredients.slice(0, 6).map(name => ({ name, amount: '', unit: '' })),
      instructions: 'Cook your grain or pasta according to package directions. In a separate pan, sauté vegetables and protein with olive oil and garlic. Combine everything in a bowl, drizzle with sauce of choice, and top with fresh herbs or cheese.',
      cookTime: '30 minutes',
      difficulty: 'Easy'
    });
  }

  // Always add a generic suggestion
  if (suggestions.length < 3) {
    const surpriseIngredients: Ingredient[] = ingredients.slice(0, 5).map((name, idx) => ({
      name,
      amount: (idx + 1).toString(),
      unit: idx === 0 ? 'cup' : idx === 1 ? 'lb' : 'piece'
    }));
    
    suggestions.push({
      title: '✨ Chef\'s Surprise',
      ingredients: surpriseIngredients,
      instructions: 'Get creative! Combine your available ingredients in unexpected ways. Try roasting vegetables, making a quick sauce, or creating a grain bowl with whatever you have on hand.',
      cookTime: '30 minutes',
      difficulty: 'Medium'
    });
  }

  if (suggestions.length < 3) {
    suggestions.push({
      title: '🥣 Simple One-Pot Meal',
      ingredients: ingredients.slice(0, 6),
      instructions: 'Add all ingredients to a large pot with broth or water. Season generously with salt, pepper, and herbs. Bring to a boil, then simmer until everything is tender. Adjust seasoning and serve hot.',
      cookTime: '35 minutes',
      difficulty: 'Easy'
    });
  }

  return suggestions.slice(0, 3);
}

// POST /api/meals/suggest - Get AI meal suggestions based on pantry
router.post('/suggest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.body.userId);
    const additionalPreferences = req.body.additionalPreferences as string | undefined;

    if (isNaN(userId)) {
      throw createError('userId is required', 400);
    }

    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) {
      throw createError('User not found', 404);
    }

    // Get pantry items with stock
    const pantryItems = await prisma.pantryItem.findMany({
      where: {
        userId,
        OR: [{ quantity: { gt: 0 } }, { quantity: null }],
      },
    });

    if (pantryItems.length === 0) {
      res.json({
        success: true,
        data: {
          suggestions: [{
            title: '📦 Empty Pantry',
            ingredients: [],
            instructions: 'Add items to your pantry to get personalized meal suggestions!',
            cookTime: 'N/A',
            difficulty: 'N/A'
          }],
        },
      });
      return;
    }

    const ingredients = pantryItems.map(item => item.name);
    const suggestions = await getAIMealSuggestions(
      ingredients, 
      user.dietaryTags,
      user.allergies,
      additionalPreferences
    );

    res.json({ 
      success: true, 
      data: { 
        suggestions,
        usingAI: !!openai 
      } 
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/meals - List saved meal ideas
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.query.userId as string);
    if (isNaN(userId)) {
      throw createError('userId query parameter is required', 400);
    }

    const meals = await prisma.mealIdea.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: meals });
  } catch (error) {
    next(error);
  }
});

// GET /api/meals/:id - Get single meal idea
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mealIdeaId = parseInt(req.params.id);
    if (isNaN(mealIdeaId)) {
      throw createError('Invalid meal idea ID', 400);
    }

    const meal = await prisma.mealIdea.findUnique({ where: { mealIdeaId } });
    if (!meal) {
      throw createError('Meal idea not found', 404);
    }

    res.json({ success: true, data: meal });
  } catch (error) {
    next(error);
  }
});

// POST /api/meals - Save a meal idea
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateBody(createMealIdeaSchema, req.body);

    const user = await prisma.user.findUnique({ where: { userId: data.userId } });
    if (!user) {
      throw createError('User not found', 404);
    }

    const meal = await prisma.mealIdea.create({ data });
    res.status(201).json({ success: true, data: meal });
  } catch (error) {
    if (error instanceof ZodError) {
      next(createError('Validation failed', 400, error.errors));
    } else {
      next(error);
    }
  }
});

// PUT /api/meals/:id - Update meal idea
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mealIdeaId = parseInt(req.params.id);
    if (isNaN(mealIdeaId)) {
      throw createError('Invalid meal idea ID', 400);
    }

    const data = validateBody(updateMealIdeaSchema, req.body);

    const meal = await prisma.mealIdea.update({
      where: { mealIdeaId },
      data,
    });

    res.json({ success: true, data: meal });
  } catch (error) {
    if (error instanceof ZodError) {
      next(createError('Validation failed', 400, error.errors));
    } else if ((error as any).code === 'P2025') {
      next(createError('Meal idea not found', 404));
    } else {
      next(error);
    }
  }
});

// DELETE /api/meals/:id - Delete meal idea
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mealIdeaId = parseInt(req.params.id);
    if (isNaN(mealIdeaId)) {
      throw createError('Invalid meal idea ID', 400);
    }

    await prisma.mealIdea.delete({ where: { mealIdeaId } });
    res.json({ success: true, message: 'Meal idea deleted successfully' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      next(createError('Meal idea not found', 404));
    } else {
      next(error);
    }
  }
});

export default router;
