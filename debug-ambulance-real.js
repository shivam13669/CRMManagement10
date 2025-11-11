// Debug script to test ambulance functionality in real-time
const fetch = require('node-fetch'); // Add this if running in Node

const BASE_URL = 'http://localhost:8080';

async function debugAmbulanceIssue() {
  console.log('🚑 DEBUGGING AMBULANCE ISSUE');
  console.log('=' .repeat(50));

  // Step 1: Check database state
  console.log('\n📊 Step 1: Checking database...');
  try {
    const response = await fetch(`${BASE_URL}/api/debug/database`);
    const data = await response.json();
    
    console.log(`✅ Database stats:`);
    console.log(`   Users: ${data.stats.users}`);
    console.log(`   Patients: ${data.stats.patients}`);
    console.log(`   Ambulance requests: ${data.ambulanceRequests?.length || 0}`);
    
    // Find the patient we're testing with
    const patient = data.users?.find(u => u.email === 'shivam288e@gmail.com');
    if (patient) {
      console.log(`\n✅ Found patient: ${patient.full_name} (ID: ${patient.id})`);
    }
    
    // Show existing ambulance requests
    if (data.ambulanceRequests && data.ambulanceRequests.length > 0) {
      console.log('\n📋 Existing ambulance requests:');
      data.ambulanceRequests.forEach(req => {
        console.log(`   - Request #${req.id}: Patient ID ${req.patient_user_id}, ${req.emergency_type} (${req.status})`);
      });
    } else {
      console.log('\n⚠️  No ambulance requests found in database');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }

  // Step 2: Test login to get auth token
  console.log('\n🔐 Step 2: Testing login...');
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'shivam288e@gmail.com',
        password: 'password123' // Common test password
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log(`✅ Login successful! User ID: ${loginData.user.userId}, Role: ${loginData.user.role}`);
      
      const authToken = loginData.token;
      const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      };

      // Step 3: Test getting patient's ambulance requests
      console.log('\n📋 Step 3: Testing patient ambulance requests endpoint...');
      const patientRequestsResponse = await fetch(`${BASE_URL}/api/ambulance/patient`, { headers });
      
      if (patientRequestsResponse.ok) {
        const patientData = await patientRequestsResponse.json();
        console.log(`✅ Patient requests API working: ${patientData.requests.length} requests found`);
        
        if (patientData.requests.length > 0) {
          patientData.requests.forEach(req => {
            console.log(`   - Request #${req.id}: ${req.emergency_type} (${req.status})`);
          });
        } else {
          console.log('   📝 No requests found for this patient - this explains why UI is empty!');
        }
      } else {
        const errorData = await patientRequestsResponse.json();
        console.log(`❌ Patient requests API failed: ${patientRequestsResponse.status} - ${errorData.error}`);
      }

      // Step 4: Test creating an ambulance request
      console.log('\n🆕 Step 4: Creating test ambulance request...');
      const createResponse = await fetch(`${BASE_URL}/api/ambulance`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pickup_address: '123 Test Street, Test City, 12345',
          destination_address: 'City Hospital',
          emergency_type: 'Heart Attack',
          patient_condition: 'Test Patient: Shivam Anand, Age: 25, Gender: Male. Condition: Chest pain and difficulty breathing.',
          contact_number: '8709356155',
          priority: 'high'
        })
      });

      if (createResponse.ok) {
        const createData = await createResponse.json();
        console.log(`✅ Ambulance request created successfully! Request ID: ${createData.requestId}`);
        
        // Test again to see if it appears
        console.log('\n🔄 Step 5: Checking requests again...');
        const checkResponse = await fetch(`${BASE_URL}/api/ambulance/patient`, { headers });
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          console.log(`✅ Now showing ${checkData.requests.length} requests for patient`);
          if (checkData.requests.length > 0) {
            console.log('🎉 SUCCESS! The ambulance request now appears in the patient\'s list');
          }
        }
      } else {
        const errorData = await createResponse.json();
        console.log(`❌ Failed to create ambulance request: ${createResponse.status} - ${errorData.error}`);
      }

    } else {
      const loginError = await loginResponse.json();
      console.log(`❌ Login failed: ${loginResponse.status} - ${loginError.error}`);
    }

  } catch (error) {
    console.error('❌ Login/API test failed:', error.message);
  }

  console.log('\n🏁 Debug complete!');
}

// Export for browser or run directly
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debugAmbulanceIssue };
} else {
  debugAmbulanceIssue();
}
