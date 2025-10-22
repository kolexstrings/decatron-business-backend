# 🚀 Decatron Business Backend - Frontend API Implementation Guide

This comprehensive guide provides everything frontend developers need to implement the complete property management system. Copy this file to your frontend project and use it as your implementation reference.

---

## 📋 Table of Contents
- [Configuration](#-configuration)
- [Authentication](#-authentication)
- [Properties Management](#-properties-management)
- [Booking System](#-booking-system)
- [Availability Management](#-availability-management)
- [Staff Scheduling](#-staff-scheduling)
- [Inspection System](#-inspection-system)
- [Location Tracking & Map Functionality](#️-location-tracking--map-functionality)
- [Feedback System](#-feedback-system)
- [Analytics Dashboard](#-analytics-dashboard)
- [Error Handling](#-error-handling)
- [Common Patterns](#-common-patterns)

---

## ⚙️ Configuration

### Base URLs
```javascript
const API_BASE_URL = 'http://localhost:8080'
const AUTH_BASE_URL = `${API_BASE_URL}/auth`
const BOOKINGS_BASE_URL = `${API_BASE_URL}/bookings`
const PROPERTIES_BASE_URL = `${API_BASE_URL}/properties`
const AVAILABILITY_BASE_URL = `${API_BASE_URL}/availability`
const INSPECTIONS_BASE_URL = `${API_BASE_URL}/inspections`
const STAFF_SCHEDULES_BASE_URL = `${API_BASE_URL}/staff-schedules`
const FEEDBACK_BASE_URL = `${API_BASE_URL}/feedback`
const ANALYTICS_BASE_URL = `${API_BASE_URL}/analytics`
const LOCATIONS_BASE_URL = `${API_BASE_URL}/location`
```

### Common Headers
```javascript
const getAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
})
```

---

## 🔐 Authentication

### Login/Registration Flow
```javascript
// 1. Send OTP for verification
const sendOTP = async (email, purpose) => {
  return await fetch(`${AUTH_BASE_URL}/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, purpose }) // purpose: 'registration' | 'invite'
  })
}

// 2. Verify OTP
const verifyOTP = async (email, otp, purpose) => {
  return await fetch(`${AUTH_BASE_URL}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, purpose })
  })
}

// 3. Register Organization
const registerOrganization = async (orgData) => {
  return await fetch(`${AUTH_BASE_URL}/register-organization`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: orgData.name,
      email: orgData.email,
      password: orgData.password,
      phoneNumber: orgData.phoneNumber,
      size: orgData.size, // '1-10' | '11-50' | '51-200' | '200+'
      category: orgData.category // 'Property Development' | 'Property Management'
    })
  })
}

// 4. Login Organization
const loginOrganization = async (email, password) => {
  return await fetch(`${AUTH_BASE_URL}/login-organization`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
}

// 5. Login User (Staff/Admin/Agent)
const loginUser = async (email, password) => {
  return await fetch(`${AUTH_BASE_URL}/login-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
}
```

### User Management (Organization Only)
```javascript
// Add new user to organization
const addUser = async (token, userData) => {
  return await fetch(`${AUTH_BASE_URL}/add-user`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: userData.role // 'admin' | 'agent' | 'staff'
    })
  })
}

// Get all users in organization
const getUsers = async (token) => {
  return await fetch(`${AUTH_BASE_URL}/users`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Generate invite link for new user
const generateInvite = async (token, email, role, sendEmail = true) => {
  return await fetch(`${AUTH_BASE_URL}/generate-invite`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ email, role, sendEmail })
  })
}

// Register user via invite link
const registerUserViaInvite = async (token, username, password) => {
  return await fetch(`${AUTH_BASE_URL}/register-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, username, password })
  })
}
```

---

## 🏠 Properties Management

### Property CRUD Operations
```javascript
// Create new property (Organization only)
const createProperty = async (token, propertyData) => {
  return await fetch(`${PROPERTIES_BASE_URL}`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      title: propertyData.title,
      development_name: propertyData.developmentName,
      property_code: propertyData.propertyCode,
      floor: propertyData.floor,
      available_units: propertyData.availableUnits,
      sale_type: propertyData.saleType, // 'House' | 'Apartment' | 'Land'
      price: propertyData.price,
      area: propertyData.area,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      garage: propertyData.garage,
      kitchen: propertyData.kitchen,
      location: {
        address: propertyData.address,
        city: propertyData.city,
        state: propertyData.state,
        country: propertyData.country,
        latitude: propertyData.latitude,
        longitude: propertyData.longitude
      },
      description: propertyData.description,
      images: propertyData.images, // Array of image URLs
      status: propertyData.status // 'Available' | 'Sold' | 'Under Construction'
    })
  })
}

// Get all properties for organization
const getOrganizationProperties = async (token) => {
  return await fetch(`${PROPERTIES_BASE_URL}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Get available properties only
const getAvailableProperties = async (token) => {
  return await fetch(`${PROPERTIES_BASE_URL}/available`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Get single property details
const getProperty = async (token, propertyId) => {
  return await fetch(`${PROPERTIES_BASE_URL}/${propertyId}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Update property
const updateProperty = async (token, propertyId, propertyData) => {
  return await fetch(`${PROPERTIES_BASE_URL}/${propertyId}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(propertyData)
  })
}

// Delete property
const deleteProperty = async (token, propertyId) => {
  return await fetch(`${PROPERTIES_BASE_URL}/${propertyId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token)
  })
}
```

### Property Search & Filtering
```javascript
// Advanced property search
const searchProperties = async (token, filters) => {
  const params = new URLSearchParams({
    city: filters.city,
    state: filters.state,
    sale_type: filters.saleType,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    bedrooms: filters.bedrooms,
    status: filters.status
  })

  return await fetch(`${PROPERTIES_BASE_URL}/search?${params}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}
```

### Payment Plans Management
```javascript
// Add payment plan to property
const addPaymentPlan = async (token, propertyId, planData) => {
  return await fetch(`${PROPERTIES_BASE_URL}/${propertyId}/payment-plans`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      type: planData.type, // 'outright' | 'installment' | 'mortgage' | 'rent_to_own'
      name: planData.name,
      description: planData.description,
      schedule: {
        deposit_amount: planData.depositAmount,
        monthly_payment: planData.monthlyPayment,
        duration_months: planData.durationMonths,
        interest_rate: planData.interestRate,
        total_amount: planData.totalAmount
      },
      is_active: planData.isActive
    })
  })
}

// Update payment plan
const updatePaymentPlan = async (token, propertyId, planIndex, planData) => {
  return await fetch(`${PROPERTIES_BASE_URL}/${propertyId}/payment-plans/${planIndex}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(planData)
  })
}

// Delete payment plan
const deletePaymentPlan = async (token, propertyId, planIndex) => {
  return await fetch(`${PROPERTIES_BASE_URL}/${propertyId}/payment-plans/${planIndex}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token)
  })
}
```

---

## 📅 Booking System

### Booking Management
```javascript
// Create new booking
const createBooking = async (token, bookingData) => {
  return await fetch(`${BOOKINGS_BASE_URL}`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      propertyId: bookingData.propertyId,
      clientName: bookingData.clientName,
      clientEmail: bookingData.clientEmail,
      clientPhone: bookingData.clientPhone,
      requestedDate: bookingData.requestedDate, // YYYY-MM-DD
      preferredTimeSlot: {
        startTime: bookingData.startTime, // HH:MM
        endTime: bookingData.endTime // HH:MM
      },
      clientId: bookingData.clientId, // Optional
      source: bookingData.source, // 'web' | 'whatsapp' | 'walk_in' | 'proxy'
      priority: bookingData.priority, // 'normal' | 'urgent' | 'vip'
      duration: bookingData.duration // Minutes (15-480)
    })
  })
}

