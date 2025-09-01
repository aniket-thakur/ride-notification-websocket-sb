'use strict';

// DOM Elements
const usernamePage = document.querySelector('#username-page');
const dashboardPage = document.querySelector('#dashboard-page');
const usernameForm = document.querySelector('#usernameForm');
const driverIdInput = document.querySelector('#driverId');
const driverNameInput = document.querySelector('#name');
const notificationArea = document.querySelector('#notificationArea');
const connectionStatus = document.querySelector('#connectionStatus');
const statusText = document.querySelector('#statusText');
const driverNameElement = document.querySelector('#driverName');
const userAvatar = document.querySelector('#userAvatar');

// WebSocket variables
let stompClient = null;
let driverId = null;
let driverName = null;
let sessionId = null;
let rideRequests = new Map(); // Store active ride requests

// Connect to WebSocket
function connect(event) {
    event.preventDefault();

    driverId = driverIdInput.value.trim();
    driverName = driverNameInput.value.trim();

    if(driverId) {
        // Update UI
        usernamePage.classList.add('hidden');
        dashboardPage.classList.remove('hidden');
        connectionStatus.classList.remove('hidden');

        // Update driver info
        driverNameElement.textContent = driverName;
        userAvatar.textContent = driverName.charAt(0).toUpperCase();

        // Connect to WebSocket
        const socket = new SockJS('http://localhost:8778/ws');
        stompClient = Stomp.over(socket);

        // Reduce debug output
        stompClient.debug = null;

        updateConnectionStatus('connecting');
        stompClient.connect({driverId:driverId}, onConnected, onError);
    }
}

// Successfully connected to WebSocket
function onConnected() {
    console.log('Connected to WebSocket');
    updateConnectionStatus('connected');

    // Subscribe to user-specific queue for ride requests
    stompClient.subscribe('/user/queue/rideRequest', onRideRequestReceived);

    // Subscribe to broadcast channel for public messages
    stompClient.subscribe('/topic/public', onPublicMessageReceived);

    //Subscribe to broadcast channel for public message
    stompClient.subscribe('/topic/ride/removed',onRideRequestRemoved)

    // Notify server that driver is online
    stompClient.send("/app/driver.connect",
        {},
        JSON.stringify({
            driverId: driverId,
            driverName : driverName,
            status: 'ONLINE',
            timestamp: new Date().toISOString()
        })
    );
}

// WebSocket connection error
function onError(error) {
    console.error('WebSocket connection error:', error);
    updateConnectionStatus('disconnected');

    setTimeout(() => {
        statusText.textContent = 'Connection failed. Please refresh to retry.';
    }, 2000);
}

// Handle incoming ride requests
function onRideRequestReceived(payload) {
    const rideRequest = JSON.parse(payload.body);
    console.log('New ride request received:', rideRequest);

    // Store the request using bookingId
    const bookingId = rideRequest.bookingId;
    console.log('Booking id: ', bookingId);
    rideRequests.set(String(bookingId), rideRequest);

    // Display the request
    displayRideRequest(rideRequest);
}

// Handle ride request removed
function onRideRequestRemoved(payload){
    const bookingId = JSON.parse(payload.body);
    // Update UI
    const requestElement = document.getElementById(`request-${bookingId}`);
    // Remove after 1 seconds
    setTimeout(() => {
        requestElement.style.opacity = '0';
        setTimeout(() => {
            requestElement.remove();
            checkEmptyState();
        }, 300);
    }, 1000);

    // Remove from local storage
    rideRequests.delete(bookingId);
    console.log(`Removed ride with booking ID: ${bookingId} as someone Accepted it`);
 }

// Handle public messages (driver status updates)
function onPublicMessageReceived(payload) {
    const message = JSON.parse(payload.body);
    console.log('Public message:', message);

    // Handle driver status updates
    if (message.driverId && message.status) {
        console.log(`Driver ${message.driverName} is ${message.status}`);
    }
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance.toFixed(1); // Return distance in km with 1 decimal
}

// Calculate estimated fare based on distance
function calculateEstimatedFare(distance) {
    const baseRate = 5; // Base fare
    const perKmRate = 2.5; // Rate per kilometer
    const fare = baseRate + (distance * perKmRate);
    return fare.toFixed(2);
}

