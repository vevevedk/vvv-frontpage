// Debug script to test authentication flow
// Run this in browser console to debug authentication issues

console.log('🔍 Debugging Authentication Flow...');

// 1. Check localStorage
console.log('📦 localStorage contents:');
console.log('accessToken:', localStorage.getItem('accessToken') ? 'EXISTS' : 'MISSING');
console.log('refreshToken:', localStorage.getItem('refreshToken') ? 'EXISTS' : 'MISSING');
console.log('user:', localStorage.getItem('user'));

// 2. Test frontend login API
async function testLogin() {
  console.log('🧪 Testing frontend login API...');
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'andreas@veveve.dk',
        password: 'avxzVvv2k25!!'
      })
    });
    
    const data = await response.json();
    console.log('Login response:', data);
    
    if (data.user) {
      console.log('✅ User data from login:', {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        email_verified: data.user.email_verified
      });
    }
  } catch (error) {
    console.error('❌ Login test failed:', error);
  }
}

// 3. Test users/me API
async function testUsersMe() {
  console.log('🧪 Testing users/me API...');
  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.log('❌ No access token found');
    return;
  }
  
  try {
    const response = await fetch('/api/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Users/me response:', data);
  } catch (error) {
    console.error('❌ Users/me test failed:', error);
  }
}

// 4. Clear localStorage
function clearStorage() {
  console.log('🗑️ Clearing localStorage...');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  console.log('✅ localStorage cleared');
}

// Run tests
console.log('🚀 Running authentication tests...');
testLogin();
testUsersMe();

// Export functions for manual testing
window.debugAuth = {
  testLogin,
  testUsersMe,
  clearStorage
};

console.log('💡 Manual commands available:');
console.log('- debugAuth.clearStorage() - Clear localStorage');
console.log('- debugAuth.testLogin() - Test login');
console.log('- debugAuth.testUsersMe() - Test users/me');
