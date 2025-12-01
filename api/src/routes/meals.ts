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

interface MealSuggestion {
  title: string;
  ingredients: string[];
  instructions: string;
  cookTime?: string;
  difficulty?: string;
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
2. List of ingredients from the available list (plus common pantry staples if needed)
3. Brief cooking instructions (3-4 sentences)
4. Estimated cook time
5. Difficulty level (Easy/Medium/Hard)

Respond ONLY with valid JSON in this exact format:
[
  {
    "title": "Meal Name",
    "ingredients": ["ingredient1", "ingredient2"],
    "instructions": "Step by step instructions...",
    "cookTime": "30 minutes",
    "difficulty": "Easy"
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
      cookTime: '25 minutes',
      difficulty: 'Easy'
    });
  }

  if (hasEggs && !isVegan) {
    const eggIngredients = ['eggs', ...ingredients.filter(i => 
      ['cheese', 'tomato', 'onion', 'pepper', 'spinach', 'mushroom'].some(x => i.toLowerCase().includes(x))
    )].slice(0, 5);
    
    suggestions.push({
      title: '🥚 Fluffy Veggie Omelette',
      ingredients: eggIngredients,
      instructions: 'Beat eggs with a splash of milk, salt, and pepper. Heat butter in a non-stick pan over medium heat. Pour in eggs and let set slightly, then add your fillings to one half. Fold over and cook until just set. Serve with toast.',
      cookTime: '15 minutes',
      difficulty: 'Easy'
    });
  }

  if (hasVeggies) {
    const saladIngredients = ingredients.filter(i =>
      ['tomato', 'lettuce', 'cucumber', 'pepper', 'onion', 'carrot', 'spinach', 'cheese'].some(v =>
        i.toLowerCase().includes(v)
      )
    ).slice(0, 6);
    
    if (saladIngredients.length >= 2) {
      suggestions.push({
        title: '🥗 Fresh Garden Salad',
        ingredients: saladIngredients,
        instructions: 'Wash and chop all vegetables into bite-sized pieces. Combine in a large bowl. Make a simple dressing with olive oil, lemon juice, salt, pepper, and herbs. Toss everything together and serve immediately.',
        cookTime: '10 minutes',
        difficulty: 'Easy'
      });
    }
  }

  if (hasCarbs && (hasVeggies || hasProtein)) {
    suggestions.push({
      title: '🍝 Comfort Bowl',
      ingredients: ingredients.slice(0, 6),
      instructions: 'Cook your grain or pasta according to package directions. In a separate pan, sauté vegetables and protein with olive oil and garlic. Combine everything in a bowl, drizzle with sauce of choice, and top with fresh herbs or cheese.',
      cookTime: '30 minutes',
      difficulty: 'Easy'
    });
  }

  // Always add a generic suggestion
  if (suggestions.length < 3) {
    suggestions.push({
      title: '✨ Chef\'s Surprise',
      ingredients: ingredients.slice(0, 5),
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
