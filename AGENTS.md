# Important Commands

## Development
```bash
npm run dev          # Start dev server
```

## Build & Deploy
```bash
npm run build        # Build for production
npm run start        # Start production server
```

## Database
```bash
npx prisma db push      # Push schema to DB
npx prisma generate     # Generate Prisma client
```

## Linting
```bash
npm run lint           # Run ESLint
```

## Deploy to Vercel
```bash
npm run deploy:vercel:prod
```

# Environment Variables Required

- DATABASE_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- SHIPPO_API_KEY
- ARAMEX_* (for Aramex shipping)
- NAQEL_* (for Naqel shipping)
- COURIER_API_KEY
- SYNC_SUPER_SECRET
