package com.sece.roombook.controller;

import com.sece.roombook.dto.RoomDTO;
import com.sece.roombook.entity.Room;
import com.sece.roombook.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping
    public ResponseEntity<Room> addRoom(
         @Valid @RequestBody RoomDTO dto) {

        return ResponseEntity.ok(
                roomService.addRoom(dto)
        );
    }

    @GetMapping
    public ResponseEntity<List<Room>> getAllRooms() {

        return ResponseEntity.ok(
                roomService.getAllRooms()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Room> getRoomById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                roomService.getRoomById(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Room> updateRoom(
            @PathVariable Long id,
             @RequestBody RoomDTO dto) {

        return ResponseEntity.ok(
                roomService.updateRoom(id, dto)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteRoom(
            @PathVariable Long id) {

        roomService.deleteRoom(id);

        return ResponseEntity.ok(
                "Room deleted successfully"
        );
    }
}