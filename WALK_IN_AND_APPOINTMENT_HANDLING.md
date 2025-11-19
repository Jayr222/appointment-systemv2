# Walk-In Appointments vs Regular Appointments - Handling Guide

## Overview

The system handles both **regular booked appointments** and **walk-in appointments** seamlessly in a unified queue system. Here's how they work together:

## Key Differences

### Regular Booked Appointments
- **Created by:** Patients via booking system
- **When:** Scheduled in advance (any future date/time)
- **Availability Check:** ✅ Checks break times, availability, conflicts
- **Status:** Starts as `pending`, then `confirmed` when doctor approves
- **Patient Arrival:** Patient must arrive and check in manually
- **Visit Type:** `booking`
- **Priority:** Usually `regular`, but can be adjusted

### Walk-In Appointments
- **Created by:** Admins (front desk staff)
- **When:** Same day only (current time)
- **Availability Check:** ⚠️ Checks but allows override for emergencies
- **Status:** Automatically `confirmed` upon creation
- **Patient Arrival:** Automatically marked as arrived
- **Visit Type:** `walk-in`
- **Priority:** Can be set to `regular`, `priority`, or `emergency`

## Queue Priority System

The system uses a **smart scoring algorithm** to prioritize patients in the queue:

```
Total Score = Priority Weight + Proximity Score + Waiting Time
```

### 1. Priority Level Weights
- **Emergency:** 1000 points
- **Priority:** 500 points
- **Regular:** 0 points

### 2. Proximity Score (Only for Booked Appointments)
- **Purpose:** Gives preference to booked appointments near their scheduled time
- **Calculation:** Higher score when appointment time is close/overdue
- **Range:** 0-300 points
- **Note:** Walk-ins get 0 proximity points (no scheduled time)

### 3. Waiting Time Score
- **Purpose:** Prevents patients from waiting too long
- **Calculation:** Based on time since check-in
- **Range:** 0-200 points
- **Applies to:** Both walk-ins and bookings

## How They Work Together

### 1. Queue Display
Both walk-ins and booked appointments appear in the same queue, sorted by:
1. **Priority Score** (highest first)
2. **Queue Number** (lower number = earlier in queue)

### 2. Automatic Queue Assignment
- **Walk-ins:** Automatically get a queue number when created (patient already arrived)
- **Bookings:** Get queue number when patient arrives and checks in

### 3. Late Booking Conversion
- If a booked appointment is **10+ minutes late** and patient hasn't arrived:
  - Automatically converts to `walk-in` type
  - This prevents booked slots from being held indefinitely

### 4. Conflict Prevention

#### Walk-Ins
- ✅ Checks for break times (allows override with warning)
- ✅ Checks for existing appointments (tries next available slot)
- ✅ Checks hospital hours (blocks outside 8 AM - 5 PM)
- ✅ Attempts to find available slot within 20 minutes
- ⚠️ Can override break times for emergencies (with warning)

#### Regular Appointments
- ✅ Checks for break times (blocks booking)
- ✅ Checks for existing appointments (blocks booking)
- ✅ Checks hospital hours (blocks booking)
- ✅ Checks doctor unavailability (blocks booking)

## Workflow Examples

### Scenario 1: Regular Booking
1. Patient books appointment for "2:00 PM tomorrow"
2. System checks availability (no conflicts)
3. Appointment created with status `pending`
4. Doctor confirms → status becomes `confirmed`
5. Patient arrives tomorrow at 1:50 PM
6. Admin confirms arrival → `patientArrived: true`
7. Queue number assigned automatically
8. Appointment appears in queue with proximity boost

### Scenario 2: Walk-In
1. Patient walks in at 10:30 AM today
2. Admin creates walk-in appointment
3. System checks current time slot (10:30 AM)
4. If available → created immediately
5. If not available → tries 10:31 AM, 10:32 AM, etc. (up to 20 attempts)
6. If break time → allows with warning
7. Appointment created with `patientArrived: true`
8. Queue number assigned immediately
9. Appears in queue (prioritized by priority level only)

### Scenario 3: Mixed Queue Priority
**Queue has:**
- Walk-in Emergency (Score: 1000 + 30 wait = 1030)
- Booked Appointment at 2:00 PM (now 1:55 PM) Regular (Score: 0 + 290 proximity + 10 wait = 300)
- Walk-in Priority (Score: 500 + 45 wait = 545)
- Booked Appointment at 3:00 PM (now 1:55 PM) Regular (Score: 0 + 30 proximity + 0 wait = 30)

**Order in Queue:**
1. Walk-in Emergency (1030) ← Called first
2. Walk-in Priority (545)
3. Booked Appointment at 2:00 PM (300) ← Close to scheduled time
4. Booked Appointment at 3:00 PM (30)

## Visual Indicators

In the queue display:
- **Regular Bookings:** Show scheduled time prominently
- **Walk-Ins:** Show current time as appointment time
- **Priority Levels:** Color-coded badges (Regular/Priority/Emergency)
- **Queue Status:** Waiting/Called/In-Progress/Served

## Conflict Resolution

### When Both Types Conflict:

1. **Same Time Slot:**
   - Walk-in will try to find next available slot (within 20 minutes)
   - If no slot found → Error message to admin
   - Regular booking is blocked at booking time

2. **Break Times:**
   - Regular bookings: **Blocked** (cannot book during breaks)
   - Walk-ins: **Allowed** (emergency override) with warning

3. **Doctor Unavailable:**
   - Regular bookings: **Blocked** (cannot book)
   - Walk-ins: **Allowed** (emergency override) with warning

## Best Practices

1. **Walk-Ins for Emergencies:** Use emergency priority to jump queue
2. **Regular Bookings:** Encourage advance booking for predictable schedule
3. **Late Arrivals:** System automatically converts late bookings to walk-ins
4. **Break Times:** Consider walk-in requests carefully (may disturb break)

## Key Files

- **Queue Logic:** `backend/src/services/queueService.js`
- **Walk-In Creation:** `backend/src/controllers/adminController.js` (createWalkInAppointment)
- **Regular Booking:** `backend/src/controllers/patientController.js` (bookAppointment)
- **Availability Check:** `backend/src/services/appointmentService.js` (checkAvailability)
- **Queue Display:** `frontend/src/components/shared/QueueDisplay.jsx`

## Summary

✅ **Unified Queue:** Both types appear in same queue
✅ **Smart Prioritization:** Emergency/priority always first, then proximity for bookings
✅ **Conflict Prevention:** Walk-ins find available slots automatically
✅ **Break Time Handling:** Walk-ins can override (with warning) for emergencies
✅ **Late Conversion:** Late bookings auto-convert to walk-ins
✅ **Auto-Queue Assignment:** Queue numbers assigned when patient arrives

Both systems work together harmoniously to ensure patients are seen in the right order while handling both scheduled and emergency situations.

