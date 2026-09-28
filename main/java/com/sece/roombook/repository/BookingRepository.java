package com.sece.roombook.repository;

import com.sece.roombook.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByRoom_IdAndBookingDate(
            Long roomId,
            LocalDate bookingDate
    );

    List<Booking> findByEmployee_Id(
            Long employeeId
    );
}