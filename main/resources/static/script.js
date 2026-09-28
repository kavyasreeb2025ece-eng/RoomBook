const API = {
    rooms: "/api/rooms",
    employees: "/api/employees",
    bookings: "/api/bookings"
};

const state = {
    rooms: [],
    employees: [],
    bookings: [],
    availability: {},
    page: "overview",
    roomQuery: "",
    roomStatus: "all",
    bookingStatus: "all",
    bookingDate: ""
};


/* =========================
   BASIC HELPERS
========================= */
function applyRoleAccess() {

    const role =
        sessionStorage.getItem("role");

    const loggedIn =
        sessionStorage.getItem("loggedIn");


    if (
        loggedIn !== "true" ||
        !role
    ) {

        window.location.href =
            "login.html";

        return;
    }


    const currentRole =
        role.toUpperCase();


    document
        .querySelectorAll("[data-role]")
        .forEach((element) => {

            const requiredRole =
                element.dataset.role.toUpperCase();


            if (
                currentRole ===
                requiredRole
            ) {

                element.style.display = "";

            } else {

                element.style.display = "none";

            }

        });


    const profileLabel =
        document.querySelector(
            ".profile-label"
        );


    if (profileLabel) {

        if (currentRole === "ADMIN") {

            profileLabel.textContent =
                "Admin";

        }

        else if (
            currentRole ===
            "INVOICING_USER"
        ) {

            profileLabel.textContent =
                "Invoicing User";

        }

        else {

            profileLabel.textContent =
                currentRole;

        }

    }


    const profileAvatar =
        document.querySelector(
            ".profile-avatar"
        );


    if (profileAvatar) {

        const username =
            sessionStorage.getItem(
                "username"
            ) || "User";


        profileAvatar.textContent =
            username
                .charAt(0)
                .toUpperCase();

    }
}
const byId = (id) => document.getElementById(id);

function today() {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function statusKey(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z]+/g, "-");
}

function formatDate(
    value,
    options = {
        month: "short",
        day: "numeric",
        year: "numeric"
    }
) {
    if (!value) {
        return "Date not set";
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString(
        "en-US",
        options
    );
}

function formatTime(value) {
    return value ? String(value).slice(0, 5) : "--:--";
}


/* =========================
   API REQUEST
========================= */

async function request(url, options = {}) {

    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.body
                ? { "Content-Type": "application/json" }
                : {}),
            ...(options.headers || {})
        }
    });

    const text = await response.text();

    let result = text;

    try {
        result = text ? JSON.parse(text) : null;
    } catch {
        result = text;
    }

    if (!response.ok) {

        const message =
            typeof result === "object" && result
                ? result.message ||
                result.error ||
                Object.values(result).join(" ")
                : result;

        throw new Error(
            message ||
            response.statusText ||
            "Request failed"
        );
    }

    return result;
}


/* =========================
   LOAD DATA
========================= */

async function loadData() {

    setLoading(true);

    try {

        const [rooms, employees, bookings] =
            await Promise.all([
                request(API.rooms),
                request(API.employees),
                request(API.bookings)
            ]);

        state.rooms = Array.isArray(rooms)
            ? rooms
            : [];

        state.employees = Array.isArray(employees)
            ? employees
            : [];

        state.bookings = Array.isArray(bookings)
            ? bookings
            : [];

        state.availability = {};

        renderAll();

        setLoading(false);

    } catch (error) {

        setLoading(false);

        showToast(
            error.message ||
            "RoomBook could not load its data.",
            "error"
        );

        showLoadFailure();
    }
}


/* =========================
   LOADING STATUS
========================= */

function setLoading(loading) {

    document.body.classList.toggle(
        "is-loading",
        loading
    );

    const status = byId("connectionStatus");

    if (status) {

        status.textContent =
            loading
                ? "Syncing..."
                : "Connected";

        status.classList.toggle(
            "is-loading",
            loading
        );
    }
}


/* =========================
   LOAD FAILURE
========================= */

