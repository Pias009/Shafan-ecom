#!/usr/bin/env node

console.log("=== E-commerce Diagnostic Check ===\n");

// Check 1: Environment variables
console.log("1. Checking environment variables...");
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'MASTER_LOCK_ID',
  'SECRET_LOCK_PATH'
];

let missingEnvVars = [];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingEnvVars.push(envVar);
  }
}

if (missingEnvVars.length > 0) {
  console.log(`❌ Missing environment variables: ${missingEnvVars.join(', ')}`);
} else {
  console.log("✅ All required environment variables are set");
}

// Check 2: Database connection
console.log("\n2. Testing database connection...");
try {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  // Try a simple query
  await prisma.$queryRaw`SELECT 1 as test`;
  console.log("✅ Database connection successful");
  
  // Check if required tables exist
  const tables = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `;
  console.log(`✅ Database has ${tables.length} tables`);
  
  await prisma.$disconnect();
} catch (error) {
  console.log(`❌ Database connection failed: ${error.message}`);
}

// Check 3: API route availability
console.log("\n3. Checking API route structure...");
const fs = require('fs');
const path = require('path');

function countApiRoutes(dir) {
  let count = 0;
  if (fs.existsSync(dir)) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        count += countApiRoutes(fullPath);
      } else if (item.name === 'route.ts' || item.name === 'route.js') {
        count++;
      }
    }
  }
  return count;
}

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
if (fs.existsSync(apiDir)) {
  const routeCount = countApiRoutes(apiDir);
  console.log(`✅ Found ${routeCount} API route files`);
} else {
  console.log("❌ API directory not found");
}

// Check 4: Check for TypeScript errors
console.log("\n4. Checking for TypeScript compilation errors...");
try {
  const { execSync } = require('child_process');
  const result = execSync('npx tsc --noEmit --skipLibCheck', { 
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log("✅ No TypeScript errors found");
} catch (error) {
  if (error.status !== 0) {
    console.log("❌ TypeScript compilation errors found");
    console.log(error.stdout.substring(0, 500) + '...');
  }
}

// Check 5: Check middleware configuration
console.log("\n5. Checking middleware configuration...");
const middlewarePath = path.join(__dirname, '..', 'middleware.ts');
if (fs.existsSync(middlewarePath)) {
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  const hasMatcher = middlewareContent.includes('matcher');
  const hasAuthCheck = middlewareContent.includes('auth') || middlewareContent.includes('next-auth');
  
  console.log(`✅ Middleware file exists`);
  console.log(`   - Has matcher: ${hasMatcher ? '✅' : '⚠️'}`);
  console.log(`   - Has auth check: ${hasAuthCheck ? '✅' : '⚠️'}`);
} else {
  console.log("❌ Middleware file not found");
}

// Check 6: Check for incomplete minisites
console.log("\n6. Checking minisites implementation...");
const minisites = [
  { name: 'Kuwait Admin', path: 'src/pages/admin/kuwait' },
  { name: 'UAE Admin', path: 'src/app/ueadmin' }
];

for (const site of minisites) {
  const sitePath = path.join(__dirname, '..', site.path);
  if (fs.existsSync(sitePath)) {
    const files = fs.readdirSync(sitePath);
    console.log(`✅ ${site.name}: Found ${files.length} files`);
  } else {
    console.log(`⚠️ ${site.name}: Directory not found`);
  }
}

// Check 7: Check for broken API endpoints
console.log("\n7. Checking for potentially broken API endpoints...");
const potentiallyBrokenEndpoints = [
  { path: '/api/master/[...path]', issue: 'Requires MASTER_LOCK_ID env var' },
  { path: '/api/admin/products', issue: 'Requires admin authentication' },
  { path: '/api/kuwait/orders', issue: 'Uses Pages Router API (legacy)' },
  { path: '/api/store/[storeCode]/inventory', issue: 'Uses Pages Router API (legacy)' }
];

console.log("Potentially problematic endpoints:");
for (const endpoint of potentiallyBrokenEndpoints) {
  console.log(`   - ${endpoint.path}: ${endpoint.issue}`);
}

console.log("\n=== Diagnostic Complete ===");
console.log("\nRecommendations:");
console.log("1. Start the development server: npm run dev");
console.log("2. Test API endpoints with proper authentication");
console.log("3. Check database migrations: npx prisma db push");
console.log("4. Verify environment variables are set correctly");