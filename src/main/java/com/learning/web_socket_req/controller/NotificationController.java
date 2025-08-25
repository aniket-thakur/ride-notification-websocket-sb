package com.learning.web_socket_req.controller;

import com.learning.web_socket_req.dto.ChatDto;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

/*
For chat APP only (As of now not in use)
 */


@Controller
public class NotificationController {
    // Sends chat messages to everyone in the chat room
    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatDto sendMessage(@Payload ChatDto chatMessage){
        System.out.println("Reached...");
        System.out.println(chatMessage);
        return chatMessage;
    }

    // Adds a new user to the chat session
    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatDto addUser(@Payload ChatDto chatMessage, SimpMessageHeaderAccessor headerAccessor){
        System.out.println("User added reached");
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        return chatMessage;
    }
}
