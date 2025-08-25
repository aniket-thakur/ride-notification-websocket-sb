package com.learning.web_socket_req.config;
import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;


@Component
public class WebSocketSessionHandler {
    // store session by driver id
    private final Map<String, String> driverSession = new ConcurrentHashMap<>();

    public void putDriverIdWithSession(String driverId, String sessionId){
        driverSession.put(driverId,sessionId);
    }

    public Map<String,String> getAllConnectedDrivers(){
        return driverSession;
    }
}


