# 🚂 Railway Deployment Troubleshooting Guide

## 🔧 Test Credentials Issue Resolution

If the test credentials `trainer@test.com` / `123456` and `client@test.com` / `123456` are not working, follow these steps:

### Step 1: Verify Users Exist
```bash
railway run npm run check-users
```

This will check if the test users exist and verify their passwords.

### Step 2: Create/Fix Test Users
If users don't exist or passwords are wrong, run:
```bash
railway run npm run seed-production
```

### Step 3: Verify Environment Variables
Make sure these environment variables are set in Railway dashboard:

**Required Variables:**
```env
NODE_ENV=production
JWT_SECRET=fitness-scheduler-jwt-super-secure-production-key-2024
JWT_EXPIRES_IN=1h
NEXTAUTH_SECRET=fitness-scheduler-nextauth-production-secret-2024
ENCRYPTION_KEY=fitness-scheduler-encryption-production-key-32
```

**Database:**
- `DATABASE_URL` should be automatically set by Railway PostgreSQL service

### Step 4: Check Database Connection
```bash
railway run npx prisma migrate status
```

If migrations haven't run:
```bash
railway run npx prisma migrate deploy
```

### Step 5: Manual User Creation (Emergency)
If the seed script fails, you can manually create users:

```bash
railway run node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createUser() {
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  // Create trainer
  const trainer = await prisma.user.upsert({
    where: { email: 'trainer@test.com' },
    update: { password: hashedPassword },
    create: {
      email: 'trainer@test.com',
      password: hashedPassword,
      name: 'Test Trainer',
      role: 'TRAINER',
      isActive: true,
    }
  });
  
  // Create client
  const client = await prisma.user.upsert({
    where: { email: 'client@test.com' },
    update: { password: hashedPassword },
    create: {
      email: 'client@test.com',
      password: hashedPassword,
      name: 'Test Client',
      role: 'CLIENT',
      isActive: true,
    }
  });
  
  console.log('Users created:', { trainer: trainer.email, client: client.email });
  await prisma.$disconnect();
}

createUser().catch(console.error);
"
```

## 🚨 Common Issues

### Issue 1: "Invalid credentials"
**Symptoms:** Login fails with correct test credentials
**Solutions:**
1. Check if users exist: `railway run npm run check-users`
2. Verify password hashing: Run seed script again
3. Check rate limiting: Wait 15 minutes if too many attempts

### Issue 2: "Database connection failed"
**Symptoms:** Can't connect to database
**Solutions:**
1. Check `DATABASE_URL` in Railway dashboard
2. Verify PostgreSQL service is running
3. Run migrations: `railway run npx prisma migrate deploy`

### Issue 3: "JWT token invalid"
**Symptoms:** Login succeeds but redirects fail
**Solutions:**
1. Check `JWT_SECRET` environment variable
2. Verify cookie settings in production
3. Check browser console for errors

### Issue 4: "Build fails during deployment"
**Symptoms:** Deployment stops during build phase
**Solutions:**
1. Check build logs: `railway logs`
2. Verify all dependencies are in package.json
3. Check if database is available during build

### Issue 5: "Seed script fails"
**Symptoms:** `npm run seed-production` throws errors
**Solutions:**
1. Check database connection
2. Run migrations first: `npx prisma migrate deploy`
3. Check for existing data conflicts

## 📊 Debugging Commands

### Check Application Status
```bash
railway status
railway logs --tail
```

### Database Operations
```bash
railway run npx prisma studio          # Open database GUI
railway run npx prisma db push         # Push schema changes
railway run npx prisma migrate status  # Check migration status
```

### Test API Endpoints
```bash
# Health check
curl https://your-app.railway.app/api/health

# Login test
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"trainer@test.com","password":"123456"}'
```

### Environment Check
```bash
railway run node -e "console.log('NODE_ENV:', process.env.NODE_ENV)"
railway run node -e "console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)"
railway run node -e "console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET)"
```

## 🔄 Complete Reset Process

If everything is broken, follow this complete reset:

1. **Delete and recreate Railway services:**
   ```bash
   railway delete
   railway init
   railway add  # Add PostgreSQL
   ```

2. **Set environment variables** (see Step 3 above)

3. **Deploy fresh:**
   ```bash
   railway up
   ```

4. **Run migrations and seed:**
   ```bash
   railway run npx prisma migrate deploy
   railway run npm run seed-production
   ```

5. **Verify:**
   ```bash
   railway run npm run check-users
   ```

## 📞 Still Having Issues?

If none of the above solutions work:

1. Check Railway dashboard for service health
2. Review complete logs: `railway logs --tail`
3. Verify PostgreSQL service is healthy
4. Check the application URL is accessible
5. Test with curl commands to isolate frontend vs backend issues

**Emergency Contact Information:**
- Railway Status: https://status.railway.app/
- Railway Discord: https://discord.gg/railway
- Check project logs for specific error messages