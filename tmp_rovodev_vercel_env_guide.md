# Vercel Environment Variables Setup

## Required Environment Variables for Vercel:

### 1. Database (already configured):
```
DATABASE_URL=postgres://5984afadeb7d742c91bbddf2a80b0d464ecebc94f33e017a44e69a2ad2503581:sk_y-Q26F9I8DRkB0hfzBQ-s@db.prisma.io:5432/?sslmode=require
```

### 2. Blob Storage (already configured):
```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_nJZWlJH5hbgbdvlU_RPipqDELoZvdRgQqOaMhBaIdAw4zAa
```

### 3. JWT Secret (NEW - add this):
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random
```

### 4. OpenRouter API Key (NEW - add this):
```
OPENROUTER_API_KEY=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
```

### 5. Site URL (NEW - add this):
```
NEXT_PUBLIC_SITE_URL=https://your-vercel-app-url.vercel.app
```

## How to add to Vercel:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add each variable above

## Note:
- The DATABASE_URL and BLOB_READ_WRITE_TOKEN are already configured from your existing setup
- You only need to add the JWT_SECRET, OPENROUTER_API_KEY, and NEXT_PUBLIC_SITE_URL
- Make sure to generate a strong JWT_SECRET for production