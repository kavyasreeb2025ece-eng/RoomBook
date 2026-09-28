// =========================================================
// ROOMBOOK - DASHBOARD JAVASCRIPT
// =========================================================

// -------------------------------
// NAVIGATION
// -------------------------------

function showSection(sectionId) {

    const sections = document.querySelectorAll(".page-section");
    const navItems = document.querySelectorAll(".nav-item");

    sections.forEach(section => {
        section.classList.remove("active-section");
    });

    const selectedSection = document.getElementById(sectionId);

    if (selectedSection) {
        selectedSection.classList.add("active-section");
    }

    navItems.forEach(item => {
        item.classList.remove("active");

        const text = item.innerText.trim().toLowerCase();

        if (
            (sectionId === "dashboard" && text.includes("dashboard")) ||
            (sectionId === "rooms" && text.includes("rooms")) ||
            (sectionId === "employees" && text.includes("employees")) ||
            (sectionId === "bookings" && text.includes("bookings")) ||
            (sectionId === "calendar" && text.includes("calendar")) ||
            (sectionId === "reports" && text.includes("reports"))
        ) {
            item.classList.add("active");
        }
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// =========================================================
// LOAD DASHBOARD
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    loadDashboard();

});


// =========================================================
// MAIN DASHBOARD LOADER
// =========================================================

async function loadDashboard() {

    try {

        await Promise.all([
            loadRooms(),
            loadEmployees(),
            loadBookings()
        ]);

    } catch (error) {

        console.error("Dashboard loading error:", error);

    }

}


// =========================================================
// LOAD ROOMS
// =========================================================

async function loadRooms() {

    try {

        const response = await fetch("/api/rooms");

        if (!response.ok) {
            throw new Error("Unable to fetch rooms");
        }

        const rooms = await response.json();

        console.log("Rooms:", rooms);

        // Total rooms
        document.getElementById("totalRooms").textContent = rooms.length;


        // Available rooms
        const availableRooms = rooms.filter(room =>
            String(room.status).toLowerCase() === "available"
        );

        document.getElementById("availableRooms").textContent =
            availableRooms.length;


        // Display rooms
        displayRooms(rooms);

    } catch (error) {

        console.error("Room API error:", error);

        document.getElementById("totalRooms").textContent = "0";
        document.getElementById("availableRooms").textContent = "0";

        document.getElementById("roomList").innerHTML = `
            <div class="loading-state">
                <span>Unable to load rooms</span>
            </div>
        `;
    }
}


// =========================================================
// DISPLAY ROOMS
// =========================================================

function displayRooms(rooms) {

    const roomList = document.getElementById("roomList");

    if (!rooms || rooms.length === 0) {

        roomList.innerHTML = `
            <div class="loading-state">
                <span>No rooms found</span>
            </div>
        `;

        return;
    }


    // Show maximum 5 rooms on dashboard
    const visibleRooms = rooms.slice(0, 5);

    roomList.innerHTML = visibleRooms.map(room => {

        const status = room.status || "Unknown";

        const isAvailable =
            String(status).toLowerCase() === "available";

        return `
            <div class="room-item">

                <div class="room-info">

                    <div class="room-avatar">
                        ▦
                    </div>

                    <div>

                        <div class="room-name">
                            ${escapeHTML(room.roomName || "Unnamed Room")}
                        </div>

                        <div class="room-location">
                            ${escapeHTML(room.location || "Location unavailable")}
                            • Capacity ${room.capacity || 0}
                        </div>

                    </div>

                </div>

                <span class="status-badge ${
            isAvailable
                ? "status-available"
                : "status-unavailable"
        }">

                    ${escapeHTML(status)}

                </span>

            </div>
        `;

    }).join("");

}


// =========================================================
// LOAD EMPLOYEES
// =========================================================

async function loadEmployees() {

    try {

        const response = await fetch("/api/employees");

        if (!response.ok) {
            throw new Error("Unable to fetch employees");
        }

        const employees = await response.json();

        console.log("Employees:", employees);

        document.getElementById("totalEmployees").textContent =
            employees.length;

    } catch (error) {

        console.error("Employee API error:", error);

        document.getElementById("totalEmployees").textContent = "0";

    }
}


// =========================================================
// LOAD BOOKINGS
// =========================================================

async function loadBookings() {

    try {

        const response = await fetch("/api/bookings");

        if (!response.ok) {
            throw new Error("Unable to fetch bookings");
        }

        const bookings = await response.json();

        console.log("Bookings:", bookings);

        document.getElementById("totalBookings").textContent =
            bookings.length;

        displayRecentBookings(bookings);

    } catch (error) {

        console.error("Booking API error:", error);

        document.getElementById("totalBookings").textContent = "0";

        document.getElementById("recentBookings").innerHTML = `
            <div class="loading-state">
                <span>Unable to load bookings</span>
            </div>
        `;
    }
}


// =========================================================
// DISPLAY RECENT BOOKINGS
// =========================================================

function displayRecentBookings(bookings) {

    const bookingList =
        document.getElementById("recentBookings");


    if (!bookings || bookings.length === 0) {

        bookingList.innerHTML = `
            <div class="loading-state">
                <span>No bookings found</span>
            </div>
        `;

        return;
    }


    // Show latest 5 bookings
    const recentBookings = [...bookings]
        .reverse()
        .slice(0, 5);


    bookingList.innerHTML = recentBookings.map(booking => {

        const date =
            booking.bookingDate || "";

        const dateParts =
            date.split("-");

        const day =
            dateParts.length === 3
                ? dateParts[2]
                : "--";

        const month =
            dateParts.length === 3
                ? getMonthName(dateParts[1])
                : "---";


        const employeeName =
            booking.employee?.name ||
            "Unknown Employee";


        const roomName =
            booking.room?.roomName ||
            "Unknown Room";


        return `
            <div class="booking-item">

                <div class="booking-date">

                    <strong>${day}</strong>
                    <span>${month}</span>

                </div>


                <div class="booking-details">

                    <div class="booking-purpose">

                        ${escapeHTML(
            booking.purpose ||
            "Room Booking"
        )}

                    </div>

                    <div class="booking-meta">

                        ${escapeHTML(employeeName)}
                        •
                        ${escapeHTML(roomName)}

                    </div>

                </div>


                <span class="status-badge ${
            getBookingStatusClass(
                booking.status
            )
        }">

                    ${escapeHTML(
            booking.status ||
            "UNKNOWN"
        )}

                </span>

            </div>
        `;

    }).join("");

}


// =========================================================
// BOOKING STATUS
// =========================================================

function getBookingStatusClass(status) {

    const value =
        String(status || "").toLowerCase();


    if (value === "confirmed") {
        return "status-available";
    }


    if (value === "cancelled") {
        return "status-unavailable";
    }


    return "status-available";
}


// =========================================================
// MONTH NAME
// =========================================================

function getMonthName(monthNumber) {

    const months = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC"
    ];

    const index =
        parseInt(monthNumber, 10) - 1;

    return months[index] || "---";
}


// =========================================================
// HTML SAFETY
// =========================================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}