// Convert coordinates to address string (mock function - in real app, use reverse geocoding API)
function getLocationString(point) {
    // In a real application, you would use a reverse geocoding API
    // For now, we'll display the coordinates
    return `${point.latitude.toFixed(4)}°, ${point.longitude.toFixed(4)}°`;
}

// Display ride request in UI
function displayRideRequest(request) {
    // Clear empty state if this is the first request
    if (notificationArea.querySelector('.empty-state')) {
        notificationArea.innerHTML = '';
    }

    // Calculate distance and fare
    const distance = calculateDistance(
        request.pickupLocation.latitude,
        request.pickupLocation.longitude,
        request.dropLocation.latitude,
        request.dropLocation.longitude
    );
    const estimatedFare = calculateEstimatedFare(distance);

    const requestElement = document.createElement('div');
    requestElement.className = 'ride-request';
    requestElement.id = `request-${request.bookingId}`;


    requestElement.innerHTML = `
        <div class="ride-header">
            <span class="ride-type">Booking #${request.bookingId}</span>
            <span class="ride-time">${formatTime(new Date())}</span>
        </div>
        <div class="ride-details">
            <div class="ride-info">
                <i>🔖</i>
                <span><strong>Booking ID:</strong> ${request.bookingId}</span>
            </div>
            <div class="ride-info pickup-location">
                <i>📍</i>
                <div>
                    <strong>Pickup Location:</strong><br>
                    <span style="font-size: 14px; color: #666;">
                        Lat: ${request.pickupLocation.latitude.toFixed(6)},
                        Lng: ${request.pickupLocation.longitude.toFixed(6)}
                    </span>
                </div>
            </div>
            <div class="ride-info drop-location">
                <i>🎯</i>
                <div>
                    <strong>Drop Location:</strong><br>
                    <span style="font-size: 14px; color: #666;">
                        Lat: ${request.dropLocation.latitude.toFixed(6)},
                        Lng: ${request.dropLocation.longitude.toFixed(6)}
                    </span>
                </div>
            </div>
            <div class="ride-info">
                <i>📏</i>
                <span><strong>Distance:</strong> ${distance} km</span>
            </div>
            <div class="ride-info">
                <i>💵</i>
                <span><strong>Estimated Fare:</strong> $${estimatedFare}</span>
            </div>
        </div>
        <div class="ride-actions">
            <button id = "accept-btn" class="btn btn-accept" onclick="acceptRide('${request.bookingId}')">
                ✓ Accept Ride
            </button>
            <button class="btn btn-decline" onclick="declineRide('${request.bookingId}')">
                ✗ Decline
            </button>
        </div>
    `;

    // Add some custom styling for better location display
    const style = document.createElement('style');
    if (!document.getElementById('custom-ride-styles')) {
        style.id = 'custom-ride-styles';
        style.innerHTML = `
            .pickup-location {
                background: rgba(33, 150, 243, 0.05);
                padding: 10px;
                border-radius: 8px;
                margin: 10px 0;
            }
            .drop-location {
                background: rgba(76, 175, 80, 0.05);
                padding: 10px;
                border-radius: 8px;
                margin: 10px 0;
            }
            .ride-info div {
                flex: 1;
            }
        `;
        document.head.appendChild(style);
    }

    notificationArea.insertBefore(requestElement, notificationArea.firstChild);
}

// Accept ride request
function acceptRide(bookingId) {
    console.log('Booking id from event: ', bookingId)
    console.log(rideRequests);
    const request = rideRequests.get(bookingId);
    console.log("Accept ride hit with booking id as: ", request);

    if (request && stompClient) {
        // Send acceptance to server
        stompClient.send("/app/ride.accept",
            {},
            JSON.stringify({
                requestId: bookingId.toString(), // Using bookingId as requestId
                bookingId: bookingId,
                driverId: driverId,
                driverName: driverName,
                status: 'ACCEPTED',
                timestamp: new Date().toISOString()
            })
        );

        // Update UI
        const requestElement = document.getElementById(`request-${bookingId}`);
        if (requestElement) {
            requestElement.style.borderLeftColor = '#4CAF50';
            requestElement.querySelector('.ride-actions').innerHTML = `
                <div style="text-align: center; color: #4CAF50; font-weight: 600;">
                    ✓ Ride Accepted - Booking #${bookingId}
                    <br>
                    <span style="font-size: 14px; font-weight: normal;">
                        Navigate to pickup location
                    </span>
                </div>
            `;

            // Remove after 3 seconds
            setTimeout(() => {
                requestElement.style.opacity = '0';
                setTimeout(() => {
                    requestElement.remove();
                    checkEmptyState();
                }, 300);
            }, 3000);
        }

        // Remove from local storage
        rideRequests.delete(bookingId);

        console.log(`Accepted ride with booking ID: ${bookingId}`);
    }
}

