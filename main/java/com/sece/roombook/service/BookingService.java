package com.sece.roombook.service;

import com.sece.roombook.dto.BookingDTO;
import com.sece.roombook.entity.Booking;
import com.sece.roombook.entity.Employee;
import com.sece.roombook.entity.Room;
import com.sece.roombook.repository.BookingRepository;
import com.sece.roombook.repository.EmployeeRepository;
import com.sece.roombook.repository.RoomRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final EmployeeRepository employeeRepository;

    public BookingService(
            BookingRepository bookingRepository,
            RoomRepository roomRepository,
            EmployeeRepository employeeRepository) {

        this.bookingRepository = bookingRepository;
        this.roomRepository = roomRepository;
        this.employeeRepository = employeeRepository;
    }

    // =====================================================
    // CREATE BOOKING
    // =====================================================

    public Booking addBooking(BookingDTO dto) {

        if (!dto.getStartTime().isBefore(dto.getEndTime())) {
            throw new RuntimeException(
                    "Start time must be before end time"
            );
        }

        Room room = roomRepository.findById(dto.getRoomId())
                .orElseThrow(() ->
                        new RuntimeException("Room not found"));

        Employee employee =
                employeeRepository.findById(dto.getEmployeeId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Employee not found"));

        List<Booking> existingBookings =
                bookingRepository.findByRoom_IdAndBookingDate(
                        dto.getRoomId(),
                        dto.getBookingDate()
                );

        // Conflict detection
        for (Booking existing : existingBookings) {

            if (!"CONFIRMED".equals(existing.getStatus())) {
                continue;
            }

            boolean overlap =
                    dto.getStartTime()
                            .isBefore(existing.getEndTime())
                            &&
                            dto.getEndTime()
                                    .isAfter(existing.getStartTime());

            if (overlap) {
                throw new RuntimeException(
                        "Room is already booked during this time slot"
                );
            }
        }

        Booking booking = new Booking();

        booking.setRoom(room);
        booking.setEmployee(employee);
        booking.setBookingDate(dto.getBookingDate());
        booking.setStartTime(dto.getStartTime());
        booking.setEndTime(dto.getEndTime());
        booking.setPurpose(dto.getPurpose());

        booking.setStatus("CONFIRMED");
        booking.setCheckedIn(false);

        return bookingRepository.save(booking);
    }


    // =====================================================
    // GET ALL BOOKINGS
    // =====================================================

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }


    // =====================================================
    // GET BOOKING BY ID
    // =====================================================

    public Booking getBookingById(Long id) {

        return bookingRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Booking not found"));
    }


    // =====================================================
    // GET ROOM BOOKINGS
    // =====================================================

    public List<Booking> getRoomBookings(
            Long roomId,
            java.time.LocalDate date) {

        return bookingRepository
                .findByRoom_IdAndBookingDate(
                        roomId,
                        date
                );
    }


    // =====================================================
    // GET EMPLOYEE BOOKINGS
    // =====================================================

    public List<Booking> getEmployeeBookings(
            Long employeeId) {

        return bookingRepository
                .findByEmployee_Id(employeeId);
    }


    // =====================================================
    // CHECK ROOM AVAILABILITY
    // =====================================================

    public boolean isRoomAvailable(
            Long roomId,
            java.time.LocalDate date,
            java.time.LocalTime startTime,
            java.time.LocalTime endTime) {

        if (!startTime.isBefore(endTime)) {
            return false;
        }

        List<Booking> bookings =
                bookingRepository
                        .findByRoom_IdAndBookingDate(
                                roomId,
                                date
                        );

        for (Booking booking : bookings) {

            if (!"CONFIRMED".equals(booking.getStatus())) {
                continue;
            }

            boolean overlap =
                    startTime.isBefore(
                            booking.getEndTime()
                    )
                            &&
                            endTime.isAfter(
                                    booking.getStartTime()
                            );

            if (overlap) {
                return false;
            }
        }

        return true;
    }


    // =====================================================
    // UPDATE BOOKING
    // =====================================================

    public Booking updateBooking(
            Long id,
            BookingDTO dto) {

        Booking booking = getBookingById(id);

        if (!"CONFIRMED".equals(booking.getStatus())) {
            throw new RuntimeException(
                    "Only confirmed bookings can be updated"
            );
        }

        if (!dto.getStartTime().isBefore(dto.getEndTime())) {
            throw new RuntimeException(
                    "Start time must be before end time"
            );
        }

        Room room = roomRepository.findById(dto.getRoomId())
                .orElseThrow(() ->
                        new RuntimeException("Room not found"));

        Employee employee =
                employeeRepository.findById(dto.getEmployeeId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Employee not found"));

        List<Booking> existingBookings =
                bookingRepository
                        .findByRoom_IdAndBookingDate(
                                dto.getRoomId(),
                                dto.getBookingDate()
                        );

        for (Booking existing : existingBookings) {

            // Don't compare the booking with itself
            if (existing.getId().equals(id)) {
                continue;
            }

            if (!"CONFIRMED".equals(existing.getStatus())) {
                continue;
            }

            boolean overlap =
                    dto.getStartTime()
                            .isBefore(existing.getEndTime())
                            &&
                            dto.getEndTime()
                                    .isAfter(existing.getStartTime());

            if (overlap) {
                throw new RuntimeException(
                        "Room is already booked during this time slot"
                );
            }
        }

        booking.setRoom(room);
        booking.setEmployee(employee);
        booking.setBookingDate(dto.getBookingDate());
        booking.setStartTime(dto.getStartTime());
        booking.setEndTime(dto.getEndTime());
        booking.setPurpose(dto.getPurpose());

        return bookingRepository.save(booking);
    }


    // =====================================================
    // CANCEL BOOKING
    // =====================================================

    public Booking cancelBooking(Long id) {

        Booking booking = getBookingById(id);

        if (!"CONFIRMED".equals(booking.getStatus())) {
            throw new RuntimeException(
                    "Only confirmed bookings can be cancelled"
            );
        }

        if (booking.isCheckedIn()) {
            throw new RuntimeException(
                    "Checked-in bookings cannot be cancelled"
            );
        }

        booking.setStatus("CANCELLED");

        return bookingRepository.save(booking);
    }


    // =====================================================
    // CHECK-IN
    // =====================================================

    public Booking checkInBooking(Long id) {

        Booking booking = getBookingById(id);

        if (!"CONFIRMED".equals(booking.getStatus())) {
            throw new RuntimeException(
                    "Only confirmed bookings can be checked in"
            );
        }

        if (booking.isCheckedIn()) {
            throw new RuntimeException(
                    "Employee has already checked in"
            );
        }

        booking.setCheckedIn(true);

        return bookingRepository.save(booking);
    }


    // =====================================================
    // DELETE BOOKING
    // =====================================================

    public void deleteBooking(Long id) {

        if (!bookingRepository.existsById(id)) {
            throw new RuntimeException("Booking not found");
        }

        bookingRepository.deleteById(id);
    }


    // =====================================================
    // AUTOMATIC NO-SHOW RELEASE
    // =====================================================

    @Scheduled(fixedRate = 60000)
    public void releaseNoShowBookings() {

        List<Booking> bookings =
                bookingRepository.findAll();

        LocalDateTime now = LocalDateTime.now();

        for (Booking booking : bookings) {

            if (!"CONFIRMED".equals(booking.getStatus())) {
                continue;
            }

            if (booking.isCheckedIn()) {
                continue;
            }

            LocalDateTime releaseTime =
                    LocalDateTime.of(
                            booking.getBookingDate(),
                            booking.getStartTime()
                    ).plusMinutes(10);

            if (now.isAfter(releaseTime)) {

                booking.setStatus("RELEASED");

                bookingRepository.save(booking);
            }
        }
    }
}