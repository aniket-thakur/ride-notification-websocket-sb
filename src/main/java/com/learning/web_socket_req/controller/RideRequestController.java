package com.learning.web_socket_req.controller;
import com.learning.web_socket_req.config.WebSocketSessionHandler;
import com.learning.web_socket_req.dto.DriverStatus;
import com.learning.web_socket_req.dto.RideRejectedDto;
import com.learning.web_socket_req.dto.RideRequestDto;
import com.learning.web_socket_req.dto.RideAcceptDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.sql.Timestamp;
import java.util.Map;


@Controller
@RestController
@RequestMapping("api/v1/")
public class RideRequestController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    @Autowired
    private WebSocketSessionHandler sessionHandler;

    // Driver connects
    @MessageMapping("/driver.connect")
    @SendTo("/topic/public")
    public DriverStatus driverConnect(@Payload DriverStatus status, SimpMessageHeaderAccessor headerAccessor) {
        String sessionID = headerAccessor.getSessionId();
        Long driverId = status.getDriverId();
        String driverName = status.getDriverName();
        sessionHandler.putDriverIdWithSession(driverId, sessionID);
        System.out.println("Driver connected: " + driverName);
        headerAccessor.getSessionAttributes().put("driverId", driverId);
        return status;
    }

    // Driver disconnects
    @MessageMapping("/driver.disconnect")
    @SendTo("/topic/public")
    public DriverStatus driverDisconnect(@Payload DriverStatus status) {
        System.out.println("Driver disconnected: " + status.getDriverName());
        return status;
    }

    // Accept ride
    @MessageMapping("/ride.accept")
    public void acceptRide(@Payload RideAcceptDto response) {
        String requestId = response.getRequestId();
        Long bookingId = response.getBookingId();
        Long driverId = response.getDriverId();
        String driverName = response.getDriverName();
        String status = String.valueOf(response.getStatus());
        Timestamp timestamp = response.getTimestamp();
        System.out.println("Ride accepted by: " + driverId);
        System.out.println("Info:");
        System.out.println("Request id: " + requestId + " Booking id: " + bookingId +
                " Status: " + status + " Timestamp: " + timestamp);
        messagingTemplate.convertAndSend("/topic/ride/removed", bookingId);
    }

    // Decline ride
    @MessageMapping("/ride.decline")
    public void declineRide(@Payload RideRejectedDto response) {
        System.out.println("Ride declined: " + response);
    }

    // Session based routing using session id
    //:TODO Will be using principal and only allowing authenticated drivers
    private MessageHeaders headersForSession(String sessionId) {
        SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
        headerAccessor.setSessionId(sessionId);
        headerAccessor.setLeaveMutable(true);
        return headerAccessor.getMessageHeaders();
    }

    // Method to send ride request to specific driver
    @PostMapping("/notify")
    public String sendRideRequestToDriver(@RequestBody RideRequestDto request) {
        System.out.println("Request" + request.toString());
        Map<Long, String> activeDrivers = sessionHandler.getAllConnectedDrivers();
        for (Map.Entry<Long, String> e : activeDrivers.entrySet()) {
            Long driverId = e.getKey();
            String sessionId = e.getValue();
            messagingTemplate.convertAndSendToUser(
                    sessionId,
                    "/queue/rideRequest",
                    request,
                    headersForSession(sessionId)
            );
        }
        return "Sent to all drivers";
    }

}