// Decline ride request
function declineRide(bookingId) {
    const request = rideRequests.get(bookingId);

    if (request && stompClient) {
        // Send decline to server
        stompClient.send("/app/ride.decline",
            {},
            JSON.stringify({
                requestId: bookingId.toString(), // Using bookingId as requestId
                bookingId: bookingId,
                driverId: driverId,
                driverName: driverName,
                reason: 'Driver unavailable',
                timestamp: new Date().toISOString()
            })
        );

        // Update UI
        const requestElement = document.getElementById(`request-${bookingId}`);
        if (requestElement) {
            requestElement.style.borderLeftColor = '#f44336';
            requestElement.querySelector('.ride-actions').innerHTML = `
                <div style="text-align: center; color: #f44336; font-weight: 600;">
                    ✗ Ride Declined - Booking #${bookingId}
                </div>
            `;

            // Remove after 2 seconds
            setTimeout(() => {
                requestElement.style.opacity = '0';
                setTimeout(() => {
                    requestElement.remove();
                    checkEmptyState();
                }, 300);
            }, 2000);
        }

        // Remove from local storage
        rideRequests.delete(bookingId);

        console.log(`Declined ride with booking ID: ${bookingId}`);
    }
}

// Check if notification area is empty and show empty state
function checkEmptyState() {
    if (notificationArea.children.length === 0) {
        notificationArea.innerHTML = `
            <div class="empty-state">
                <p>No ride requests at the moment</p>
                <p style="font-size: 14px; margin-top: 10px;">New requests will appear here automatically</p>
            </div>
        `;
    }
}

// Disconnect from WebSocket
function disconnect() {
    if (stompClient && stompClient.connected) {
        // Notify server that driver is going offline
        stompClient.send("/app/driver.disconnect",
            {},
            JSON.stringify({
                driverId: driverId,
                driverName: driverName,
                status: 'OFFLINE',
                timestamp: new Date().toISOString()
            })
        );

        stompClient.disconnect(() => {
            console.log('Disconnected from WebSocket');
        });
    }

    // Reset UI
    dashboardPage.classList.add('hidden');
    usernamePage.classList.remove('hidden');
    connectionStatus.classList.add('hidden');
    notificationArea.innerHTML = `
        <div class="empty-state">
            <p>No ride requests at the moment</p>
            <p style="font-size: 14px; margin-top: 10px;">New requests will appear here automatically</p>
        </div>
    `;

    // Clear data
    driverId = null;
    sessionId = null;
    rideRequests.clear();
}

// Update connection status indicator
function updateConnectionStatus(status) {
    connectionStatus.className = 'connection-status';

    switch(status) {
        case 'connecting':
            connectionStatus.classList.add('connecting');
            statusText.textContent = 'Connecting...';
            break;
        case 'connected':
            connectionStatus.classList.add('connected');
            statusText.textContent = 'Connected';
            setTimeout(() => {
                connectionStatus.classList.add('hidden');
            }, 3000);
            break;
        case 'disconnected':
            connectionStatus.classList.add('disconnected');
            statusText.textContent = 'Disconnected';
            break;
    }
}

// Format timestamp
function formatTime(timestamp) {
    if (!timestamp) return 'Just now';

    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // difference in seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;

    return date.toLocaleTimeString();
}

// Event listeners
usernameForm.addEventListener('submit', connect);

// Handle page refresh/close
window.addEventListener('beforeunload', () => {
    if (stompClient && stompClient.connected) {
        disconnect();
    }
});

// Make functions globally available for onclick handlers
window.acceptRide = acceptRide;
window.declineRide = declineRide;
window.disconnect = disconnect;