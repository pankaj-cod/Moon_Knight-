# Quick Render Backend Test

## Test 1: Health Check ✅
```bash
curl https://moon-knight-1.onrender.com/api/health
```

**Result**: Server is running and database is connected!

## Test 2: Check if Album endpoint exists

Open your browser console on the deployed site and run:

```javascript
// Test album creation (you need to be logged in first)
const token = localStorage.getItem('token');

if (!token) {
  console.log('❌ Please login first!');
} else {
  console.log('Testing album creation...');
  
  fetch('https://moon-knight-1.onrender.com/api/albums', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Test Album from Console',
      description: 'Testing deployment'
    })
  })
  .then(async res => {
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
    
    if (res.ok) {
      console.log('✅ Album created successfully!');
    } else {
      console.error('❌ Error:', data);
    }
  })
  .catch(err => {
    console.error('❌ Network error:', err);
  });
}
```

## Most Likely Issue

The Render deployment probably doesn't have the latest `server.js` code or the database migrations haven't been run.

## Quick Fix Steps

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Find your service**: `moon-knight-1`
3. **Click "Manual Deploy"** → **"Deploy latest commit"**
4. **Watch the logs** for migration messages
5. **Test again** after deployment completes

## If Manual Deploy Doesn't Work

You may need to update the build/start commands. See the full guide in the artifacts.

### Build Command Should Be:
```
cd moon_backend && npm install && npx prisma generate
```

### Start Command Should Be:
```
cd moon_backend && npx prisma migrate deploy && node server.js
```
