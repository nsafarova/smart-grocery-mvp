{\rtf1\ansi\ansicpg1252\cocoartf2639
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx566\tx1133\tx1700\tx2267\tx2834\tx3401\tx3968\tx4535\tx5102\tx5669\tx6236\tx6803\pardirnatural\partightenfactor0

\f0\fs24 \cf0 CREATE TABLE User\
(\
  User_ID INT NOT NULL PRIMARY KEY,\
  Email VARCHAR(255) NOT NULL UNIQUE,\
  Name VARCHAR(100),\
  Timezone VARCHAR(50),\
  Dietary_Tags VARCHAR(255),\
  Reminder_Window_Days INT,\
  Created_At TIMESTAMP\
);\
\
CREATE TABLE PantryItem\
(\
  Pantry_Item_ID INT NOT NULL PRIMARY KEY,\
  User_ID INT NOT NULL,\
  Name VARCHAR(255) NOT NULL,\
  Quantity NUMERIC(10,2),\
  Unit VARCHAR(50),\
  Category VARCHAR(100),\
  Expiration_Date DATE,\
  Source VARCHAR(100),\
  Created_At TIMESTAMP,\
  Updated_At TIMESTAMP,\
  FOREIGN KEY (User_ID) REFERENCES User(User_ID)\
);\
\
CREATE TABLE GroceryList\
(\
  Grocery_List_ID INT NOT NULL PRIMARY KEY,\
  User_ID INT NOT NULL,\
  Title VARCHAR(255) NOT NULL,\
  Status VARCHAR(50),\
  Created_At TIMESTAMP,\
  FOREIGN KEY (User_ID) REFERENCES User(User_ID)\
);\
\
CREATE TABLE GroceryListItem\
(\
  Grocery_List_Item_ID INT NOT NULL PRIMARY KEY,\
  Grocery_List_ID INT NOT NULL,\
  Pantry_Item_ID INT,\
  Name VARCHAR(255) NOT NULL,\
  Quantity NUMERIC(10,2),\
  Unit VARCHAR(50),\
  Category VARCHAR(100),\
  Note VARCHAR(1000),\
  Is_Checked BOOLEAN,\
  Created_At TIMESTAMP,\
  FOREIGN KEY (Grocery_List_ID) REFERENCES GroceryList(Grocery_List_ID),\
  FOREIGN KEY (Pantry_Item_ID) REFERENCES PantryItem(Pantry_Item_ID)\
);\
\
CREATE TABLE MealIdea\
(\
  Meal_Idea_ID INT NOT NULL PRIMARY KEY,\
  User_ID INT NOT NULL,\
  Title VARCHAR(255) NOT NULL,\
  Notes VARCHAR(2000),\
  Created_At TIMESTAMP,\
  FOREIGN KEY (User_ID) REFERENCES User(User_ID)\
);\
\
CREATE TABLE Notification\
(\
  Notification_ID INT NOT NULL PRIMARY KEY,\
  Pantry_Item_ID INT NOT NULL,\
  Scheduled_For TIMESTAMP,\
  Sent_At TIMESTAMP,\
  Status VARCHAR(50),\
  FOREIGN KEY (Pantry_Item_ID) REFERENCES PantryItem(Pantry_Item_ID)\
);\
}