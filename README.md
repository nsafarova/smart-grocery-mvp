# Smart Grocery & Meal Planner MVP

A full-stack mobile-first application to help track pantry inventory, see expiring/low stock items, get AI-powered meal ideas, and manage grocery lists.

**Build approach:** Monorepo with Node 20, Express, Prisma, PostgreSQL (API) + Next.js PWA (web).

**Deployment:** Vercel (see [DEPLOYMENT.md](./DEPLOYMENT.md))

## Project Structure

```
smart-grocery-mvp/
├── api/                    # Express + Prisma backend
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema (matches physical.sql)
│   │   └── seed.ts         # Seed script for demo data
│   ├── src/
│   │   ├── index.ts        # Express app entry point
│   │   ├── lib/
│   │   │   ├── prisma.ts   # Prisma client
│   │   │   └── validation.ts # Zod schemas
│   │   ├── middleware/
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   ├── users.ts
│   │   │   ├── pantry.ts
│   │   │   ├── groceryLists.ts
│   │   │   ├── meals.ts
│   │   │   └── notifications.ts
│   │   └── __tests__/
│   │       └── api.test.ts
│   ├── openapi.yaml        # API specification
│   ├── package.json
│   └── tsconfig.json
├── web/                    # Next.js frontend (TBD)
└── docs/                   # Project documentation
```

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm or yarn

### 1. Set up PostgreSQL

```bash
# Create database
createdb smart_grocery

# Or using psql
psql -U postgres -c "CREATE DATABASE smart_grocery;"
```

### 2. Install dependencies

```bash
cd api
npm install
```

### 3. Configure environment

```bash
# Create .env file in api/
echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_grocery?schema=public"' > .env
```

### 4. Run migrations

```bash
npm run migrate
```

### 5. Seed demo data

```bash
npm run seed
```

### 6. Start the server

```bash
npm run dev
```

The API will be running at **http://localhost:3000**

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run migrate` | Run Prisma migrations |
| `npm run seed` | Seed database with demo data |
| `npm run test` | Run test suite |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run studio` | Open Prisma Studio (DB GUI) |

## API Endpoints

### Users
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Pantry (Inventory)
- `GET /api/pantry?userId=1` - List pantry items
- `GET /api/pantry/expiring?userId=1&days=7` - Get expiring items
- `GET /api/pantry/low-stock?userId=1` - Get low stock items
- `GET /api/pantry/categories?userId=1` - List categories
- `GET /api/pantry/:id` - Get item
- `POST /api/pantry` - Create item
- `PUT /api/pantry/:id` - Update item
- `DELETE /api/pantry/:id` - Delete item

### Grocery Lists
- `GET /api/grocery-lists?userId=1` - List grocery lists
- `GET /api/grocery-lists/:id` - Get list with items
- `POST /api/grocery-lists` - Create list
- `PUT /api/grocery-lists/:id` - Update list
- `DELETE /api/grocery-lists/:id` - Delete list
- `POST /api/grocery-lists/:id/items` - Add item
- `PUT /api/grocery-lists/:listId/items/:itemId` - Update item (check/uncheck)
- `DELETE /api/grocery-lists/:listId/items/:itemId` - Remove item
- `POST /api/grocery-lists/:id/add-expiring?userId=1` - Auto-add expiring items
- `POST /api/grocery-lists/:id/add-low-stock?userId=1` - Auto-add low stock items

### Meal Ideas
- `GET /api/meals?userId=1` - List saved meals
- `GET /api/meals/:id` - Get meal
- `POST /api/meals` - Save meal idea
- `PUT /api/meals/:id` - Update meal
- `DELETE /api/meals/:id` - Delete meal
- `POST /api/meals/suggest` - Get AI suggestions based on pantry

### Notifications
- `GET /api/notifications?userId=1` - List notifications
- `GET /api/notifications/pending?userId=1` - Get due notifications
- `GET /api/notifications/:id` - Get notification
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id` - Update notification
- `PUT /api/notifications/:id/mark-sent` - Mark as sent
- `PUT /api/notifications/:id/cancel` - Cancel notification
- `DELETE /api/notifications/:id` - Delete notification
- `POST /api/notifications/auto-schedule` - Auto-schedule for expiring items

## Example Requests

### Create a user
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "name": "John Doe", "reminderWindowDays": 3}'
```

### Add pantry item
```bash
curl -X POST http://localhost:3000/api/pantry \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "name": "Milk", "quantity": 2, "unit": "gallons", "category": "Dairy", "expirationDate": "2024-12-31"}'
```

### Get meal suggestions
```bash
curl -X POST http://localhost:3000/api/meals/suggest \
  -H "Content-Type: application/json" \
  -d '{"userId": 1}'
```

### Create grocery list with auto-add
```bash
# Create list
curl -X POST http://localhost:3000/api/grocery-lists \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "title": "Weekly Shopping"}'

# Auto-add expiring items
curl -X POST "http://localhost:3000/api/grocery-lists/1/add-expiring?userId=1&days=7"
```

## Database Schema

The schema matches `docs/06-SQL-Physical-Model/physical.sql`:

- **User** - User profiles with dietary preferences
- **PantryItem** - Inventory items with expiration dates
- **GroceryList** - Shopping lists
- **GroceryListItem** - Items in shopping lists
- **MealIdea** - Saved meal ideas
- **Notification** - Expiration reminders

## MVP Features (from docs)

- ✅ Manage Inventory (CRUD pantry items, low/expiring flags)
- ✅ Suggest Meals (ideas based on pantry + preferences)
- ✅ Build Grocery List (add missing/low items)
- ✅ Notifications (scheduled reminders)

## Deployment to Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full instructions.

### Quick Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy API
cd api
vercel

# Deploy Frontend
cd ../web
vercel
```

### Environment Variables

**API:**
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct DB connection (for migrations)
- `OPENAI_API_KEY` - For AI meal suggestions (optional)
- `FRONTEND_URL` - Frontend URL for CORS

**Frontend:**
- `NEXT_PUBLIC_API_URL` - API base URL

## License

MIT
