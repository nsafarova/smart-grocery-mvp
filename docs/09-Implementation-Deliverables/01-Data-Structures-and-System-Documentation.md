# Test Plans

## Strategy
- Unit tests for validation and helpers.
- Integration tests for endpoint to database flows.
- Acceptance tests for normal and error course of each use case.
- Seed data for repeatable runs.

## Environment
Node 20, PostgreSQL on a free tier or local, seeded data.

## Acceptance tests
### Manage Inventory
Pre: user context is set and pantry may be empty.  
Steps: list, create, update, delete.  
Expect: rows persist, quantity is non negative, empty name rejected.

### Suggest Meals
Pre: pantry has at least five items and simple preferences exist.  
Steps: request suggestions, receive at least three ideas, save one idea.  
Expect: ideas show missing ingredients, saved row appears in MealIdea.

### Build Grocery List
Pre: two meal ideas already saved.  
Steps: create list, add items, toggle checks, convert checked to pantry.  
Expect: no duplicate items by name and unit, toggles persist, pantry rows created or updated.

### Notifications
Pre: items near expiration exist.  
Steps: run schedule, run send.  
Expect: pending rows created, then marked sent, no duplicates.

## Traceability
- Manage Inventory maps to pantry endpoints and PantryItem and User tables.
- Suggest Meals maps to meals endpoints and PantryItem, User, and MealIdea tables.
- Build Grocery List maps to list endpoints and GroceryList, GroceryListItem, and PantryItem tables.
- Notifications map to notification endpoints and Notification and PantryItem tables.

## Seed data
One user with timezone and dietary tags.  
Six pantry items with mixed expiration dates and quantities.  
One grocery list with three items, one checked.  
No notifications at start.