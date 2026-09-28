package com.sece.roombook.controller;

import com.sece.roombook.dto.BookingDTO;
import com.sece.roombook.entity.Booking;
import com.sece.roombook.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // CREATE
    @PostMapping
    public ResponseEntity<Booking> addBooking(
            @Valid @RequestBody BookingDTO dto) {

        return ResponseEntity.ok(
                bookingService.addBooking(dto)
        );
    }

    // GET ALL
    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings() {

        return ResponseEntity.ok(
                bookingService.getAllBookings()
        );
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                bookingService.getBookingById(id)
        );
    }

    // GET ROOM BOOKINGS
    @GetMapping("/room/{roomId}/date/{date}")
    public ResponseEntity<List<Booking>> getRoomBookings(
            @PathVariable Long roomId,
            @PathVariable LocalDate date) {

        return ResponseEntity.ok(
                bookingService.getRoomBookings(
                        roomId,
                        date
                )
        );
    }

    // GET EMPLOYEE BOOKINGS
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Booking>> getEmployeeBookings(
            @PathVariable Long employeeId) {

        return ResponseEntity.ok(
                bookingService.getEmployeeBookings(
                        employeeId
                )
        );
    }

    // CHECK AVAILABILITY
    @GetMapping("/availability")
    public ResponseEntity<String> checkAvailability(
            @RequestParam Long roomId,
            @RequestParam LocalDate date,
            @RequestParam LocalTime startTime,
            @RequestParam LocalTime endTime) {

        boolean available =
                bookingService.isRoomAvailable(
                        roomId,
                        date,
                        startTime,
                        endTime
                );

        if (available) {
            return ResponseEntity.ok(
                    "Room is available"
            );
        }

        return ResponseEntity.ok(
                "Room is not available"
        );
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<Booking> updateBooking(
            @PathVariable Long id,
            @Valid @RequestBody BookingDTO dto) {

        return ResponseEntity.ok(
                bookingService.updateBooking(
                        id,
                        dto
                )
        );
    }

    // CANCEL
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancelBooking(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                bookingService.cancelBooking(id)
        );
    }

    // CHECK-IN
    @PutMapping("/{id}/check-in")
    public ResponseEntity<Booking> checkInBooking(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                bookingService.checkInBooking(id)
        );
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteBooking(
            @PathVariable Long id) {

        bookingService.deleteBooking(id);

        return ResponseEntity.ok(
                "Booking deleted successfully"
        );
    }
}