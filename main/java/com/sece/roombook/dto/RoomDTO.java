package com.sece.roombook.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public class RoomDTO {

    @NotBlank(message = "Room name is required")
    private String roomName;

    @NotBlank(message = "Location is required")
    private String location;

    @Positive(message = "Capacity must be greater than 0")
    private int capacity;

    private boolean projector;

    private boolean whiteboard;

    private String status;

    public RoomDTO() {
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public boolean isProjector() {
        return projector;
    }

    public void setProjector(boolean projector) {
        this.projector = projector;
    }

    public boolean isWhiteboard() {
        return whiteboard;
    }

    public void setWhiteboard(boolean whiteboard) {
        this.whiteboard = whiteboard;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}