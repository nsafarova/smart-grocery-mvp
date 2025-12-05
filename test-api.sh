#!/bin/bash

# Quick API Test Script
API_URL="https://smart-grocery-mvp.vercel.app"

echo "🔍 Testing Smart Grocery API..."
echo "================================"
echo ""

echo "1️⃣  Health Check:"
curl -s "$API_URL/health" | python3 -m json.tool 2>/dev/null || curl -s "$API_URL/health"
echo -e "\n"

echo "2️⃣  Get All Users:"
curl -s "$API_URL/api/users" | python3 -m json.tool 2>/dev/null || curl -s "$API_URL/api/users"
echo -e "\n"

echo "3️⃣  Login Test:"
curl -s -X POST "$API_URL/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@smartgrocery.app"}' | python3 -m json.tool 2>/dev/null || curl -s -X POST "$API_URL/api/users/login" -H "Content-Type: application/json" -d '{"email":"demo@smartgrocery.app"}'
echo -e "\n"

echo "4️⃣  Get Pantry Items (userId=1):"
curl -s "$API_URL/api/pantry?userId=1" | python3 -m json.tool 2>/dev/null || curl -s "$API_URL/api/pantry?userId=1"
echo -e "\n"

echo "✅ Test complete!"

