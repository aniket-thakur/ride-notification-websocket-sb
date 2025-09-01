package com.learning.web_socket_req.config;
import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;


@Component
public class WebSocketSessionHandler {
    // store session by driver id
    private final Map<Long, String> driverSession = new ConcurrentHashMap<>();

    public void putDriverIdWithSession(Long driverId, String sessionId){
        driverSession.put(driverId,sessionId);
    }

    public Map<Long,String> getAllConnectedDrivers(){
        return driverSession;
    }
}