function showLoadFailure() {

    [
        "roomCards",
        "allRoomCards",
        "todaySchedule",
        "bookingRows",
        "employeeCards"
    ].forEach((id) => {

        const container = byId(id);

        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-mark">!</span>

                <strong>
                    Could not load this section
                </strong>

                <p>
                    Please check the backend connection
                    and try again.
                </p>

                <button
                    class="button button-quiet"
                    data-action="refresh">
                    Retry
                </button>
            </div>
        `;
    });
}


/* =========================
   RENDER EVERYTHING
========================= */

function renderAll() {

    renderDate();

    renderMetrics();

    renderRoomCards();

    renderSchedule();

    renderBookings();

    renderEmployees();

    renderCounts();
}


/* =========================
   DATE
========================= */

function renderDate() {

    const label = byId("todayLabel");

    const welcomeDate = byId("welcomeDate");

    const now = new Date();

    const formatted =
        now.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric"
            }
        );

    if (label) {
        label.textContent = formatted;
    }

    if (welcomeDate) {
        welcomeDate.textContent = formatted;
    }
}


/* =========================
   ROOM STATUS
========================= */

function roomIsAvailable(room) {

    const value =
        String(
            room?.status ||
            "available"
        ).toLowerCase();

    return (
        value === "available" ||
        value === "open"
    );
}


/* =========================
   DASHBOARD METRICS
========================= */

function renderMetrics() {

    const confirmedBookings =
        state.bookings.filter(
            booking =>
                String(
                    booking.status
                ).toUpperCase() === "CONFIRMED"
        );

    const checkedIn =
        confirmedBookings.filter(
            booking =>
                booking.checkedIn === true
        ).length;

    const availableRooms =
        state.rooms.filter(
            roomIsAvailable
        ).length;

    const availableCount =
        Object.keys(state.availability).length
            ? Object.values(
                state.availability
            ).filter(Boolean).length
            : availableRooms;

    const metrics = {

        metricRooms:
        state.rooms.length,

        metricAvailable:
        availableCount,

        metricBookings:
        confirmedBookings.length,

        metricCheckins:
        checkedIn
    };

    Object.entries(metrics).forEach(
        ([id, value]) => {

            const element = byId(id);

            if (element) {
                element.textContent = value;
            }
        }
    );
}


/* =========================
   ROOM CARD
========================= */

function roomCard(room) {

    const slotResult =
        state.availability[room.id];

    const available =
        typeof slotResult === "boolean"
            ? slotResult
            : roomIsAvailable(room);

    const statusText =
        typeof slotResult === "boolean"
            ? (
                slotResult
                    ? "Available"
                    : "Unavailable"
            )
            : (
                room.status ||
                "Available"
            );

    let features = "";

    features += `
        <span class="room-fact">
            ${Number(room.capacity) || 0} seats
        </span>
    `;

    if (room.projector) {

        features += `
            <span class="room-fact">
                Projector
            </span>
        `;
    }

    if (room.whiteboard) {

        features += `
            <span class="room-fact">
                Whiteboard
            </span>
        `;
    }

    return `
        <article class="room-card">

            <div class="room-card-content">

                <div class="room-card-heading">

                    <div>

                        <span class="overline">
                            MEETING ROOM
                        </span>

                        <h3>
                            ${escapeHtml(
        room.roomName ||
        "Unnamed room"
    )}
                        </h3>

                        <p>
                            ${escapeHtml(
        room.location ||
        "Location not set"
    )}
                        </p>

                    </div>

                    <span
                        class="status-pill ${
        available
            ? "status-available"
            : "status-muted"
    }">

                        <i></i>

                        ${escapeHtml(
        statusText
    )}

                    </span>

                </div>

                <div class="room-facts">
                    ${features}
                </div>

                <div class="room-card-footer">

                    <span class="capacity-note">
                        Up to ${
        Number(room.capacity) || 0
    } people
                    </span>

                    <button
                        class="button button-small button-primary"
                        data-action="book-room"
                        data-id="${room.id}">

                        Reserve

                    </button>

                </div>

                <div class="room-card-tools">

                    <button
                        class="text-button"
                        data-action="edit-room"
                        data-id="${room.id}">

                        Edit

                    </button>

                    <button
                        class="text-button danger-text"
                        data-action="delete-room"
                        data-id="${room.id}">

                        Remove

                    </button>

                </div>

            </div>

        </article>
    `;
}


/* =========================
   FILTER ROOMS
========================= */

function filteredRooms() {

    const query =
        state.roomQuery
            .trim()
            .toLowerCase();

    return state.rooms.filter(
        room => {

            const roomText =
                `${room.roomName || ""} ${
                    room.location || ""
                }`.toLowerCase();

            const matchesQuery =
                !query ||
                roomText.includes(query);

            const available =
                typeof state.availability[room.id] === "boolean"
                    ? state.availability[room.id]
                    : roomIsAvailable(room);

            const matchesStatus =
                state.roomStatus === "all" ||

                (
                    state.roomStatus === "available" &&
                    available
                ) ||

                (
                    state.roomStatus === "unavailable" &&
                    !available
                );

            return (
                matchesQuery &&
                matchesStatus
            );
        }
    );
}


/* =========================
   RENDER ROOMS
========================= */

function renderRoomCards() {

    const rooms =
        filteredRooms();

    const homeContainer =
        byId("roomCards");

    const allContainer =
        byId("allRoomCards");

    const homeRooms =
        rooms.slice(0, 4);

    if (homeContainer) {

        homeContainer.innerHTML =
            homeRooms.length
                ? homeRooms
                    .map(roomCard)
                    .join("")
                : emptyState(
                    "No rooms found",
                    "Try another search or filter."
                );
    }

    if (allContainer) {

        allContainer.innerHTML =
            rooms.length
                ? rooms
                    .map(roomCard)
                    .join("")
                : emptyState(
                    "No rooms found",
                    "Add a room or change the filters."
                );
    }
}


/* =========================
   BOOKING HTML
========================= */

function bookingMarkup(
    booking,
    compact = false
) {

    const status =
        String(
            booking.status ||
            "Unknown"
        ).toUpperCase();

    const room =
        booking.room?.roomName ||
        "Room unavailable";

    const employee =
        booking.employee?.name ||
        "Employee unavailable";

    const date =
        formatDate(
            booking.bookingDate,
            {
                month: "short",
                day: "numeric"
            }
        );

    let actions = "";

    if (status === "CONFIRMED") {

        if (!booking.checkedIn) {

            actions += `
                <button
                    class="text-button"
                    data-action="check-in"
                    data-id="${booking.id}">
                    Check in
                </button>
            `;

        } else {

            actions += `
                <span class="checked-label">
                    Checked in
                </span>
            `;
        }

        actions += `
            <button
                class="text-button"
                data-action="edit-booking"
                data-id="${booking.id}">
                Edit
            </button>
        `;

        if (!booking.checkedIn) {

            actions += `
                <button
                    class="text-button danger-text"
                    data-action="cancel-booking"
                    data-id="${booking.id}">
                    Cancel
                </button>
            `;
        }

    } else {

        actions = `
            <button
                class="text-button"
                data-action="delete-booking"
                data-id="${booking.id}">
                Remove
            </button>
        `;
    }

    return `
        <article class="booking-item ${
        compact
            ? "booking-compact"
            : ""
    }">

            <div class="booking-date-mark">

                <strong>
                    ${
        date.split(" ")[1] ||
        "--"
    }
                </strong>

                <span>
                    ${
        date.split(" ")[0] ||
        ""
    }
                </span>

            </div>

            <div class="booking-main">

                <div class="booking-main-top">

                    <h3>
                        ${escapeHtml(
        booking.purpose ||
        "Meeting"
    )}
                    </h3>

                    <span
                        class="status-pill status-${statusKey(status)}">

                        <i></i>

                        ${escapeHtml(status)}

                    </span>

                </div>

                <p>
                    ${escapeHtml(room)}

                    <span class="booking-separator">
                        /
                    </span>

                    ${escapeHtml(employee)}
                </p>

                <div class="booking-meta">

                    <span>
                        ${escapeHtml(
        formatTime(
            booking.startTime
        )
    )}
                        –
                        ${escapeHtml(
        formatTime(
            booking.endTime
        )
    )}
                    </span>

                    ${
        booking.checkedIn
            ? `
                                <span class="checked-label">
                                    Checked in
                                </span>
                            `
            : ""
    }

                </div>

            </div>

            <div class="booking-actions">
                ${actions}
            </div>

        </article>
    `;
}


/* =========================
   SORT BOOKINGS
========================= */

function sortedBookings(bookings) {

    return [...bookings].sort(
        (a, b) => {

            const first =
                `${a.bookingDate || ""}T${
                    a.startTime || ""
                }`;

            const second =
                `${b.bookingDate || ""}T${
                    b.startTime || ""
                }`;

            return first.localeCompare(
                second
            );
        }
    );
}


/* =========================
   TODAY'S SCHEDULE
========================= */

function renderSchedule() {

    const container =
        byId("todaySchedule");

    if (!container) {
        return;
    }

    const todaysBookings =
        sortedBookings(
            state.bookings.filter(
                booking =>
                    booking.bookingDate === today() &&
                    String(
                        booking.status
                    ).toUpperCase() ===
                    "CONFIRMED"
            )
        );

    const count =
        byId(
            "todayScheduleCount"
        );

    if (count) {

        count.textContent =
            `${todaysBookings.length} ${
                todaysBookings.length === 1
                    ? "booking"
                    : "bookings"
            }`;
    }

    container.innerHTML =
        todaysBookings.length
            ? todaysBookings
                .slice(0, 5)
                .map(
                    booking =>
                        bookingMarkup(
                            booking,
                            true
                        )
                )
                .join("")
            : emptyState(
                "No bookings today",
                "There are no confirmed bookings for today.",
                "calendar"
            );
}


/* =========================
   ALL BOOKINGS
========================= */

function renderBookings() {

    const container =
        byId("bookingRows");

    if (!container) {
        return;
    }

    const filtered =
        sortedBookings(
            state.bookings
        ).filter(
            booking => {

                const status =
                    String(
                        booking.status || ""
                    ).toLowerCase();

                const matchesStatus =
                    state.bookingStatus ===
                    "all" ||
                    status ===
                    state.bookingStatus;

                const matchesDate =
                    !state.bookingDate ||
                    booking.bookingDate ===
                    state.bookingDate;

                return (
                    matchesStatus &&
                    matchesDate
                );
            }
        );

    container.innerHTML =
        filtered.length
            ? filtered
                .map(
                    booking =>
                        bookingMarkup(
                            booking
                        )
                )
                .join("")
            : emptyState(
                "No bookings found",
                "Try another filter or create a new booking.",
                "calendar"
            );

    const summary =
        byId("bookingSummary");

    if (summary) {

        summary.textContent =
            `${filtered.length} ${
                filtered.length === 1
                    ? "booking"
                    : "bookings"
            }`;
    }
}


/* =========================
   EMPLOYEE CARD
========================= */

function employeeCard(employee) {

    const name =
        employee.name ||
        "Unknown employee";

    const initial =
        name
            .trim()
            .charAt(0)
            .toUpperCase() ||
        "?";

    return `
        <article class="employee-card">

            <div class="employee-avatar">
                ${escapeHtml(initial)}
            </div>

            <div class="employee-info">

                <span class="overline">
                    ${escapeHtml(
        employee.department ||
        "TEAM MEMBER"
    )}
                </span>

                <h3>
                    ${escapeHtml(name)}
                </h3>

                <a
                    href="mailto:${escapeHtml(
        employee.email || ""
    )}">

                    ${escapeHtml(
        employee.email ||
        "No email provided"
    )}

                </a>

            </div>

            <div class="employee-actions">

                <button
                    class="text-button"
                    data-action="edit-employee"
                    data-id="${employee.id}">

                    Edit

                </button>

                <button
                    class="text-button danger-text"
                    data-action="delete-employee"
                    data-id="${employee.id}">

                    Remove

                </button>

            </div>

        </article>
    `;
}


/* =========================
   EMPLOYEES
========================= */

function renderEmployees() {

    const container =
        byId("employeeCards");

    if (!container) {
        return;
    }

    container.innerHTML =
        state.employees.length
            ? state.employees
                .map(employeeCard)
                .join("")
            : emptyState(
                "No people added",
                "Add employees to make room booking easier."
            );
}


/* =========================
   COUNTS
========================= */

function renderCounts() {

    const teamCount =
        byId("teamCount");

    const roomCount =
        byId("roomCount");

    if (teamCount) {

        teamCount.textContent =
            `${state.employees.length} ${
                state.employees.length === 1
                    ? "person"
                    : "people"
            }`;
    }

    if (roomCount) {

        roomCount.textContent =
            `${state.rooms.length} ${
                state.rooms.length === 1
                    ? "room"
                    : "rooms"
            }`;
    }
}


/* =========================
   EMPTY STATE
========================= */

function emptyState(
    title,
    message,
    icon = "empty"
) {

    return `
        <div class="empty-state">

            <span
                class="empty-mark"
                aria-hidden="true">

                ${
        icon === "calendar"
            ? "▦"
            : "—"
    }

            </span>

            <strong>
                ${escapeHtml(title)}
            </strong>

            <p>
                ${escapeHtml(message)}
            </p>

        </div>
    `;
}


/* =========================
   NAVIGATION
========================= */

function navigate(page) {

    const allowedPages = [
        "overview",
        "rooms",
        "bookings",
        "team",
        "finance"
    ];

    if (!allowedPages.includes(page)) {
        return;
    }

    state.page = page;

    document
        .querySelectorAll("[data-page-view]")
        .forEach(view => {

            view.classList.toggle(
                "is-active",
                view.dataset.pageView === page
            );
        });

    document
        .querySelectorAll(
            "[data-action='navigate']"
        )
        .forEach(button => {

            button.classList.toggle(
                "is-active",
                button.dataset.page === page
            );
        });

    const titles = {
        overview: "Overview",
        rooms: "Rooms",
        bookings: "Bookings",
        team: "People",
        finance: "Finance"
    };

    const heading =
        byId("pageHeading");

    if (heading) {
        heading.textContent =
            titles[page];
    }

    document.body.dataset.page =
        page;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    renderAll();
}


/* =========================
   CHECK AVAILABILITY
========================= */

async function checkAvailability(event) {

    event.preventDefault();

    const form =
        event.target;

    const values =
        new FormData(form);

    const date =
        values.get(
            "availabilityDate"
        );

    const startTime =
        values.get(
            "availabilityStart"
        );

    const endTime =
        values.get(
            "availabilityEnd"
        );

    const query =
        String(
            values.get(
                "availabilityQuery"
            ) || ""
        ).trim();

    if (
        !date ||
        !startTime ||
        !endTime ||
        startTime >= endTime
    ) {

        showToast(
            "Please choose a valid date and time.",
            "error"
        );

        return;
    }

    state.roomQuery =
        query;

    state.availability = {};

    const button =
        form.querySelector(
            "[type='submit']"
        );

    button.disabled = true;

    button.textContent =
        "Checking...";

    try {

        const results =
            await Promise.all(
                state.rooms.map(
                    async room => {

                        const params =
                            new URLSearchParams({
                                roomId: room.id,
                                date,
                                startTime,
                                endTime
                            });

                        const result =
                            await request(
                                `${API.bookings}/availability?${params}`
                            );

                        return [
                            room.id,
                            result ===
                            "Room is available"
                        ];
                    }
                )
            );

        state.availability =
            Object.fromEntries(
                results
            );

        renderMetrics();

        renderRoomCards();

        const availableCount =
            Object.values(
                state.availability
            ).filter(Boolean).length;

        const note =
            byId("availabilityNote");

        if (note) {

            note.textContent =
                `${availableCount} of ${
                    state.rooms.length
                } rooms are available from ${
                    formatTime(startTime)
                } to ${
                    formatTime(endTime)
                }.`;
        }

        showToast(
            "Room availability updated."
        );

    } catch (error) {

        showToast(
            error.message ||
            "Availability check failed.",
            "error"
        );

    } finally {

        button.disabled = false;

        button.textContent =
            "Check availability";
    }
}


/* =========================
   SELECT OPTIONS
========================= */

function selectOptions(
    items,
    selected,
    labelFor
) {

    return items
        .map(item => {

            return `
                <option
                    value="${item.id}"
                    ${
                String(item.id) ===
                String(selected)
                    ? "selected"
                    : ""
            }>

                    ${escapeHtml(
                labelFor(item)
            )}

                </option>
            `;
        })
        .join("");
}


/* =========================
   OPEN DIALOG
========================= */

function openDialog(
    title,
    description,
    body
) {

    const titleElement =
        byId("dialogTitle");

    const descriptionElement =
        byId("dialogDescription");

    const content =
        byId("dialogContent");

    const layer =
        byId("dialogLayer");

    if (!layer) {
        return;
    }

    titleElement.textContent =
        title;

    descriptionElement.textContent =
        description;

    content.innerHTML =
        body;

    layer.classList.remove(
        "is-hidden"
    );

    layer.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "dialog-open"
    );

    requestAnimationFrame(() => {

        const firstInput =
            layer.querySelector(
                "input:not([type='hidden']), select"
            );

        if (firstInput) {
            firstInput.focus();
        }
    });
}


/* =========================
   CLOSE DIALOG
========================= */

function closeDialog() {

    const layer =
        byId("dialogLayer");

    if (!layer) {
        return;
    }

    layer.classList.add(
        "is-hidden"
    );

    layer.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "dialog-open"
    );

    const content =
        byId("dialogContent");

    if (content) {
        content.replaceChildren();
    }
}


/* =========================
   BOOKING DIALOG
========================= */

function openBookingDialog(
    roomId = "",
    bookingId = ""
) {

    const booking =
        bookingId
            ? state.bookings.find(
                item =>
                    String(item.id) ===
                    String(bookingId)
            )
            : null;

    const selectedRoom =
        roomId ||
        booking?.room?.id ||
        "";

    const selectedEmployee =
        booking?.employee?.id ||
        "";

    const date =
        booking?.bookingDate ||
        byId("availabilityDate")?.value ||
        today();

    const start =
        booking?.startTime
            ? formatTime(
                booking.startTime
            )
            : "09:00";

    const end =
        booking?.endTime
            ? formatTime(
                booking.endTime
            )
            : "10:00";

    const roomOptions =
        selectOptions(
            state.rooms,
            selectedRoom,
            room =>
                `${room.roomName} - ${
                    room.location ||
                    "No location"
                }`
        );

    const employeeOptions =
        selectOptions(
            state.employees,
            selectedEmployee,
            employee =>
                employee.name
        );

    openDialog(
        booking
            ? "Edit booking"
            : "Reserve a room",

        "Enter the meeting details below.",

        `
        <form
            id="entityForm"
            data-form-kind="booking"
            data-record-id="${
            booking?.id || ""
        }">

            <div class="form-grid">

                <label class="field">

                    <span>
                        Room
                    </span>

                    <select
                        name="roomId"
                        required>

                        <option value="">
                            Select a room
                        </option>

                        ${roomOptions}

                    </select>

                </label>


                <label class="field">

                    <span>
                        Booked by
                    </span>

                    <select
                        name="employeeId"
                        required>

                        <option value="">
                            Select a person
                        </option>

                        ${employeeOptions}

                    </select>

                </label>


                <label class="field">

                    <span>
                        Date
                    </span>

                    <input
                        type="date"
                        name="bookingDate"
                        min="${today()}"
                        value="${escapeHtml(date)}"
                        required>

                </label>


                <label class="field">

                    <span>
                        Purpose
                    </span>

                    <input
                        type="text"
                        name="purpose"
                        maxlength="120"
                        placeholder="Team meeting"
                        value="${escapeHtml(
            booking?.purpose || ""
        )}">

                </label>


                <label class="field">

                    <span>
                        Start time
                    </span>

                    <input
                        type="time"
                        name="startTime"
                        value="${escapeHtml(start)}"
                        required>

                </label>


                <label class="field">

                    <span>
                        End time
                    </span>

                    <input
                        type="time"
                        name="endTime"
                        value="${escapeHtml(end)}"
                        required>

                </label>

            </div>


            <div class="dialog-actions">

                <button
                    type="button"
                    class="button button-quiet"
                    data-action="close-dialog">

                    Cancel

                </button>

                <button
                    type="submit"
                    class="button button-primary">

                    ${
            booking
                ? "Save changes"
                : "Confirm booking"
        }

                </button>

            </div>

        </form>
        `
    );
}


/* =========================
   ROOM DIALOG
========================= */

function openRoomDialog(
    roomId = ""
) {

    const room =
        roomId
            ? state.rooms.find(
                item =>
                    String(item.id) ===
                    String(roomId)
            )
            : null;

    const isAvailable =
        room
            ? roomIsAvailable(room)
            : true;

    openDialog(
        room
            ? "Edit room"
            : "Add room",

        "Enter the room details below.",

        `
        <form
            id="entityForm"
            data-form-kind="room"
            data-record-id="${
            room?.id || ""
        }">

            <div class="form-grid">

                <label class="field">

                    <span>
                        Room name
                    </span>

                    <input
                        name="roomName"
                        maxlength="80"
                        value="${escapeHtml(
            room?.roomName || ""
        )}"
                        placeholder="Meeting Room 1"
                        required>

                </label>


                <label class="field">

                    <span>
                        Location
                    </span>

                    <input
                        name="location"
                        maxlength="100"
                        value="${escapeHtml(
            room?.location || ""
        )}"
                        placeholder="First Floor"
                        required>

                </label>


                <label class="field">

                    <span>
                        Capacity
                    </span>

                    <input
                        name="capacity"
                        type="number"
                        min="1"
                        value="${
            Number(
                room?.capacity
            ) || 8
        }"
                        required>

                </label>


                <label class="field">

                    <span>
                        Status
                    </span>

                    <select name="status">

                        <option
                            value="Available"
                            ${
            isAvailable
                ? "selected"
                : ""
        }>

                            Available

                        </option>

                        <option
                            value="Unavailable"
                            ${
            !isAvailable
                ? "selected"
                : ""
        }>

                            Unavailable

                        </option>

                    </select>

                </label>


                <label class="check-field">

                    <input
                        type="checkbox"
                        name="projector"
                        ${
            room?.projector
                ? "checked"
                : ""
        }>

                    <span>
                        Projector
                    </span>

                </label>


                <label class="check-field">

                    <input
                        type="checkbox"
                        name="whiteboard"
                        ${
            room?.whiteboard
                ? "checked"
                : ""
        }>

                    <span>
                        Whiteboard
                    </span>

                </label>

            </div>


            <div class="dialog-actions">

                <button
                    type="button"
                    class="button button-quiet"
                    data-action="close-dialog">

                    Cancel

                </button>

                <button
                    type="submit"
                    class="button button-primary">

                    ${
            room
                ? "Save room"
                : "Add room"
        }

                </button>

            </div>

        </form>
        `
    );
}


/* =========================
   EMPLOYEE DIALOG
========================= */

function openEmployeeDialog(
    employeeId = ""
) {

    const employee =
        employeeId
            ? state.employees.find(
                item =>
                    String(item.id) ===
                    String(employeeId)
            )
            : null;

    openDialog(
        employee
            ? "Edit person"
            : "Add person",

        "Enter the employee details below.",

        `
        <form
            id="entityForm"
            data-form-kind="employee"
            data-record-id="${
            employee?.id || ""
        }">

            <div class="form-grid">

                <label class="field">

                    <span>
                        Full name
                    </span>

                    <input
                        name="name"
                        maxlength="100"
                        value="${escapeHtml(
            employee?.name || ""
        )}"
                        placeholder="Kavya"
                        required>

                </label>


                <label class="field">

                    <span>
                        Department
                    </span>

                    <input
                        name="department"
                        maxlength="80"
                        value="${escapeHtml(
            employee?.department || ""
        )}"
                        placeholder="Engineering"
                        required>

                </label>


                <label class="field field-wide">

                    <span>
                        Email
                    </span>

                    <input
                        name="email"
                        type="email"
                        maxlength="120"
                        value="${escapeHtml(
            employee?.email || ""
        )}"
                        placeholder="name@example.com"
                        required>

                </label>

            </div>


            <div class="dialog-actions">

                <button
                    type="button"
                    class="button button-quiet"
                    data-action="close-dialog">

                    Cancel

                </button>

                <button
                    type="submit"
                    class="button button-primary">

                    ${
            employee
                ? "Save person"
                : "Add person"
        }

                </button>

            </div>

        </form>
        `
    );
}


/* =========================
   FORM DATA
========================= */

function formPayload(
    form,
    kind
) {

    const data =
        new FormData(form);

    if (kind === "booking") {

        return {

            roomId:
                Number(
                    data.get("roomId")
                ),

            employeeId:
                Number(
                    data.get("employeeId")
                ),

            bookingDate:
                data.get("bookingDate"),

            startTime:
                data.get("startTime"),

            endTime:
                data.get("endTime"),

            purpose:
                data.get("purpose") ||
                "Meeting"
        };
    }

    if (kind === "room") {

        return {

            roomName:
                data.get("roomName"),

            location:
                data.get("location"),

            capacity:
                Number(
                    data.get("capacity")
                ),

            projector:
                data.has("projector"),

            whiteboard:
                data.has("whiteboard"),

            status:
                data.get("status")
        };
    }

    return {

        name:
            data.get("name"),

        department:
            data.get("department"),

        email:
            data.get("email")
    };
}


/* =========================
   SAVE FORM
========================= */

async function saveEntity(event) {

    event.preventDefault();

    const form =
        event.target;

    if (!form.reportValidity()) {
        return;
    }

    const kind =
        form.dataset.formKind;

    const recordId =
        form.dataset.recordId;

    let endpoint;

    if (kind === "booking") {

        endpoint =
            API.bookings;

    } else if (kind === "room") {

        endpoint =
            API.rooms;

    } else {

        endpoint =
            API.employees;
    }

    const method =
        recordId
            ? "PUT"
            : "POST";

    const url =
        recordId
            ? `${endpoint}/${recordId}`
            : endpoint;

    const submit =
        form.querySelector(
            "[type='submit']"
        );

    submit.disabled = true;

    submit.textContent =
        "Saving...";

    try {

        await request(
            url,
            {
                method,
                body: JSON.stringify(
                    formPayload(
                        form,
                        kind
                    )
                )
            }
        );

        closeDialog();

        await loadData();

        if (kind === "booking") {

            showToast(
                recordId
                    ? "Booking updated."
                    : "Booking confirmed."
            );

        } else if (kind === "room") {

            showToast(
                recordId
                    ? "Room updated."
                    : "Room added."
            );

        } else {

            showToast(
                recordId
                    ? "Person updated."
                    : "Person added."
            );
        }

    } catch (error) {

        showToast(
            error.message ||
            "Could not save the changes.",
            "error"
        );

        submit.disabled = false;

        submit.textContent =
            recordId
                ? "Save changes"
                : "Save";
    }
}


/* =========================
   BUTTON ACTIONS
========================= */

async function runAction(
    action,
    id,
    trigger
) {

    const room =
        state.rooms.find(
            item =>
                String(item.id) ===
                String(id)
        );

    const employee =
        state.employees.find(
            item =>
                String(item.id) ===
                String(id)
        );

    const booking =
        state.bookings.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (action === "navigate") {

        return navigate(
            trigger.dataset.page
        );
    }


    if (action === "refresh") {

        return loadData();
    }


    if (action === "new-booking") {

        return openBookingDialog();
    }


    if (action === "add-room") {

        return openRoomDialog();
    }


    if (action === "add-employee") {

        return openEmployeeDialog();
    }


    if (action === "book-room") {

        return openBookingDialog(id);
    }


    if (action === "edit-room") {

        return openRoomDialog(id);
    }


    if (action === "edit-employee") {

        return openEmployeeDialog(id);
    }


    if (action === "edit-booking") {

        return openBookingDialog(
            "",
            id
        );
    }


    if (action === "close-dialog") {

        return closeDialog();
    }


    const actions = {

        "delete-room": {

            url:
                `${API.rooms}/${id}`,

            message:
                `Remove ${
                    room?.roomName ||
                    "this room"
                }?`
        },

        "delete-employee": {

            url:
                `${API.employees}/${id}`,

            message:
                `Remove ${
                    employee?.name ||
                    "this person"
                }?`
        },

        "cancel-booking": {

            url:
                `${API.bookings}/${id}/cancel`,

            method:
                "PUT",

            message:
                "Cancel this booking?"
        },

        "check-in": {

            url:
                `${API.bookings}/${id}/check-in`,

            method:
                "PUT",

            message:
                "Check in this booking?",

            confirm:
                false
        },

        "delete-booking": {

            url:
                `${API.bookings}/${id}`,

            message:
                "Permanently remove this booking?"
        }
    };


    const operation =
        actions[action];

    if (!operation) {
        return;
    }


    if (
        operation.confirm !== false &&
        !window.confirm(
            operation.message
        )
    ) {

        return;
    }


    trigger.disabled = true;


    try {

        await request(
            operation.url,
            {
                method:
                    operation.method ||
                    "DELETE"
            }
        );

        await loadData();


        if (action === "check-in") {

            showToast(
                "Check-in completed."
            );

        } else if (
            action ===
            "cancel-booking"
        ) {

            showToast(
                "Booking cancelled."
            );

        } else if (
            action ===
            "delete-room"
        ) {

            showToast(
                "Room removed."
            );

        } else if (
            action ===
            "delete-employee"
        ) {

            showToast(
                "Person removed."
            );

        } else if (
            action ===
            "delete-booking"
        ) {

            showToast(
                "Booking removed."
            );

        } else {

            showToast(
                "Changes saved."
            );
        }

    } catch (error) {

        trigger.disabled = false;

        showToast(
            error.message ||
            "The action could not be completed.",
            "error"
        );
    }
}


/* =========================
   TOAST
========================= */

function showToast(
    message,
    type = "success"
) {

    const toast =
        byId("toast");

    if (!toast) {
        return;
    }

    toast.textContent =
        message;

    toast.className =
        `toast toast-${type}`;

    window.clearTimeout(
        showToast.timer
    );

    showToast.timer =
        window.setTimeout(
            () => {

                toast.classList.add(
                    "is-hidden"
                );

            },
            3500
        );
}


/* =========================
   EVENT BINDING
========================= */

function bindEvents() {

    /* BUTTON CLICKS */

    document.addEventListener(
        "click",
        event => {

            const trigger =
                event.target.closest(
                    "[data-action]"
                );

            if (!trigger) {
                return;
            }

            runAction(
                trigger.dataset.action,
                trigger.dataset.id,
                trigger
            );
        }
    );


    /* FORM SUBMIT */

    document.addEventListener(
        "submit",
        event => {

            if (
                event.target.id ===
                "availabilityForm"
            ) {

                checkAvailability(
                    event
                );
            }

            if (
                event.target.id ===
                "entityForm"
            ) {

                saveEntity(
                    event
                );
            }
        }
    );


    /* ROOM SEARCH */

    const roomSearch =
        byId("roomSearch");

    if (roomSearch) {

        roomSearch.addEventListener(
            "input",
            event => {

                state.roomQuery =
                    event.target.value;

                renderRoomCards();
            }
        );
    }


    /* ROOM FILTER */

    const roomStatusFilter =
        byId(
            "roomStatusFilter"
        );

    if (roomStatusFilter) {

        roomStatusFilter.addEventListener(
            "change",
            event => {

                state.roomStatus =
                    event.target.value;

                renderRoomCards();
            }
        );
    }


    /* BOOKING STATUS FILTER */

    const bookingStatusFilter =
        byId(
            "bookingStatusFilter"
        );

    if (bookingStatusFilter) {

        bookingStatusFilter.addEventListener(
            "change",
            event => {

                state.bookingStatus =
                    event.target.value;

                renderBookings();
            }
        );
    }


    /* BOOKING DATE FILTER */

    const bookingDateFilter =
        byId(
            "bookingDateFilter"
        );

    if (bookingDateFilter) {

        bookingDateFilter.addEventListener(
            "change",
            event => {

                state.bookingDate =
                    event.target.value;

                renderBookings();
            }
        );
    }


    /* CLOSE DIALOG */

    const dialogLayer =
        byId("dialogLayer");

    if (dialogLayer) {

        dialogLayer.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    dialogLayer
                ) {

                    closeDialog();
                }
            }
        );
    }


    /* ESCAPE KEY */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeDialog();
            }
        }
    );
}


/* =========================
   START APPLICATION
========================= */

document.addEventListener("DOMContentLoaded", () => {

    applyRoleAccess();

    const dateField = byId("availabilityDate");

    if (dateField) {
        dateField.value = today();
    }

    bindEvents();
    loadData();
});
function applyRoleAccess() {

    const role = sessionStorage.getItem("role");

    // If user is not logged in, go back to login
    if (!role) {
        window.location.href = "login.html";
        return;
    }

    const currentRole = role.toUpperCase();

    console.log("Logged in role:", currentRole);

    // Show/hide elements based on role
    document.querySelectorAll("[data-role]").forEach((element) => {

        const requiredRole = element.dataset.role.toUpperCase();

        if (currentRole === requiredRole) {
            element.style.display = "";
        } else {
            element.style.display = "none";
        }

    });

    // Display user role in profile
    const profileLabel = document.querySelector(".profile-label");

    if (profileLabel) {

        if (currentRole === "ADMIN") {
            profileLabel.textContent = "Admin";
        }

        else if (currentRole === "INVOICING_USER") {
            profileLabel.textContent = "Invoicing User";
        }

        else {
            profileLabel.textContent = currentRole;
        }
    }

    // Display first letter in profile avatar
    const profileAvatar = document.querySelector(".profile-avatar");

    if (profileAvatar) {

        const username =
            sessionStorage.getItem("username") || "User";

        profileAvatar.textContent =
            username.charAt(0).toUpperCase();
    }
}