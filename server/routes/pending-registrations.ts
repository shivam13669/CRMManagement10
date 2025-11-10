import { RequestHandler } from "express";
import { 
  getPendingRegistrations,
  approvePendingRegistration,
  rejectPendingRegistration 
} from '../database';

// Get all pending registrations (admin only)
export const handleGetPendingRegistrations: RequestHandler = async (req, res) => {
  try {
    const { role } = (req as any).user;
    
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can view pending registrations' });
    }

    const pendingRegistrations = getPendingRegistrations();
    
    res.json({
      registrations: pendingRegistrations,
      total: pendingRegistrations.length
    });
  } catch (error) {
    console.error('Get pending registrations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Approve pending registration (admin only)
export const handleApprovePendingRegistration: RequestHandler = async (req, res) => {
  try {
    const { role, userId } = (req as any).user;
    const { registrationId } = req.params;
    const { adminNotes } = req.body;
    
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can approve registrations' });
    }

    const success = await approvePendingRegistration(
      parseInt(registrationId), 
      userId, 
      adminNotes
    );

    if (success) {
      res.json({ 
        message: 'Registration approved successfully. User can now sign in.' 
      });
    } else {
      res.status(400).json({ error: 'Failed to approve registration' });
    }
  } catch (error) {
    console.error('Approve registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reject pending registration (admin only)
export const handleRejectPendingRegistration: RequestHandler = async (req, res) => {
  try {
    const { role, userId } = (req as any).user;
    const { registrationId } = req.params;
    const { adminNotes } = req.body;
    
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can reject registrations' });
    }

    if (!adminNotes || adminNotes.trim() === '') {
      return res.status(400).json({ error: 'Admin notes are required for rejection' });
    }

    const success = rejectPendingRegistration(
      parseInt(registrationId), 
      userId, 
      adminNotes
    );

    if (success) {
      res.json({ 
        message: 'Registration rejected successfully.' 
      });
    } else {
      res.status(400).json({ error: 'Failed to reject registration' });
    }
  } catch (error) {
    console.error('Reject registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
