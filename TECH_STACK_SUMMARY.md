# SmartPantry MVP - Technical Stack Summary

## 🤖 AI for Meal Suggestions

**Technology:** OpenAI GPT-3.5 Turbo

**Implementation:**
- **Package:** `openai` (v4.28.0)
- **Model:** `gpt-3.5-turbo`
- **Location:** `api/src/routes/meals.ts`

**How it works:**
1. Takes user's pantry items (ingredients)
2. Considers dietary preferences and allergies
3. Sends prompt to OpenAI API
4. Receives 3 meal suggestions with:
   - Recipe titles
   - Ingredient lists with amounts
   - Cooking instructions
   - Cook time and difficulty
   - Detailed step-by-step instructions
   - Nutrition info
   - Cooking tips

**Fallback:** If OpenAI API key is not set, uses rule-based fallback suggestions

**Code Example:**
```typescript
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Uses GPT-3.5-turbo to generate meal ideas
const completion = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'system', content: 'You are a creative chef assistant...' },
    { role: 'user', content: prompt }
  ],
  max_tokens: 1000,
  temperature: 0.8,
});
```

---

## 🗄️ Database

**Technology:** PostgreSQL

**ORM:** Prisma

**Configuration:**
- **Provider:** PostgreSQL
- **Connection:** Via `DATABASE_URL` environment variable
- **Schema:** Matches `docs/06-SQL-Physical-Model/physical.sql` exactly

**Database Models:**
1. **User** - User profiles, dietary preferences, allergies
2. **PantryItem** - Inventory items with expiration dates
3. **GroceryList** - Shopping lists
4. **GroceryListItem** - Items in shopping lists
5. **MealIdea** - Saved meal ideas
6. **Notification** - Expiration reminders

**Schema Location:** `api/prisma/schema.prisma`

**Migrations:** Prisma migrations in `api/prisma/migrations/`

**For Production:** Uses Neon PostgreSQL (free tier) or Vercel Postgres

**For Local Dev:** Can use SQLite (was used initially) or PostgreSQL

---

## 🚀 API Creation

**Framework:** Express.js (Node.js)

**Language:** TypeScript

**Structure:**
```
api/
├── src/
│   ├── index.ts              # Main Express app
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client
│   │   └── validation.ts      # Zod validation schemas
│   ├── middleware/
│   │   └── errorHandler.ts   # Error handling
│   └── routes/
│       ├── users.ts          # User endpoints
│       ├── pantry.ts         # Pantry endpoints
│       ├── groceryLists.ts  # Grocery list endpoints
│       ├── meals.ts         # Meal suggestion endpoints
│       └── notifications.ts # Notification endpoints
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Demo data
└── package.json
```

**How the API was built:**

### 1. **Express Setup** (`api/src/index.ts`)
```typescript
import express from 'express';
const app = express();

// Middleware
app.use(helmet());        // Security
app.use(cors());          // CORS
app.use(morgan());        // Logging
app.use(express.json());  // JSON parsing

// Routes
app.use('/api/users', userRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/grocery-lists', groceryListRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/notifications', notificationRoutes);
```

### 2. **Prisma ORM** (`api/src/lib/prisma.ts`)
- Generates type-safe database client
- Connects to PostgreSQL
- Used in all route handlers

### 3. **Route Handlers** (e.g., `api/src/routes/meals.ts`)
- Each route file handles one resource
- Uses Prisma for database operations
- Validates requests with Zod
- Returns JSON responses

### 4. **Validation** (`api/src/lib/validation.ts`)
- Zod schemas for request validation
- Type-safe validation
- Clear error messages

### 5. **Error Handling** (`api/src/middleware/errorHandler.ts`)
- Centralized error handling
- Consistent error format
- Proper HTTP status codes

---

## 📦 Key Dependencies

**Backend (API):**
- `express` - Web framework
- `@prisma/client` - Database ORM
- `prisma` - Prisma CLI
- `openai` - OpenAI API client
- `zod` - Schema validation
- `cors` - CORS middleware
- `helmet` - Security headers
- `morgan` - HTTP logging

**Frontend (Web):**
- `next` - React framework
- `react` - UI library
- `tailwindcss` - Styling

---

## 🔧 API Architecture

**Pattern:** RESTful API

**Conventions:**
- JSON request/response
- Standard HTTP status codes (200, 201, 400, 404, 500)
- Consistent error format: `{ success: false, error: { message: "..." } }`
- Success format: `{ success: true, data: {...} }`

**Endpoints Structure:**
```
GET    /api/users              # List users
GET    /api/users/:id          # Get user
POST   /api/users              # Create user
POST   /api/users/login        # Login
PUT    /api/users/:id          # Update user
DELETE /api/users/:id          # Delete user

GET    /api/pantry?userId=1    # List pantry items
POST   /api/pantry             # Create item
PUT    /api/pantry/:id         # Update item
DELETE /api/pantry/:id         # Delete item

POST   /api/meals/suggest      # Get AI meal suggestions
GET    /api/meals?userId=1     # List saved meals
POST   /api/meals              # Save meal
```

---

## 🌐 Deployment

**API:** Vercel Serverless Functions
- Each route becomes a serverless function
- Auto-scales
- Pay-per-use

**Database:** Neon PostgreSQL (free tier)
- Managed PostgreSQL
- Connection pooling
- Automatic backups

**Frontend:** Vercel
- Next.js optimized hosting
- PWA support
- CDN distribution

---

## 💡 Why These Choices?

**OpenAI GPT-3.5:**
- ✅ Good balance of cost and quality
- ✅ Fast response times
- ✅ Good at following structured prompts
- ✅ Fallback available if API key missing

**PostgreSQL:**
- ✅ Reliable and robust
- ✅ Free tier available (Neon)
- ✅ Good for relational data
- ✅ Industry standard

**Express + Prisma:**
- ✅ Express: Simple, flexible, widely used
- ✅ Prisma: Type-safe, great DX, auto-generates types
- ✅ Easy to test and maintain
- ✅ Good documentation

---

## 📝 Summary

| Component | Technology | Version |
|-----------|-----------|---------|
| **AI** | OpenAI GPT-3.5 Turbo | v4.28.0 |
| **Database** | PostgreSQL | 14+ |
| **ORM** | Prisma | 5.10.0 |
| **API Framework** | Express.js | 4.18.2 |
| **Language** | TypeScript | 5.3.3 |
| **Validation** | Zod | 3.22.4 |
| **Frontend** | Next.js | 16.0.6 |
| **Styling** | Tailwind CSS | 4.x |

