package com.sece.roombook.service;

import com.sece.roombook.dto.RoomDTO;
import com.sece.roombook.entity.Room;
import com.sece.roombook.repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoomService {

    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public Room addRoom(RoomDTO dto) {

        Room room = new Room();

        room.setRoomName(dto.getRoomName());
        room.setLocation(dto.getLocation());
        room.setCapacity(dto.getCapacity());
        room.setProjector(dto.isProjector());
        room.setWhiteboard(dto.isWhiteboard());
        room.setStatus(dto.getStatus());

        return roomRepository.save(room);
    }

    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    public Room getRoomById(Long id) {

        return roomRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Room not found"));
    }

    public Room updateRoom(Long id, RoomDTO dto) {

        Room room = getRoomById(id);

        room.setRoomName(dto.getRoomName());
        room.setLocation(dto.getLocation());
        room.setCapacity(dto.getCapacity());
        room.setProjector(dto.isProjector());
        room.setWhiteboard(dto.isWhiteboard());
        room.setStatus(dto.getStatus());

        return roomRepository.save(room);
    }

    public void deleteRoom(Long id) {

        if (!roomRepository.existsById(id)) {
            throw new RuntimeException("Room not found");
        }

        roomRepository.deleteById(id);
    }
}