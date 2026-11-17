// =============================================
// FR CREATIVE STUDIO
// PHOTOGRAPHY BOOKING MANAGER
// =============================================


// =============================================
// PAQUETES PREDETERMINADOS
// =============================================

const PACKAGES = {

    mini: {
        name: "Christmas Mini",
        price: 49
    },

    family: {
        name: "Family Christmas",
        price: 79
    },

    premium: {
        name: "Premium Christmas",
        price: 119
    }

};

const DEPOSIT_PERCENT = 0.30;

// Conservar la clave anterior evita perder reservas
// creadas con la versión navideña.

const STORAGE_KEY = "FR_CHRISTMAS_BOOKINGS_2026";

const BACKUP_APP = "FR Creative Studio Booking Manager";

const LEGACY_BACKUP_APP =
    "FR Creative Studio Christmas Manager";


// =============================================
// DATOS
// =============================================

let bookings = loadBookings();

let currentYear = 2026;

let currentMonth = 11;

let selectedDate = "2026-12-01";


// =============================================
// ELEMENTOS
// =============================================

const $ = id => document.getElementById(id);

const calendar = $("calendar");

const bookingModal = $("bookingModal");

const bookingForm = $("bookingForm");

const sessionType = $("sessionType");

const customFields = $("customSessionFields");

const customName = $("customSessionName");

const customPrice = $("customSessionPrice");

const customDetails = $("customSessionDetails");

const amountPaid = $("amountPaid");


// =============================================
// FUNCIONES DE DINERO
// =============================================

function toCents(value) {

    return Math.round(Number(value) * 100);

}

function fromCents(value) {

    return value / 100;

}

function formatMoney(value) {

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    }).format(value);

}


// =============================================
// PRECIOS DE SESIONES
// =============================================

function isCustom(type) {

    return type === "custom" || type === "other";

}

function getSessionPrice(booking) {

    if (isCustom(booking.package)) {

        return Number(booking.price) || 0;

    }

    return PACKAGES[booking.package]?.price || 0;

}

function getSessionName(booking) {

    if (isCustom(booking.package)) {

        return booking.customName || "Sesión personalizada";

    }

    return PACKAGES[booking.package]?.name || "Sesión";

}

function getDeposit(price) {

    return fromCents(
        Math.round(toCents(price) * DEPOSIT_PERCENT)
    );

}

function getBalance(booking) {

    return fromCents(
        Math.max(
            0,
            toCents(getSessionPrice(booking)) -
            toCents(booking.paid)
        )
    );

}


// =============================================
// GUARDAR Y CARGAR
// =============================================

function loadBookings() {

    try {

        const saved = localStorage.getItem(STORAGE_KEY);

        const parsed = saved ? JSON.parse(saved) : [];

        return Array.isArray(parsed) ? parsed : [];

    } catch (error) {

        console.error(error);

        return [];

    }

}

function saveBookings() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(bookings)
        );

        return true;

    } catch (error) {

        alert(
            "No se pudieron guardar los cambios. " +
            "Exporta una copia de seguridad."
        );

        return false;

    }

}


// =============================================
// FECHAS
// =============================================

function dateString(year, month, day) {

    return (
        year + "-" +
        String(month + 1).padStart(2, "0") + "-" +
        String(day).padStart(2, "0")
    );

}

