// Test script to check backend deployment
// Run this in browser console on your deployed site

console.log('=== Backend Health Check ===');

// Get the API URL from your app
const API_URL = 'https://your-railway-backend-url.railway.app/api'; // UPDATE THIS

// Test 1: Health Check
fetch(`${API_URL}/health`)
    .then(res => res.json())
    .then(data => {
        console.log('✅ Health Check:', data);
    })
    .catch(err => {
        console.error('❌ Health Check Failed:', err);
    });

// Test 2: Try creating album (requires auth token)
const token = localStorage.getItem('token');
if (token) {
    console.log('Found auth token, testing album creation...');

    fetch(`${API_URL}/albums`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            name: 'Debug Test Album',
            description: 'Testing from console'
        })
    })
        .then(async res => {
            const data = await res.json();
            if (res.ok) {
                console.log('✅ Album Created:', data);
            } else {
                console.error('❌ Album Creation Failed:', {
                    status: res.status,
                    statusText: res.statusText,
                    error: data
                });
            }
        })
        .catch(err => {
            console.error('❌ Network Error:', err);
        });
} else {
    console.log('⚠️  No auth token found. Please login first.');
}
