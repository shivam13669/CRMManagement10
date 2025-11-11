// Debug utilities for troubleshooting API and authentication issues

export const debugUtils = {
  // Clear all authentication data and reload page
  clearAuthAndReload(): void {
    console.log('🧹 Clearing all authentication data...');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    sessionStorage.clear();
    console.log('✅ Authentication data cleared, reloading page...');
    window.location.reload();
  },

  // Log current authentication state
  logAuthState(): void {
    console.log('🔍 Current authentication state:');
    console.log('Token:', localStorage.getItem('authToken'));
    console.log('Role:', localStorage.getItem('userRole'));
    console.log('User:', localStorage.getItem('userName'));
  },

  // Test API connectivity
  async testApiConnectivity(): Promise<void> {
    console.log('🔌 Testing API connectivity...');
    
    try {
      // Test basic ping endpoint
      const pingResponse = await fetch('/api/ping');
      const pingData = await pingResponse.json();
      console.log('✅ Ping test:', pingData);

      // Test authentication if token exists
      const token = localStorage.getItem('authToken');
      if (token) {
        console.log('🔑 Testing authenticated endpoint...');
        const authResponse = await fetch('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (authResponse.ok) {
          const authData = await authResponse.json();
          console.log('✅ Auth test successful:', authData);
        } else {
          console.log('❌ Auth test failed:', authResponse.status, authResponse.statusText);
          console.log('🧹 Token may be expired, clearing auth data...');
          this.clearAuthAndReload();
        }
      } else {
        console.log('ℹ️ No auth token found');
      }
    } catch (error) {
      console.error('❌ API connectivity test failed:', error);
    }
  },

  // Reset fetch function in case it's been overridden
  resetFetch(): void {
    console.log('🔄 Resetting fetch function...');
    // Store original fetch if it exists
    const originalFetch = (window as any).__originalFetch || window.fetch;
    if (originalFetch) {
      window.fetch = originalFetch;
      console.log('✅ Fetch function reset');
    } else {
      console.log('⚠️ Original fetch not found');
    }
  },

  // Full debug reset
  async fullDebugReset(): Promise<void> {
    console.log('🔧 Starting full debug reset...');
    this.resetFetch();
    this.clearAuthAndReload();
  }
};

// Make debug utils available globally for browser console
(window as any).debugUtils = debugUtils;

console.log('🛠️ Debug utilities loaded. Use debugUtils.fullDebugReset() to fix authentication issues.');