function formatDate(value) {

    const [year, month, day] =
        value.split("-").map(Number);

    return new Date(
        year,
        month - 1,
        day
    ).toLocaleDateString("es-US", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

}

function formatTime(value) {

    if (!value) return "";

    const [hour, minute] = value.split(":").map(Number);

    const period = hour >= 12 ? "PM" : "AM";

    const displayHour = hour % 12 || 12;

    return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;

}


// =============================================
// CALENDARIO
// =============================================

function renderCalendar() {

    calendar.innerHTML = "";

    const firstDay =
        new Date(currentYear, currentMonth, 1).getDay();

    const daysInMonth =
        new Date(currentYear, currentMonth + 1, 0).getDate();

    const monthName = new Date(
        currentYear,
        currentMonth,
        1
    ).toLocaleDateString("es-US", {
        month: "long",
        year: "numeric"
    });

    $("monthTitle").textContent =
        monthName.charAt(0).toUpperCase() +
        monthName.slice(1);


    for (let i = 0; i < firstDay; i++) {

        calendar.appendChild(
            document.createElement("div")
        );

    }


    for (let day = 1; day <= daysInMonth; day++) {

        const date = dateString(
            currentYear,
            currentMonth,
            day
        );

        const dayBookings = bookings.filter(
            booking => booking.date === date
        );

        const button = document.createElement("button");

        button.type = "button";

        button.className = "calendar-day";

        const number = document.createElement("span");

        number.className = "day-number";

        number.textContent = day;

        button.appendChild(number);


        if (dayBookings.length > 0) {

            button.classList.add("has-bookings");

            const count = document.createElement("span");

            count.className = "day-count";

            count.textContent =
                dayBookings.length === 1
                    ? "1 sesión"
                    : `${dayBookings.length} sesiones`;

            button.appendChild(count);

        }


        if (date === selectedDate) {

            button.classList.add("active");

        }


        button.addEventListener("click", () => {

            selectedDate = date;

            renderCalendar();

            renderDailyBookings();

        });

        calendar.appendChild(button);

    }

}


// =============================================
// CAMBIAR MES
// =============================================

$("prevMonth").addEventListener("click", () => {

    currentMonth--;

    if (currentMonth < 0) {

        currentMonth = 11;

        currentYear--;

    }

    renderCalendar();

});


$("nextMonth").addEventListener("click", () => {

    currentMonth++;

    if (currentMonth > 11) {

        currentMonth = 0;

        currentYear++;

    }

    renderCalendar();

});


// =============================================
// MOSTRAR CAMPOS PERSONALIZADOS
// =============================================

function updateSessionFields() {

    const custom = isCustom(sessionType.value);

    customFields.classList.toggle("hidden", !custom);

    customName.required = custom;

    customPrice.required = custom;

    updateCalculator();

}

sessionType.addEventListener(
    "change",
    updateSessionFields
);

customPrice.addEventListener(
    "input",
    updateCalculator
);

amountPaid.addEventListener(
    "input",
    updateCalculator
);


// =============================================
// CALCULADORA
// =============================================

function getFormPrice() {

    if (isCustom(sessionType.value)) {

        return Number(customPrice.value) || 0;

    }

    return PACKAGES[sessionType.value]?.price || 0;

}

function updateCalculator() {

    const price = getFormPrice();

    const deposit = getDeposit(price);

    const paid = Number(amountPaid.value) || 0;

    const balance = fromCents(
        Math.max(
            0,
            toCents(price) - toCents(paid)
        )
    );


    $("packagePrice").textContent =
        formatMoney(price);

    $("depositAmount").textContent =
        formatMoney(deposit);

    $("remainingAmount").textContent =
        formatMoney(price - deposit);

    $("currentBalance").textContent =
        formatMoney(balance);


    if (!sessionType.value) {

        $("paymentStatusText").textContent =
            "Selecciona una sesión.";

        return;

    }


    if (toCents(paid) >= toCents(price)) {

        $("paymentStatusText").textContent =
            "Pago completo.";

    } else if (toCents(paid) >= toCents(deposit)) {

        $("paymentStatusText").textContent =
            "Anticipo completado. Reserva confirmada.";

    } else {

        const missing = fromCents(
            toCents(deposit) - toCents(paid)
        );

        $("paymentStatusText").textContent =
            `Faltan ${formatMoney(missing)} para completar el anticipo.`;

    }

}


// =============================================
// ABRIR MODAL
// =============================================

function openModal(booking = null) {

    bookingForm.reset();

    $("bookingId").value = "";

    $("modalTitle").textContent =
        booking ? "Editar Reserva" : "Nueva Reserva";


    if (booking) {

        $("bookingId").value = booking.id;

        $("clientName").value = booking.name;

        $("clientPhone").value = booking.phone || "";

        $("bookingDate").value = booking.date;

        $("bookingTime").value = booking.time;

        sessionType.value = booking.package;

        customName.value = booking.customName || "";

        customPrice.value = booking.price ?? "";

        customDetails.value = booking.customDetails || "";

        amountPaid.value = booking.paid;

        $("bookingNotes").value = booking.notes || "";

    } else {

        $("bookingDate").value = selectedDate;

        amountPaid.value = 0;

    }


    updateSessionFields();

    bookingModal.classList.add("show");

    $("clientName").focus();

}


// =============================================
// CERRAR MODAL
// =============================================

function closeModal() {

    bookingModal.classList.remove("show");

}

$("newBookingBtn").addEventListener(
    "click",
    () => openModal()
);

$("addDayBooking").addEventListener(
    "click",
    () => openModal()
);

$("closeModal").addEventListener(
    "click",
    closeModal
);

$("cancelModal").addEventListener(
    "click",
    closeModal
);

bookingModal.addEventListener("click", event => {

    if (event.target === bookingModal) {

        closeModal();

    }

});


// =============================================
// GUARDAR RESERVA
// =============================================

bookingForm.addEventListener("submit", event => {

    event.preventDefault();


    const id = $("bookingId").value;

    const name = $("clientName").value.trim();

    const phone = $("clientPhone").value.trim();

    const date = $("bookingDate").value;

    const time = $("bookingTime").value;

    const type = sessionType.value;

    const price = getFormPrice();

    const paid = Number(amountPaid.value);


    if (
        !name ||
        !date ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
        (!PACKAGES[type] && !isCustom(type))
    ) {

        alert("Completa los campos obligatorios.");

        return;

    }


    if (
        !Number.isFinite(price) ||
        price <= 0 ||
        toCents(price) !== price * 100 &&
        Math.abs(toCents(price) - price * 100) > 0.00001
    ) {

        alert("Introduce un precio válido mayor que cero.");

        return;

    }


    if (isCustom(type) && !customName.value.trim()) {

        alert("Introduce el nombre de la sesión.");

        return;

    }


    if (
        !Number.isFinite(paid) ||
        paid < 0 ||
        toCents(paid) > toCents(price)
    ) {

        alert(
            `El pago debe estar entre $0 y ${formatMoney(price)}.`
        );

        return;

    }


    const booking = {

        id: id || (
            crypto.randomUUID?.() ||
            `${Date.now()}-${Math.random()}`
        ),

        name,

        phone,

        date,

        time,

        package: type,

        price: fromCents(toCents(price)),

        customName: isCustom(type)
            ? customName.value.trim()
            : "",

        customDetails: isCustom(type)
            ? customDetails.value.trim()
            : "",

        paid: fromCents(toCents(paid)),

        notes: $("bookingNotes").value.trim()

    };


    const previous = [...bookings];


    if (id) {

        const index = bookings.findIndex(
            item => item.id === id
        );

        if (index === -1) {

            alert("No se encontró la reserva.");

            return;

        }

        bookings[index] = booking;

    } else {

        bookings.push(booking);

    }


    if (!saveBookings()) {

        bookings = previous;

        return;

    }


    const [year, month] = date.split("-").map(Number);

    currentYear = year;

    currentMonth = month - 1;

    selectedDate = date;


    closeModal();

    refreshDashboard();

});


// =============================================
// ESTADO DEL PAGO
// =============================================

function getBookingStatus(booking) {

    const price = getSessionPrice(booking);

    const deposit = getDeposit(price);

    const paid = Number(booking.paid) || 0;


    if (toCents(paid) >= toCents(price)) {

        return {
            text: "Pagado",
            className: "status-paid"
        };

    }


    if (toCents(paid) >= toCents(deposit)) {

        return {
            text: "Confirmada",
            className: "status-confirmed"
        };

    }


    return {
        text: "Pendiente",
        className: "status-pending"
    };

}


// =============================================
// ELEMENTOS SEGUROS
// =============================================

function textElement(tag, value, className = "") {

    const element = document.createElement(tag);

    element.textContent = value;

    if (className) {

        element.className = className;

    }

    return element;

}


// =============================================
// ACCIONES DE RESERVA
// =============================================

function actionButtons(booking) {

    const container = document.createElement("div");

    container.className = "booking-card-actions";


    const edit = textElement(
        "button",
        "Editar",
        "edit-btn"
    );

    edit.type = "button";

    edit.addEventListener("click", () => {

        openModal(booking);

    });


    const remove = textElement(
        "button",
        "Eliminar",
        "delete-btn"
    );

    remove.type = "button";

    remove.addEventListener("click", () => {

        deleteBooking(booking.id);

    });


    container.append(edit, remove);

    return container;

}


// =============================================
// RESERVAS DEL DÍA
// =============================================

function renderDailyBookings() {

    const container = $("dailyBookings");

    container.innerHTML = "";

    $("selectedDayTitle").textContent =
        formatDate(selectedDate);


    const daily = bookings
        .filter(item => item.date === selectedDate)
        .sort((a, b) => a.time.localeCompare(b.time));


    if (daily.length === 0) {

        container.appendChild(
            textElement(
                "p",
                "No tienes sesiones registradas para esta fecha.",
                "empty-message"
            )
        );

        return;

    }


    daily.forEach(booking => {

        const card = document.createElement("div");

        card.className = "booking-card";

        const info = document.createElement("div");


        info.appendChild(
            textElement("h3", booking.name)
        );

        info.appendChild(
            textElement(
                "p",
                `${getSessionName(booking)} · ${formatTime(booking.time)}`
            )
        );

        info.appendChild(
            textElement(
                "p",
                `Total: ${formatMoney(getSessionPrice(booking))} · ` +
                `Pagado: ${formatMoney(booking.paid)} · ` +
                `Pendiente: ${formatMoney(getBalance(booking))}`
            )
        );


        const status = getBookingStatus(booking);

        info.appendChild(
            textElement(
                "span",
                status.text,
                `status-badge ${status.className}`
            )
        );


        if (booking.phone) {

            info.appendChild(
                textElement("p", `Teléfono: ${booking.phone}`)
            );

        }


        if (booking.customDetails) {

            info.appendChild(
                textElement(
                    "p",
                    `Detalles: ${booking.customDetails}`
                )
            );

        }


        if (booking.notes) {

            info.appendChild(
                textElement(
                    "p",
                    `Notas: ${booking.notes}`
                )
            );

        }


        card.appendChild(info);

        card.appendChild(actionButtons(booking));

        container.appendChild(card);

    });

}


// =============================================
// TABLA GENERAL
// =============================================

function renderBookingsTable() {

    const table = $("bookingsTable");

    table.innerHTML = "";

    const search = $("searchClient")
        .value.toLowerCase().trim();


    const filtered = bookings
        .filter(item =>
            item.name.toLowerCase().includes(search) ||
            getSessionName(item).toLowerCase().includes(search)
        )
        .sort((a, b) =>
            a.date.localeCompare(b.date) ||
            a.time.localeCompare(b.time)
        );


    if (filtered.length === 0) {

        const row = document.createElement("tr");

        const cell = textElement(
            "td",
            "No se encontraron reservas."
        );

        cell.colSpan = 8;

        cell.style.textAlign = "center";

        row.appendChild(cell);

        table.appendChild(row);

        return;

    }


    filtered.forEach(booking => {

        const row = document.createElement("tr");

        const values = [

            booking.name,

            formatDate(booking.date),

            getSessionName(booking),

            formatMoney(getSessionPrice(booking)),

            formatMoney(booking.paid),

            formatMoney(getBalance(booking))

        ];


        values.forEach(value => {

            row.appendChild(
                textElement("td", value)
            );

        });


        const status = getBookingStatus(booking);

        const statusCell = document.createElement("td");

        statusCell.appendChild(
            textElement(
                "span",
                status.text,
                `status-badge ${status.className}`
            )
        );

        row.appendChild(statusCell);


        const actionCell = document.createElement("td");

        actionCell.appendChild(actionButtons(booking));

        row.appendChild(actionCell);


        table.appendChild(row);

    });

}


// =============================================
// ELIMINAR RESERVA
// =============================================

function deleteBooking(id) {

    const booking = bookings.find(
        item => item.id === id
    );

    if (!booking) return;


    if (!confirm(
        `¿Eliminar la reserva de ${booking.name}?`
    )) {

        return;

    }


    const previous = [...bookings];

    bookings = bookings.filter(
        item => item.id !== id
    );


    if (!saveBookings()) {

        bookings = previous;

        return;

    }


    refreshDashboard();

}


// =============================================
// ESTADÍSTICAS
// =============================================

function updateStatistics() {

    let salesCents = 0;

    let receivedCents = 0;

    let depositsCents = 0;

    let confirmed = 0;


    bookings.forEach(booking => {

        const price = getSessionPrice(booking);

        const paid = Number(booking.paid) || 0;

        const deposit = getDeposit(price);


        salesCents += toCents(price);

        receivedCents += toCents(paid);

        depositsCents += toCents(deposit);


        if (toCents(paid) >= toCents(deposit)) {

            confirmed++;

        }

    });


    const pendingCents = Math.max(
        0,
        salesCents - receivedCents
    );


    $("totalBookings").textContent =
        bookings.length;

    $("confirmedBookings").textContent =
        confirmed;

    $("totalReceived").textContent =
        formatMoney(fromCents(receivedCents));

    $("totalPending").textContent =
        formatMoney(fromCents(pendingCents));


    $("totalSales").textContent =
        formatMoney(fromCents(salesCents));

    $("totalDeposits").textContent =
        formatMoney(fromCents(depositsCents));

    $("financialReceived").textContent =
        formatMoney(fromCents(receivedCents));


    const percentage = salesCents > 0
        ? (receivedCents / salesCents) * 100
        : 0;


    $("paymentProgress").style.width =
        Math.min(100, percentage) + "%";

    $("progressText").textContent =
        `${percentage.toFixed(1)}% de ingresos cobrados`;

}


// =============================================
// BUSCADOR
// =============================================

$("searchClient").addEventListener(
    "input",
    renderBookingsTable
);


// =============================================
// EXPORTAR BACKUP
// =============================================

$("exportBtn").addEventListener("click", () => {

    const backup = {

        app: BACKUP_APP,

        version: 2,

        exportedAt: new Date().toISOString(),

        bookings

    };


    const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
    );


    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "FR-Creative-Studio-Reservas.json";

    document.body.appendChild(link);

    link.click();

    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

});


