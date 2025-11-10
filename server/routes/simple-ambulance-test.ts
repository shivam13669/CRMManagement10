import { RequestHandler } from "express";

// Simple test endpoint that mimics the exact format expected by frontend
export const handleSimpleAmbulanceTest: RequestHandler = async (req, res) => {
  try {
    console.log('🔍 Simple ambulance test endpoint called');
    
    // Return a simple response in the exact format the frontend expects
    const mockResponse = {
      requests: [
        {
          id: 1,
          pickup_address: "123 Test Emergency Street, Test City, 12345",
          destination_address: "City General Hospital, Emergency Department", 
          emergency_type: "Heart Attack",
          patient_condition: "Test Patient: Shivam Anand, Age: 25, Gender: Male. Experiencing severe chest pain and shortness of breath. Patient is conscious but in distress.",
          contact_number: "8709356155",
          status: "pending",
          priority: "high",
          notes: null,
          created_at: "2025-01-15 11:00:00",
          assigned_staff_name: null,
          assigned_staff_phone: null
        }
      ],
      total: 1
    };

    console.log('✅ Returning mock ambulance request:', mockResponse);
    
    res.json(mockResponse);

  } catch (error) {
    console.error('❌ Error in simple ambulance test:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to test simple ambulance',
      details: error.message 
    });
  }
};
