// Create a test ambulance request directly in the database to verify the system works
const path = require('path');
const fs = require('fs');

async function createTestAmbulanceRequest() {
  try {
    // We'll create a test request directly in the database
    // Patient ID 2 is shivam288e@gmail.com
    const testRequest = {
      patient_user_id: 2,
      pickup_address: '123 Test Emergency Street, Test City, 12345',
      destination_address: 'City General Hospital',
      emergency_type: 'Heart Attack',
      patient_condition: 'Test Patient: Shivam Anand, Age: 25, Gender: Male. Experiencing severe chest pain and shortness of breath.',
      contact_number: '8709356155',
      status: 'pending',
      priority: 'high',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating test ambulance request:', testRequest);
    
    // Instructions to manually insert into database
    console.log(`
To manually create this ambulance request, run this SQL in the database:

INSERT INTO ambulance_requests (
  patient_user_id, pickup_address, destination_address, emergency_type,
  patient_condition, contact_number, status, priority, created_at, updated_at
) VALUES (
  2,
  '${testRequest.pickup_address}',
  '${testRequest.destination_address}',
  '${testRequest.emergency_type}',
  '${testRequest.patient_condition}',
  '${testRequest.contact_number}',
  'pending',
  'high',
  datetime('now'),
  datetime('now')
);
    `);

  } catch (error) {
    console.error('Error:', error);
  }
}

createTestAmbulanceRequest();