// Check availability for time slot
const checkAvailability = async (token, availabilityData) => {
  return await fetch(`${BOOKINGS_BASE_URL}/check-availability`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      propertyId: availabilityData.propertyId,
      requestedDate: availabilityData.requestedDate, // YYYY-MM-DD
      startTime: availabilityData.startTime, // HH:MM
      duration: availabilityData.duration // Minutes
    })
  })
}

// Get booking by ID
const getBooking = async (token, bookingId) => {
  return await fetch(`${BOOKINGS_BASE_URL}/${bookingId}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Get bookings by client email
const getBookingsByClient = async (token, clientEmail) => {
  return await fetch(`${BOOKINGS_BASE_URL}/client/${clientEmail}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Get bookings by status
const getBookingsByStatus = async (token, status) => {
  return await fetch(`${BOOKINGS_BASE_URL}/status/${status}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Get bookings by date range
const getBookingsByDateRange = async (token, startDate, endDate) => {
  return await fetch(`${BOOKINGS_BASE_URL}/date-range?startDate=${startDate}&endDate=${endDate}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}
```

### Booking Status Management
```javascript
// Update booking status
const updateBookingStatus = async (token, bookingId, status, notes = '') => {
  return await fetch(`${BOOKINGS_BASE_URL}/${bookingId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ status, notes })
  })
}

// Assign staff to booking
const assignStaffToBooking = async (token, bookingId, staffId) => {
  return await fetch(`${BOOKINGS_BASE_URL}/${bookingId}/assign`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ staffId })
  })
}

// Reschedule booking
const rescheduleBooking = async (token, bookingId, newDate, newTimeSlot) => {
  return await fetch(`${BOOKINGS_BASE_URL}/${bookingId}/reschedule`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      requestedDate: newDate,
      preferredTimeSlot: newTimeSlot
    })
  })
}

// Cancel booking
const cancelBooking = async (token, bookingId, reason) => {
  return await fetch(`${BOOKINGS_BASE_URL}/${bookingId}/cancel`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ reason })
  })
}
```

---

## ⏰ Availability Management

### Schedule Management
```javascript
// Get availability schedule
const getAvailabilitySchedule = async (token, scheduleId) => {
  return await fetch(`${AVAILABILITY_BASE_URL}/${scheduleId}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Create availability schedule
const createAvailabilitySchedule = async (token, scheduleData) => {
  return await fetch(`${AVAILABILITY_BASE_URL}`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      name: scheduleData.name,
      description: scheduleData.description,
      isActive: scheduleData.isActive,
      // Weekly schedule configuration
      monday: {
        isAvailable: scheduleData.monday.isAvailable,
        timeSlots: scheduleData.monday.timeSlots // Array of {startTime, endTime}
      },
      tuesday: { /* same structure */ },
      wednesday: { /* same structure */ },
      thursday: { /* same structure */ },
      friday: { /* same structure */ },
      saturday: { /* same structure */ },
      sunday: { /* same structure */ }
    })
  })
}

// Update availability schedule
const updateAvailabilitySchedule = async (token, scheduleId, scheduleData) => {
  return await fetch(`${AVAILABILITY_BASE_URL}/${scheduleId}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(scheduleData)
  })
}

// Get available time slots for specific date
const getAvailableTimeSlots = async (token, date, propertyId = null) => {
  const params = propertyId ? `?date=${date}&propertyId=${propertyId}` : `?date=${date}`
  return await fetch(`${AVAILABILITY_BASE_URL}/time-slots${params}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Check staff availability
const checkStaffAvailability = async (token, staffId, date) => {
  return await fetch(`${AVAILABILITY_BASE_URL}/staff/${staffId}/availability?date=${date}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}
```

---

## 👥 Staff Scheduling

### Staff Schedule Management
```javascript
// Create staff schedule
const createStaffSchedule = async (token, scheduleData) => {
  return await fetch(`${STAFF_SCHEDULES_BASE_URL}`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      staffId: scheduleData.staffId,
      weeklySchedule: scheduleData.weeklySchedule, // Array of daily schedules
      isActive: scheduleData.isActive,
      maxConcurrentInspections: scheduleData.maxConcurrentInspections,
      preferredInspectionDuration: scheduleData.preferredInspectionDuration,
      maxTravelTime: scheduleData.maxTravelTime,
      workArea: {
        center: {
          latitude: scheduleData.centerLat,
          longitude: scheduleData.centerLng
        },
        radius: scheduleData.radius
      }
    })
  })
}

// Get staff schedule
const getStaffSchedule = async (token, scheduleId) => {
  return await fetch(`${STAFF_SCHEDULES_BASE_URL}/${scheduleId}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Update staff schedule
const updateStaffSchedule = async (token, scheduleId, scheduleData) => {
  return await fetch(`${STAFF_SCHEDULES_BASE_URL}/${scheduleId}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(scheduleData)
  })
}

// Get staff schedules for organization
const getStaffSchedules = async (token) => {
  return await fetch(`${STAFF_SCHEDULES_BASE_URL}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Get schedule conflicts
const getScheduleConflicts = async (token, startDate, endDate) => {
  return await fetch(`${STAFF_SCHEDULES_BASE_URL}/conflicts?startDate=${startDate}&endDate=${endDate}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}
```

### Weekly Schedule Structure
```javascript
// Example weekly schedule for a staff member
const weeklySchedule = [
  {
    dayOfWeek: 1, // Monday (0 = Sunday, 6 = Saturday)
    isWorking: true,
    startTime: '09:00',
    endTime: '17:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    maxInspections: 8
  },
  {
    dayOfWeek: 2, // Tuesday
    isWorking: true,
    startTime: '09:00',
    endTime: '17:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    maxInspections: 8
  },
  // ... other days
]
```

---

## 🔍 Inspection System

### Inspection Management
```javascript
// Get inspection details
const getInspection = async (token, inspectionId) => {
  return await fetch(`${INSPECTIONS_BASE_URL}/${inspectionId}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Get pending inspections for staff
const getPendingInspections = async (token) => {
  return await fetch(`${INSPECTIONS_BASE_URL}/staff/pending`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Get inspections by status
const getInspectionsByStatus = async (token, status) => {
  return await fetch(`${INSPECTIONS_BASE_URL}/status/${status}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Get inspections by staff member
const getInspectionsByStaff = async (token, staffId) => {
  return await fetch(`${INSPECTIONS_BASE_URL}/staff/${staffId}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Get inspections by date range
const getInspectionsByDateRange = async (token, startDate, endDate) => {
  return await fetch(`${INSPECTIONS_BASE_URL}/date-range?startDate=${startDate}&endDate=${endDate}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}
```

### Inspection Status Updates
```javascript
// Accept inspection assignment
const acceptInspection = async (token, inspectionId) => {
  return await fetch(`${INSPECTIONS_BASE_URL}/${inspectionId}/accept`, {
    method: 'PUT',
    headers: getAuthHeaders(token)
  })
}

// Reject inspection assignment
const rejectInspection = async (token, inspectionId, reason) => {
  return await fetch(`${INSPECTIONS_BASE_URL}/${inspectionId}/reject`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ reason })
  })
}

// Start inspection
const startInspection = async (token, inspectionId) => {
  return await fetch(`${INSPECTIONS_BASE_URL}/${inspectionId}/start`, {
    method: 'PUT',
    headers: getAuthHeaders(token)
  })
}

// Complete inspection
const completeInspection = async (token, inspectionId, inspectionData) => {
  return await fetch(`${INSPECTIONS_BASE_URL}/${inspectionId}/complete`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      duration: inspectionData.duration,
      outcome: inspectionData.outcome,
      notes: inspectionData.notes,
      recommendations: inspectionData.recommendations
    })
  })
}

// Reassign inspection to different staff
const reassignInspection = async (token, inspectionId, newStaffId, reason) => {
  return await fetch(`${INSPECTIONS_BASE_URL}/${inspectionId}/reassign`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ newStaffId, reason })
  })
}
```

---

## 💬 Feedback System

### Staff Feedback
```javascript
// Submit staff feedback after inspection
const submitStaffFeedback = async (token, feedbackData) => {
  return await fetch(`${FEEDBACK_BASE_URL}/staff`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      inspectionId: feedbackData.inspectionId,
      purchaseLikelihood: feedbackData.purchaseLikelihood, // 1-5 rating
      clientInterest: feedbackData.clientInterest, // 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
      clientEngagement: feedbackData.clientEngagement, // 'poor' | 'fair' | 'good' | 'excellent'
      followUpRequired: feedbackData.followUpRequired,
      notes: feedbackData.notes,
      questionsAsked: feedbackData.questionsAsked,
      concernsRaised: feedbackData.concernsRaised, // Array of strings
      budgetDiscussed: feedbackData.budgetDiscussed,
      timelineDiscussed: feedbackData.timelineDiscussed
    })
  })
}

// Get staff feedback for inspection
const getStaffFeedback = async (token, inspectionId) => {
  return await fetch(`${FEEDBACK_BASE_URL}/staff/${inspectionId}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Update staff feedback
const updateStaffFeedback = async (token, inspectionId, feedbackData) => {
  return await fetch(`${FEEDBACK_BASE_URL}/staff/${inspectionId}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(feedbackData)
  })
}
```

---

## 📊 Analytics Dashboard

### Business Analytics
```javascript
// Get dashboard overview
const getDashboardOverview = async (token) => {
  return await fetch(`${ANALYTICS_BASE_URL}/dashboard`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Get property analytics
const getPropertyAnalytics = async (token, propertyId) => {
  return await fetch(`${ANALYTICS_BASE_URL}/properties/${propertyId}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Get staff performance analytics
const getStaffAnalytics = async (token, staffId = null, period = 'monthly') => {
  const url = staffId
    ? `${ANALYTICS_BASE_URL}/staff/${staffId}?period=${period}`
    : `${ANALYTICS_BASE_URL}/staff?period=${period}`

  return await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Get booking analytics
const getBookingAnalytics = async (token, period = 'monthly') => {
  return await fetch(`${ANALYTICS_BASE_URL}/bookings?period=${period}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Get revenue analytics
const getRevenueAnalytics = async (token, period = 'monthly') => {
  return await fetch(`${ANALYTICS_BASE_URL}/revenue?period=${period}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Get client analytics
const getClientAnalytics = async (token, period = 'monthly') => {
  return await fetch(`${ANALYTICS_BASE_URL}/clients?period=${period}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Get trends and insights
const getTrendsInsights = async (token) => {
  return await fetch(`${ANALYTICS_BASE_URL}/insights`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}
```

---

## 🗺️ Location Tracking & Map Functionality

### Real-time Location Updates During Inspections
```javascript
// Update real-time location during inspection
const updateLocation = async (token, inspectionId, locationData) => {
  return await fetch(`${LOCATIONS_BASE_URL}/track`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      inspectionId: inspectionId,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      accuracy: locationData.accuracy, // GPS accuracy in meters
      altitude: locationData.altitude,
      speed: locationData.speed, // Speed in km/h
      heading: locationData.heading, // Direction in degrees
      status: locationData.status, // 'traveling_to_property' | 'at_property' | 'inspection_in_progress' | 'completed'
      notes: locationData.notes
    })
  })
}

// Get location history for an inspection
const getInspectionLocationHistory = async (token, inspectionId, userType = null) => {
  const params = userType ? `?userType=${userType}` : ''
  return await fetch(`${LOCATIONS_BASE_URL}/inspection/${inspectionId}${params}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Get current locations of all parties in an inspection
const getCurrentLocations = async (token, inspectionId) => {
  return await fetch(`${LOCATIONS_BASE_URL}/inspection/${inspectionId}/current`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Get all location data for map visualization
const getMapData = async (token, inspectionId) => {
  return await fetch(`${LOCATIONS_BASE_URL}/map/${inspectionId}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  })
}

// Calculate distance and ETA between two points
const calculateDistance = async (fromLat, fromLng, toLat, toLng, mode = 'driving') => {
  return await fetch(`${LOCATIONS_BASE_URL}/distance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fromLat, fromLng, toLat, toLng, mode
    })
  })
}
---

## 🌐 WebSocket Implementation for Real-time Features

Your backend now supports **WebSocket connections** for real-time location tracking! Here's how to implement it:

### **WebSocket Setup**

**Install Socket.IO Client:**
```bash
npm install socket.io-client
```

**Frontend WebSocket Service:**
```javascript
import io from 'socket.io-client'

// WebSocket service class
class WebSocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
  }

  // Connect to WebSocket server
  connect(token) {
    if (this.socket?.connected) return

    this.socket = io('http://localhost:8080', {
      auth: {
        token: token
      }
    })

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server')
      this.isConnected = true
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server')
      this.isConnected = false
    })

    // Handle location update confirmations
    this.socket.on('location-update-confirmed', (data) => {
      console.log('Location update confirmed:', data)
    })

    // Handle location update errors
    this.socket.on('location-update-error', (error) => {
      console.error('Location update error:', error)
    })

    // Handle real-time location updates from other users
    this.socket.on('location-updated', (locationData) => {
      console.log('New location update received:', locationData)
      // Update your map/store with new location data
      this.onLocationUpdate?.(locationData)
    })

    // Handle inspection status changes
    this.socket.on('inspection-status-updated', (statusData) => {
      console.log('Inspection status updated:', statusData)
      this.onInspectionStatusUpdate?.(statusData)
    })
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.isConnected = false
    }
  }

  // Join inspection room for real-time updates
  joinInspection(inspectionId) {
    if (this.socket?.connected) {
      this.socket.emit('join-inspection', inspectionId)
    }
  }

  // Leave inspection room
  leaveInspection(inspectionId) {
    if (this.socket?.connected) {
      this.socket.emit('leave-inspection', inspectionId)
    }
  }

  // Send location update via WebSocket
  sendLocationUpdate(inspectionId, locationData) {
    if (this.socket?.connected) {
      this.socket.emit('location-update', {
        inspectionId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        altitude: locationData.altitude,
        speed: locationData.speed,
        heading: locationData.heading,
        status: locationData.status || 'inspection_in_progress',
        notes: locationData.notes
      })
    }
  }

  // Send inspection status change
  sendInspectionStatusChange(inspectionId, status) {
    if (this.socket?.connected) {
      this.socket.emit('inspection-status-change', {
        inspectionId,
        status
      })
    }
  }

  // Set callback for location updates
  onLocationUpdate(callback) {
    this.onLocationUpdate = callback
  }

  // Set callback for inspection status updates
  onInspectionStatusUpdate(callback) {
    this.onInspectionStatusUpdate = callback
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService()
```

### **React Hook for WebSocket Management**

```javascript
import { useEffect, useState } from 'react'
import { webSocketService } from '../services/webSocketService'

export const useWebSocket = (inspectionId, token) => {
  const [isConnected, setIsConnected] = useState(false)
  const [liveLocations, setLiveLocations] = useState({})

  useEffect(() => {
    if (token) {
      webSocketService.connect(token)
      setIsConnected(true)

      // Set up event listeners
      webSocketService.onLocationUpdate((locationData) => {
        setLiveLocations(prev => ({
          ...prev,
          [locationData.userId]: locationData
        }))
      })

      webSocketService.onInspectionStatusUpdate((statusData) => {
        // Handle status updates
        console.log('Inspection status updated:', statusData)
      })

      // Join inspection room
      if (inspectionId) {
        webSocketService.joinInspection(inspectionId)
      }
    }

    return () => {
      if (inspectionId) {
        webSocketService.leaveInspection(inspectionId)
      }
    }
  }, [inspectionId, token])

  const sendLocationUpdate = (locationData) => {
    if (inspectionId) {
      webSocketService.sendLocationUpdate(inspectionId, locationData)
    }
  }

  return {
    isConnected,
    liveLocations,
    sendLocationUpdate
  }
}
```

### **Complete Location Tracking Implementation**

```javascript
// LocationTrackingService.js
export class LocationTrackingService {
  constructor(inspectionId) {
    this.inspectionId = inspectionId
    this.watchId = null
    this.isTracking = false
  }

  // Start real-time location tracking
  async startTracking() {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported')
    }

    // Request location permission
    const permission = await this.requestLocationPermission()
    if (!permission) {
      throw new Error('Location permission denied')
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.isTracking = true
          this.watchId = navigator.geolocation.watchPosition(
            this.handleLocationUpdate.bind(this),
            this.handleLocationError.bind(this),
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 30000,
              distanceFilter: 10 // Update when moved 10 meters
            }
          )
          resolve(position)
        },
        (error) => {
          reject(new Error(`Failed to get initial location: ${error.message}`))
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  // Stop location tracking
  stopTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
    this.isTracking = false
  }

  // Handle location updates
  async handleLocationUpdate(position) {
    const locationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      speed: position.coords.speed,
      heading: position.coords.heading,
      status: 'inspection_in_progress',
      timestamp: new Date()
    }

    try {
      // Send via WebSocket (primary method)
      webSocketService.sendLocationUpdate(this.inspectionId, locationData)

      // Also send via HTTP API as backup
      await this.sendLocationViaHTTP(locationData)
    } catch (error) {
      console.error('Failed to send location update:', error)
    }
  }

  // Send location via HTTP API as backup
  async sendLocationViaHTTP(locationData) {
    const token = localStorage.getItem('authToken')
    if (!token) return

    try {
      await fetch(`${LOCATIONS_BASE_URL}/track`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inspectionId: this.inspectionId,
          ...locationData
        })
      })
    } catch (error) {
      console.error('HTTP location update failed:', error)
    }
  }

  // Request location permission
  async requestLocationPermission() {
    if (!navigator.permissions) return true

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      return permission.state === 'granted'
    } catch (error) {
      return true // Assume permission granted if query fails
    }
  }

  // Handle location errors
  handleLocationError(error) {
    console.error('Location error:', error)
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.error('Location permission denied')
        break
      case error.POSITION_UNAVAILABLE:
        console.error('Location position unavailable')
        break
      case error.TIMEOUT:
        console.error('Location timeout')
        break
    }
  }
}
```

### **React Component Example**

```javascript
import React, { useState, useEffect } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import { LocationTrackingService } from '../services/LocationTrackingService'

const InspectionTracker = ({ inspectionId, token }) => {
  const [locationService, setLocationService] = useState(null)
  const [isTracking, setIsTracking] = useState(false)
  const { isConnected, liveLocations } = useWebSocket(inspectionId, token)

  // Start location tracking when inspection begins
  const startInspection = async () => {
    try {
      const service = new LocationTrackingService(inspectionId)
      await service.startTracking()
      setLocationService(service)
      setIsTracking(true)

      // Update inspection status via WebSocket
      webSocketService.sendInspectionStatusChange(inspectionId, 'in_progress')

    } catch (error) {
      console.error('Failed to start inspection:', error)
    }
  }

  // Stop location tracking when inspection completes
  const completeInspection = async () => {
    try {
      if (locationService) {
        locationService.stopTracking()
        setIsTracking(false)
      }

      // Update inspection status
      webSocketService.sendInspectionStatusChange(inspectionId, 'completed')

    } catch (error) {
      console.error('Failed to complete inspection:', error)
    }
  }

  return (
    <div className="inspection-tracker">
      <div className="status-bar">
        <span>WebSocket: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</span>
        <span>Tracking: {isTracking ? '📍 Active' : '⏹️ Stopped'}</span>
      </div>

      <div className="live-locations">
        <h3>Live Locations</h3>
        {Object.keys(liveLocations).length > 0 ? (
          <div className="location-cards">
            {Object.entries(liveLocations).map(([userId, location]) => (
              <div key={userId} className="location-card">
                <p>User: {userId}</p>
                <p>Lat: {location.latitude.toFixed(6)}</p>
                <p>Lng: {location.longitude.toFixed(6)}</p>
                <p>Status: {location.status}</p>
                <p>Speed: {location.speed ? `${location.speed.toFixed(1)} km/h` : 'N/A'}</p>
                <p>Updated: {new Date(location.timestamp).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No live location updates</p>
        )}
      </div>

      <div className="controls">
        {!isTracking ? (
          <button onClick={startInspection} disabled={!isConnected}>
            Start Inspection & Tracking
          </button>
        ) : (
          <button onClick={completeInspection}>
            Complete Inspection
          </button>
        )}
      </div>
    </div>
  )
}

export default InspectionTracker
```

### **Map Integration with Real-time Updates**

```javascript
// MapComponent.js
import React, { useEffect } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'

const InspectionMap = ({ inspectionId, token }) => {
  const { liveLocations } = useWebSocket(inspectionId, token)

  useEffect(() => {
    // Initialize map (Google Maps, Mapbox, etc.)
    const map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 9.0765, lng: 8.6753 }, // Default to Abuja
      zoom: 15
    })

    // Add markers for each live location
    Object.entries(liveLocations).forEach(([userId, location]) => {
      const marker = new google.maps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        map: map,
        title: `User ${userId}`,
        icon: location.userType === 'staff' ? 'staff-icon.png' : 'client-icon.png'
      })

      // Add info window with location details
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div>
            <h4>${location.userType === 'staff' ? 'Staff' : 'Client'}</h4>
            <p>Speed: ${location.speed ? location.speed.toFixed(1) + ' km/h' : 'N/A'}</p>
            <p>Status: ${location.status}</p>
            <p>Updated: ${new Date(location.timestamp).toLocaleTimeString()}</p>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
      })
    })

  }, [liveLocations])

  return <div id="map" style={{ width: '100%', height: '400px' }} />
}

export default InspectionMap
```

### **Background Location Tracking (Mobile)**

```javascript
// BackgroundLocationService.js (React Native)
import Geolocation from 'react-native-geolocation-service'
import BackgroundTask from 'react-native-background-task'

export class BackgroundLocationService {
  constructor(inspectionId, webSocketService) {
    this.inspectionId = inspectionId
    this.webSocketService = webSocketService
    this.isTracking = false
  }

  async startBackgroundTracking() {
    // Request permissions
    const granted = await this.requestPermissions()
    if (!granted) return false

    // Start background task
    BackgroundTask.define(async () => {
      if (this.isTracking) {
        this.updateLocation()
      }
      BackgroundTask.finish()
    })

    this.isTracking = true

    // Set up location watcher
    this.watchId = Geolocation.watchPosition(
      (position) => this.handleLocationUpdate(position),
      (error) => console.error('Location error:', error),
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 15000,
        fastestInterval: 10000,
        forceRequestLocation: true,
        useSignificantChanges: false,
        showsBackgroundLocationIndicator: true,
        notificationTitle: 'Inspection Tracking Active',
        notificationText: 'Your location is being tracked during the inspection'
      }
    )

    return true
  }

  async requestPermissions() {
    try {
      const granted = await Geolocation.requestAuthorization('whenInUse')
      return granted === 'granted'
    } catch (error) {
      console.error('Permission request failed:', error)
      return false
    }
  }

  handleLocationUpdate(position) {
    const locationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      speed: position.coords.speed,
      heading: position.coords.heading,
      status: 'inspection_in_progress'
    }

    // Send via WebSocket
    this.webSocketService.sendLocationUpdate(this.inspectionId, locationData)
  }

  stopBackgroundTracking() {
    if (this.watchId) {
      Geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
    this.isTracking = false
  }
}
```

---

## **🎯 WebSocket Benefits Over Polling:**

| **Feature** | **WebSocket** | **HTTP Polling** |
|-------------|---------------|------------------|
| **Real-time** | ✅ Instant | ❌ 15-30 second delay |
| **Efficiency** | ✅ Only when needed | ❌ Continuous requests |
| **Battery Usage** | ✅ Lower | ❌ Higher |
| **Network Usage** | ✅ Lower | ❌ Higher |
| **Connection State** | ✅ Always connected | ❌ Request-response |
| **Bi-directional** | ✅ Yes | ❌ No |

**Your backend now supports both methods**, but WebSocket is recommended for the best user experience! 🚀📡
```javascript
// Start inspection with optional location tracking
const startInspection = async (token, inspectionId, options = {}) => {
  return await fetch(`${INSPECTIONS_BASE_URL}/${inspectionId}/start`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      enableLocationTracking: options.enableLocationTracking || false,
      startingLocation: options.startingLocation ? {
        latitude: options.startingLocation.latitude,
        longitude: options.startingLocation.longitude,
        accuracy: options.startingLocation.accuracy
      } : undefined
    })
  })
}

// Complete inspection with final location
const completeInspection = async (token, inspectionId, completionData) => {
  return await fetch(`${INSPECTIONS_BASE_URL}/${inspectionId}/complete`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      duration: completionData.duration,
      outcome: completionData.outcome,
      notes: completionData.notes,
      recommendations: completionData.recommendations,
      finalLocation: completionData.finalLocation ? {
        latitude: completionData.finalLocation.latitude,
        longitude: completionData.finalLocation.longitude,
        accuracy: completionData.finalLocation.accuracy
      } : undefined
    })
  })
}
```

### Standard Error Response Format
```javascript
// All API errors follow this format
{
  "error": "Error message description"
}

// HTTP Status Codes:
// 200 - Success
// 201 - Created successfully
// 400 - Bad request (invalid input)
// 401 - Unauthorized (invalid/missing token)
// 403 - Forbidden (insufficient permissions)
// 404 - Not found
// 409 - Conflict (duplicate entry)
```

### Error Handling Pattern
```javascript
const apiCall = async (url, options) => {
  try {
    const response = await fetch(url, options)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API Error:', error.message)
    throw error
  }
}

// Usage example
const login = async (email, password) => {
  try {
    const data = await apiCall(`${AUTH_BASE_URL}/login-organization`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    // Store token
    localStorage.setItem('authToken', data.token)
    return data
  } catch (error) {
    // Handle login error (show message to user)
    throw error
  }
}
```

---

## 🔄 Common Patterns

### Authentication State Management
```javascript
// Check if user is authenticated
const isAuthenticated = () => {
  const token = localStorage.getItem('authToken')
  return token && !isTokenExpired(token)
}

// Get current user info from token
const getCurrentUser = () => {
  const token = localStorage.getItem('authToken')
  if (!token) return null

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      id: payload.userId,
      organizationId: payload.organizationId,
      role: payload.role
    }
  } catch {
    return null
  }
}

// Logout
const logout = () => {
  localStorage.removeItem('authToken')
  // Redirect to login page
}
```

### API Request Wrapper
```javascript
class ApiService {
  constructor(baseURL) {
    this.baseURL = baseURL
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('authToken')
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: defaultHeaders
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return await response.json()
  }

  // Convenience methods
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return this.request(url)
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }
}

// Usage
const apiService = new ApiService('http://localhost:8080')
const authService = new ApiService('http://localhost:8080/auth')
```

---

## 📱 Implementation Priority

### Phase 1: Core Features (Week 1-2)
1. ✅ **Authentication** - Login, registration, user management
2. 🔄 **Properties** - CRUD operations, search, filtering
3. 🔄 **Basic Bookings** - Create, view, manage bookings

### Phase 2: Advanced Features (Week 3-4)
4. 🔄 **Availability Management** - Schedule setup and checking
5. 🔄 **Staff Scheduling** - Assign staff to time slots
6. 🔄 **Inspection Workflow** - Complete inspection process with location tracking
7. 🗺️ **Location Tracking & Maps** - Real-time GPS tracking and route visualization

### Phase 3: Analytics & Polish (Week 5-6)
7. 🔄 **Analytics Dashboard** - Business insights and reporting
8. 🔄 **Feedback System** - Client and staff feedback
9. 🔄 **Advanced Features** - Notifications, exports, optimizations

---

## 🎯 Next Steps

1. **Copy this file** to your frontend project
2. **Set up API service** using the patterns above
3. **Start with authentication** - login/register forms
4. **Implement property management** - property listing and CRUD
5. **Add booking system** - calendar and booking workflow
6. **Implement location tracking** - real-time GPS and map visualization
7. **Build analytics dashboard** - data visualization

This guide covers 100% of the backend API endpoints. Each section includes the exact request formats, response structures, and implementation patterns you need! 🚀

### Priority Matrix

| **Feature** | **Impact** | **Complexity** | **Priority** |
|-------------|------------|----------------|--------------|
| Property Management | High | Medium | 🔥 Critical |
| Booking System | High | High | 🔥 Critical |  
| Location Tracking & Maps | High | High | 🔥 Critical |
| Staff Scheduling | Medium | Medium | 🟡 Important |
| Analytics Dashboard | Medium | High | 🟡 Important |
| Inspection Workflow | Medium | Medium | 🟡 Important |
| Feedback System | Low | Low | 🟢 Nice to Have |
