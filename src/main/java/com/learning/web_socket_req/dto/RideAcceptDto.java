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
  private String bookingId;
  private String driverId;
  private Status status;
  private Timestamp timestamp;
}
