AI Product Explorer
AI Product Explorer is a modern e-commerce prototype platform equipped with AI-powered search and product comparison features. It allows users to search for products using natural language and receive detailed, AI-generated comparison reports for their selected items.
Live Demo: https://ai-product-explorer-iota.vercel.app/
(You can log in using the demo account: test@example.com / password123)
Key Features
AI-Powered Search: Understands natural language queries like "best gaming laptops under $1500" and converts them into structured filters.
AI Product Comparison: Generates human-like comparison reports for selected products, including pros and cons, recommendations based on use cases, and summary tables.
Advanced Filtering & Sorting: Standard e-commerce filtering options (category, brand, price range) and sorting by price, rating, or specs.
User Authentication: Secure user login, logout, and session management based on JWT (JSON Web Tokens).
Favorites System: Users can save their favorite products to a personal list.
Comparison Tray: An interface to add up to 4 products for detailed analysis.
Modern & Responsive UI: Built with Tailwind CSS and shadcn/ui, providing a seamless experience on all devices (mobile, tablet, desktop).
Comprehensive Test Suite: Includes unit and end-to-end tests written with Jest and Playwright.
Project Structure
The project's folder structure is organized in a modular and understandable way, following Next.js App Router conventions.
code
Text
/ai-product-explorer
├── /e2e/                     # End-to-end (E2E) tests written with Playwright
│   ├── auth.spec.ts
│   └── ...
├── /prisma/                  # Everything related to the database
│   ├── /migrations/          # History of database schema changes
│   ├── schema.prisma         # Definition of database models (tables)
│   └── seed.ts               # Script to seed the database with initial data
├── /public/                  # Static assets (images, icons, fonts)
│   ├── vercel.svg
│   └── ...
├── /src/
│   ├── /app/                 # Main directory for the Next.js App Router (pages and APIs)
│   │   ├── /api/             # Backend API endpoints (Serverless Functions)
│   │   │   ├── /auth/        # Authentication APIs (login, logout)
│   │   │   ├── /products/    # Product listing and detail APIs
│   │   │   └── ...
│   │   ├── /products/[id]/   # Dynamic product detail page
│   │   ├── layout.tsx        # The main layout wrapping all pages
│   │   └── page.tsx          # The homepage (/)
│   ├── /components/          # Reusable React components
│   │   ├── /ui/              # Base UI components (Button, Card, etc. - from shadcn/ui)
│   │   ├── ProductCard.tsx
│   │   ├── SearchBar.tsx
│   │   └── ...
│   └── /lib/                  # Helper functions, configurations, and core logic
│       ├── /stores/          # Zustand state management (global state)
│       │   ├── authStore.ts
│       │   └── productStore.ts
│       ├── /hooks/           # Reusable React hooks (e.g., useDebounce)
│       ├── auth.ts           # JWT and authentication helper functions
│       ├── prisma.ts         # Global instance of Prisma Client
│       └── validations.ts    # Zod schemas for API validation
├── .env.example              # Template for required environment variables
├── jest.config.js            # Jest (unit test) configuration
├── next.config.ts            # Next.js configuration
└── playwright.config.ts      # Playwright (E2E test) configuration
Architecture and Technology Rationale
This project is built on a serverless architecture with the goal of creating a modern, scalable, and maintainable web application. Each technology choice was made to enhance developer experience, boost performance, and fully leverage the Vercel ecosystem.
![alt text](https://raw.githubusercontent.com/alihanerman/ai-product-explorer/main/public/architecture.png)
Architectural Layers and Component Roles
1. Client Layer (Browser)
This is the layer the user directly interacts with. It aims to provide a fast, fluid, and modern user experience.
Next.js (App Router) & React:
Role: Forms the core framework of the application. Server-Side Rendering (SSR) ensures fast initial page loads and SEO compatibility. Client-side routing enables smooth, app-like navigation between pages without full reloads.
Why it was chosen: It's a leading solution for performance, SEO, and developer experience. Its seamless integration with Vercel simplifies the deployment process.
Zustand (State Management):
Role: Manages the application's global state (e.g., logged-in user information, products in the comparison tray, list of favorites).
Why it was chosen: It offers a much simpler and less boilerplate-heavy approach compared to alternatives like Redux. It's ideal for straightforward cross-component state sharing, such as a product added from a ProductCard instantly appearing in the ComparisonTray.
2. Server Layer (Backend)
This layer manages the application's business logic, data validation, and communication with external services.
Next.js API Routes:
Role: Serves as the application's backend. Operations like database queries, AI service calls, and authentication are handled through these APIs.
Why it was chosen: They automatically become serverless functions on Vercel. This eliminates the need to manage a traditional backend server, reduces costs, and scales automatically with traffic.
Zod (Schema Validation):
Role: Validates that incoming requests to the APIs (e.g., filtering parameters, user login credentials) are in the expected format and type.
Why it was chosen: It provides type safety and prevents invalid or malicious data from reaching the business logic, making the application more secure and stable. It simplifies catching errors early in the development process.
3. External Services (Infrastructure)
These are the cloud services that handle the application's core needs like data storage, artificial intelligence, and file management.
Google Gemini (AI Service):
Role: Provides the "AI" capabilities of the project. It has two primary functions:
Natural Language Understanding: Analyzes a user's search query like "cheap gaming laptops" and converts it into a structured JSON object like { "searchQuery": "gaming", "sortBy": "price" }.
Text Generation: Takes the technical specs of products to be compared and generates a fluent, human-like text that compares them, highlighting their pros and cons.
Why it was chosen: It's a powerful, flexible, and easily integrable Large Language Model (LLM).
Vercel Postgres (Database) & Prisma (ORM):
Role: Vercel Postgres permanently stores product, user, and favorite data. Prisma acts as a bridge between this database and the application code.
Why it was chosen:
Vercel Postgres: Offers a fully integrated, serverless, and scalable PostgreSQL solution. It removes the hassle of managing a separate database server.
Prisma: Enables database operations using type-safe JavaScript/TypeScript functions (prisma.product.findMany(...)) instead of writing raw SQL. This speeds up development, reduces errors, and makes database schema management (migrations) significantly easier.
Vercel Blob (File Storage):
Role: Stores static files like product images.
Why it was chosen: Storing images in a database or Git repository is inefficient. Vercel Blob is a fast (CDN-enabled), cost-effective, and optimized solution for such files. Like DATABASE_URL, its management is simplified through Vercel integration. The Product table in the database only stores the URL of the image.
Database Schema (prisma/schema.prisma)
code
Prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Product {
  id          String     @id @default(cuid())
  name        String
  category    String
  brand       String
  price       Float
  rating      Float
  weight_kg   Float
  cpu         String
  ram_gb      Int
  storage_gb  Int
  screen_inch Float
  battery_wh  Int
  image_url   String
  favoritedBy Favorite[]

  @@index([category])
  @@index([brand])
  @@index([price])
}

model User {
  id        String     @id @default(cuid())
  email     String     @unique
  name      String?
  password  String
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  favorites Favorite[]
}

model Favorite {
  userId    String
  productId String
  createdAt DateTime @default(now())
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, productId])
}

