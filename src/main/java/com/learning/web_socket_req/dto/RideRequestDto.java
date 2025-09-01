package com.learning.web_socket_req.dto;

import com.learning.entityService.models.Location;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor


public class RideRequestDto {
    private Long bookingId;
    private Location pickupLocation;
    private Location dropLocation;

}
