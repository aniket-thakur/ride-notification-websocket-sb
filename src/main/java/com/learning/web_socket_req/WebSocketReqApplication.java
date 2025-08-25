package com.learning.web_socket_req;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;

@SpringBootApplication
@EntityScan("com.learning.entityService.models")
public class WebSocketReqApplication {

	public static void main(String[] args) {
		SpringApplication.run(WebSocketReqApplication.class, args);
	}

}