// =============================================
// IMPORTAR BACKUP
// =============================================

$("importBtn").addEventListener("click", () => {

    $("importFile").click();

});


$("importFile").addEventListener(
    "change",
    async event => {

        const file = event.target.files[0];

        if (!file) return;


        try {

            const content = await file.text();

            const data = JSON.parse(content);


            const validVersion =
                (
                    data.app === BACKUP_APP &&
                    data.version === 2
                ) ||
                (
                    data.app === LEGACY_BACKUP_APP &&
                    data.version === 1
                );


            if (
                !validVersion ||
                !Array.isArray(data.bookings)
            ) {

                throw new Error("Formato inválido");

            }


            const imported = data.bookings.map(item => {

                if (
                    !item ||
                    typeof item.id !== "string" ||
                    typeof item.name !== "string" ||
                    !item.name.trim() ||
                    typeof item.date !== "string" ||
                    !/^\d{4}-\d{2}-\d{2}$/.test(item.date) ||
                    typeof item.time !== "string" ||
                    !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time) ||
                    (
                        !PACKAGES[item.package] &&
                        !isCustom(item.package)
                    )
                ) {

                    throw new Error("Reserva inválida");

                }


                const [y, m, d] =
                    item.date.split("-").map(Number);

                const parsed = new Date(y, m - 1, d);

                if (
                    parsed.getFullYear() !== y ||
                    parsed.getMonth() !== m - 1 ||
                    parsed.getDate() !== d
                ) {

                    throw new Error("Fecha inválida");

                }


                const price = getSessionPrice(item);

                const paid = Number(item.paid);


                if (
                    !Number.isFinite(price) ||
                    price <= 0 ||
                    !Number.isFinite(paid) ||
                    paid < 0 ||
                    toCents(paid) > toCents(price) ||
                    (
                        isCustom(item.package) &&
                        (
                            typeof item.customName !== "string" ||
                            !item.customName.trim()
                        )
                    )
                ) {

                    throw new Error("Datos financieros inválidos");

                }


                return {

                    id: item.id,

                    name: item.name,

                    phone: String(item.phone || ""),

                    date: item.date,

                    time: item.time,

                    package: item.package,

                    price: fromCents(toCents(price)),

                    customName: String(item.customName || ""),

                    customDetails: String(item.customDetails || ""),

                    paid: fromCents(toCents(paid)),

                    notes: String(item.notes || "")

                };

            });


            const ids = new Set(
                imported.map(item => item.id)
            );

            if (ids.size !== imported.length) {

                throw new Error("Reservas duplicadas");

            }


            if (!confirm(
                "Esta importación reemplazará todas las reservas actuales. " +
                "¿Deseas continuar?"
            )) {

                return;

            }


            const previous = [...bookings];

            bookings = imported;


            if (!saveBookings()) {

                bookings = previous;

                return;

            }


            refreshDashboard();

            alert("Reservas importadas correctamente.");


        } catch (error) {

            console.error(error);

            alert(
                "No se pudo importar el archivo. " +
                "Verifica que sea una copia válida."
            );

        } finally {

            event.target.value = "";

        }

    }
);


// =============================================
// ACTUALIZAR SISTEMA
// =============================================

function refreshDashboard() {

    renderCalendar();

    renderDailyBookings();

    renderBookingsTable();

    updateStatistics();

}


// =============================================
// INICIAR
// =============================================

refreshDashboard();