model AiLog {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  prompt    String   @db.Text
  response  String   @db.Text
  modelUsed String
}
Getting Started Locally
Prerequisites
Node.js (v18 or later)
npm / yarn / pnpm
Installation Steps
Clone the repository:
code
Bash
git clone https://github.com/alihanerman/ai-product-explorer.git
cd ai-product-explorer
Install dependencies:
code
Bash
npm install
Set Up Environment Variables:
Create a file named .env.local in the root directory.
Copy the contents of the .env.example template below, paste it into your .env.local file, and fill in your own values.
.env.example (Template)
code
Env
# Vercel Postgres connection string.
# Automatically generated when you add the Postgres integration to your Vercel project.
DATABASE_URL=""

# Vercel Blob Storage read-write token.
# Automatically generated when you add the Blob integration to your Vercel project.
BLOB_READ_WRITE_TOKEN=""

# API key from Google AI Studio (for Gemini).
# Get yours at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=""

# Secret key for signing JWT (JSON Web Tokens).
# Should be a strong, random string. You can generate one with `openssl rand -base64 32`.
JWT_SECRET=""

# The full URL for the site in the development environment.
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
Prepare the Database:
Push the schema to your database:
code
Bash
npx prisma db push
Seed the database with initial data (products and a test user):
code
Bash
npx prisma db seed
Run the Development Server:
code
Bash
npm run dev
The application will now be running at http://localhost:3000.
Available Scripts
npm run dev: Starts the development server.
npm run build: Builds the project for production.
npm run start: Starts the production server.
npm run lint: Runs ESLint for code analysis.
npm run test: Runs unit tests with Jest.
npm run test:e2e: Runs end-to-end tests with Playwright.
npm run prisma:generate: Generates/updates the Prisma Client.
npm run prisma:migrate: Creates a new database migration.
npm run prisma:studio: Opens Prisma Studio.
Testing
The project is thoroughly tested with both unit and end-to-end tests. For detailed information, please see the TESTING.md file.
Unit Tests: npm run test
End-to-End Tests: npm run test:e2e
Deployment on Vercel
This project is optimized for deployment on the Vercel platform.
Fork the project to your own GitHub account.
Create a new project on Vercel and connect your GitHub repository.
Vercel will automatically detect the Next.js project and configure the build settings.
Integrations: From the Vercel project dashboard, add the Vercel Postgres and Vercel Blob integrations. This will automatically link the required DATABASE_URL and BLOB_READ_WRITE_TOKEN environment variables to your project.
Environment Variables: In your Vercel project settings, add the JWT_SECRET and GEMINI_API_KEY variables.
Pushing to your Git repository will automatically trigger a new deployment.