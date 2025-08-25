package com.learning.web_socket_req.dto;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class RideRejectedDto {
    private String driverId;
    private Status status;
}

