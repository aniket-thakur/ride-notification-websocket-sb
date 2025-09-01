package com.learning.web_socket_req.dto;

import lombok.*;

import java.sql.Timestamp;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RideAcceptDto {
  private String requestId;
  private Long bookingId;
  private Long driverId;
  private String driverName;
  private Status status;
  private Timestamp timestamp;
}
