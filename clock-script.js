// ============================================================================
// RELOJ DIGITAL GLOBAL CON MÚLTIPLES ZONAS HORARIAS
// ============================================================================
// Sistema de visualización de hora actual en diferentes zonas del mundo

class GlobalClock {
    constructor() {
        // Zonas horarias predeterminadas
        this.defaultTimezones = [
            { timezone: 'America/New_York', label: 'Nueva York' },
            { timezone: 'Europe/London', label: 'Londres' },
            { timezone: 'Europe/Paris', label: 'París' },
            { timezone: 'Asia/Tokyo', label: 'Tokio' },
            { timezone: 'Australia/Sydney', label: 'Sídney' },
            { timezone: 'Asia/Dubai', label: 'Dubái' },
            { timezone: 'America/Los_Angeles', label: 'Los Ángeles' },
            { timezone: 'America/Mexico_City', label: 'Ciudad de México' },
            { timezone: 'America/Sao_Paulo', label: 'São Paulo' },
            { timezone: 'Africa/Cairo', label: 'El Cairo' },
            { timezone: 'Asia/Singapore', label: 'Singapur' },
            { timezone: 'Asia/Hong_Kong', label: 'Hong Kong' }
        ];

        // Obtener todas las zonas horarias disponibles
        this.allTimezones = this.getAllTimezones();

        // Variables de control
        this.format24 = true;
        this.customTimezones = this.loadCustomTimezones();
        this.searchTerm = '';

        // DOM Elements
        this.timezoneGrid = document.getElementById('timezoneGrid');
        this.customList = document.getElementById('customList');
        this.searchInput = document.getElementById('searchInput');
        this.timezoneSelect = document.getElementById('timezoneSelect');
        this.timezoneLabel = document.getElementById('timezoneLabel');

        // Event Listeners
        this.attachEventListeners();

        // Inicializar
        this.populateTimezoneSelect();
        this.render();

        // Actualizar cada segundo
        setInterval(() => this.render(), 1000);
    }

    getAllTimezones() {
        // Lista de zonas horarias principales del mundo
        return [
            'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi', 'Africa/Harare',
            'America/Anchorage', 'America/Bogota', 'America/Buenos_Aires', 'America/Caracas', 'America/Chicago',
            'America/Denver', 'America/El_Salvador', 'America/Jamaica', 'America/Los_Angeles', 'America/Mexico_City',
            'America/New_York', 'America/Panama', 'America/Phoenix', 'America/Sao_Paulo', 'America/Toronto',
            'America/Vancouver', 'America/Whitehorse', 'Asia/Almaty', 'Asia/Amman', 'Asia/Ashgabat',
            'Asia/Baghdad', 'Asia/Bahrain', 'Asia/Bangkok', 'Asia/Beirut', 'Asia/Bishkek',
            'Asia/Brunei', 'Asia/Calcutta', 'Asia/Choibalsan', 'Asia/Chongqing', 'Asia/Colombo',
            'Asia/Damascus', 'Asia/Dhaka', 'Asia/Dili', 'Asia/Dubai', 'Asia/Dushanbe',
            'Asia/Gaza', 'Asia/Harbin', 'Asia/Ho_Chi_Minh', 'Asia/Hong_Kong', 'Asia/Hovd',
            'Asia/Irkutsk', 'Asia/Istanbul', 'Asia/Jakarta', 'Asia/Jerusalem', 'Asia/Kabul',
            'Asia/Kamchatka', 'Asia/Kathmandu', 'Asia/Krasnoyarsk', 'Asia/Kuala_Lumpur', 'Asia/Kuching',
            'Asia/Kuwait', 'Asia/Macau', 'Asia/Magadan', 'Asia/Manila', 'Asia/Muscat',
            'Asia/Nicosia', 'Asia/Novosibirsk', 'Asia/Omsk', 'Asia/Oral', 'Asia/Penang',
            'Asia/Phnom_Penh', 'Asia/Pontianak', 'Asia/Pyongyang', 'Asia/Qatar', 'Asia/Rangoon',
            'Asia/Riyadh', 'Asia/Saigon', 'Asia/Sakhalin', 'Asia/Samara', 'Asia/Samarkand',
            'Asia/Seoul', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Taipei', 'Asia/Tashkent',
            'Asia/Tbilisi', 'Asia/Tehran', 'Asia/Tel_Aviv', 'Asia/Thimbu', 'Asia/Tokyo',
            'Asia/Tomsk', 'Asia/Ujung_Pandang', 'Asia/Ulaanbaatar', 'Asia/Urumqi', 'Asia/Ust-Nera',
            'Asia/Vientiane', 'Asia/Vladivostok', 'Asia/Yakutsk', 'Asia/Yekaterinburg', 'Asia/Yerevan',
            'Atlantic/Azores', 'Atlantic/Bermuda', 'Atlantic/Canary', 'Atlantic/Cape_Verde', 'Atlantic/Faroe',
            'Atlantic/Madeira', 'Atlantic/Reykjavik', 'Atlantic/South_Georgia', 'Atlantic/St_Helena', 'Atlantic/Stanley',
            'Australia/Adelaide', 'Australia/Brisbane', 'Australia/Broken_Hill', 'Australia/Currie', 'Australia/Darwin',
            'Australia/Eucla', 'Australia/Hobart', 'Australia/Lindeman', 'Australia/Lord_Howe', 'Australia/Melbourne',
            'Australia/Perth', 'Australia/Sydney', 'Europe/Amsterdam', 'Europe/Andorra', 'Europe/Athens',
            'Europe/Belfast', 'Europe/Belgrade', 'Europe/Berlin', 'Europe/Bratislava', 'Europe/Brussels',
            'Europe/Bucharest', 'Europe/Budapest', 'Europe/Chisinau', 'Europe/Copenhagen', 'Europe/Dublin',
            'Europe/Gibraltar', 'Europe/Guernsey', 'Europe/Helsinki', 'Europe/Isle_of_Man', 'Europe/Istanbul',
            'Europe/Jersey', 'Europe/Kaliningrad', 'Europe/Kiev', 'Europe/Lisbon', 'Europe/Ljubljana',
            'Europe/London', 'Europe/Luxembourg', 'Europe/Madrid', 'Europe/Malta', 'Europe/Mariehamn',
            'Europe/Minsk', 'Europe/Monaco', 'Europe/Moscow', 'Europe/Oslo', 'Europe/Paris',
            'Europe/Podgorica', 'Europe/Prague', 'Europe/Riga', 'Europe/Rome', 'Europe/Samara',
            'Europe/San_Marino', 'Europe/Sarajevo', 'Europe/Simferopol', 'Europe/Skopje', 'Europe/Sofia',
            'Europe/Stockholm', 'Europe/Tallinn', 'Europe/Tirane', 'Europe/Uzhgorod', 'Europe/Vaduz',
            'Europe/Vatican', 'Europe/Vienna', 'Europe/Vilnius', 'Europe/Volgograd', 'Europe/Warsaw',
            'Europe/Zagreb', 'Europe/Zaporozhye', 'Europe/Zurich', 'Indian/Antananarivo', 'Indian/Chagos',
            'Indian/Christmas', 'Indian/Cocos', 'Indian/Comoro', 'Indian/Kerguelen', 'Indian/Mahe',
            'Indian/Maldives', 'Indian/Mauritius', 'Indian/Mayotte', 'Indian/Reunion', 'Pacific/Apia',
            'Pacific/Auckland', 'Pacific/Chatham', 'Pacific/Chuuk', 'Pacific/Easter', 'Pacific/Efate',
            'Pacific/Fakaofo', 'Pacific/Fiji', 'Pacific/Funafuti', 'Pacific/Galapagos', 'Pacific/Gambier',
            'Pacific/Guadalcanal', 'Pacific/Guam', 'Pacific/Honolulu', 'Pacific/Johnston', 'Pacific/Kiritimati',
            'Pacific/Kosrae', 'Pacific/Kwajalein', 'Pacific/Majuro', 'Pacific/Marquesas', 'Pacific/Midway',
            'Pacific/Nauru', 'Pacific/Niue', 'Pacific/Norfolk', 'Pacific/Noumea', 'Pacific/Pago_Pago',
            'Pacific/Palau', 'Pacific/Palmyra', 'Pacific/Papeete', 'Pacific/Pitcairn', 'Pacific/Ponape',
            'Pacific/Port_Moresby', 'Pacific/Rarotonga', 'Pacific/Saipan', 'Pacific/Samoa', 'Pacific/Tahiti',
            'Pacific/Tarawa', 'Pacific/Tongatapu', 'Pacific/Truk', 'Pacific/Wake', 'Pacific/Wallis',
            'Pacific/Yap', 'UTC'
        ];
    }

    attachEventListeners() {
        document.getElementById('format24Btn').addEventListener('click', () => {
            this.format24 = true;
            this.updateFormatButtons();
            this.render();
        });

        document.getElementById('format12Btn').addEventListener('click', () => {
            this.format24 = false;
            this.updateFormatButtons();
            this.render();
        });

        this.searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.render();
        });

        document.getElementById('clearSearchBtn').addEventListener('click', () => {
            this.searchInput.value = '';
            this.searchTerm = '';
            this.render();
        });

        document.getElementById('addBtn').addEventListener('click', () => this.addCustomTimezone());

        this.timezoneSelect.addEventListener('change', () => {
            const selected = this.timezoneSelect.value;
            if (selected && !this.customTimezones.some(tz => tz.timezone === selected)) {
                this.timezoneLabel.value = selected.split('/').pop().replace(/_/g, ' ');
            }
        });
    }

    updateFormatButtons() {
        document.getElementById('format24Btn').classList.toggle('active', this.format24);
        document.getElementById('format12Btn').classList.toggle('active', !this.format24);
    }

    populateTimezoneSelect() {
        this.allTimezones.forEach(tz => {
            const option = document.createElement('option');
            option.value = tz;
            option.textContent = tz;
            this.timezoneSelect.appendChild(option);
        });
    }

    addCustomTimezone() {
        const timezone = this.timezoneSelect.value;
        const label = this.timezoneLabel.value.trim();

        if (!timezone) {
            alert('Por favor selecciona una zona horaria');
            return;
        }

        if (this.customTimezones.some(tz => tz.timezone === timezone)) {
            alert('Esta zona horaria ya está agregada');
            return;
        }

        const customLabel = label || timezone.split('/').pop().replace(/_/g, ' ');

        this.customTimezones.push({
            timezone,
            label: customLabel,
            id: Date.now()
        });

        this.saveCustomTimezones();
        this.timezoneSelect.value = '';
        this.timezoneLabel.value = '';
        this.render();
    }

    deleteCustomTimezone(id) {
        this.customTimezones = this.customTimezones.filter(tz => tz.id !== id);
        this.saveCustomTimezones();
        this.render();
    }

    saveCustomTimezones() {
        localStorage.setItem('customTimezones', JSON.stringify(this.customTimezones));
    }

    loadCustomTimezones() {
        const saved = localStorage.getItem('customTimezones');
        return saved ? JSON.parse(saved) : [];
    }

    getTime(timezone) {
        try {
            const formatter = new Intl.DateTimeFormat('es-ES', {
                timeZone: timezone,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: !this.format24
            });

            const date = new Date();
            const parts = formatter.formatToParts(date);
            let time = '';

            parts.forEach(part => {
                if (part.type !== 'literal') {
                    time += part.value;
                } else if (part.value === ':') {
                    time += ':';
                } else if (part.value === ' ') {
                    time += ' ';
                }
            });

            return time;
        } catch (e) {
            return '--:--:--';
        }
    }

    getDate(timezone) {
        try {
            const formatter = new Intl.DateTimeFormat('es-ES', {
                timeZone: timezone,
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });

            return formatter.format(new Date());
        } catch (e) {
            return '';
        }
    }

    render() {
        this.renderDefaultClocks();
        this.renderCustomClocks();
    }

    renderDefaultClocks() {
        const filtered = this.defaultTimezones.filter(tz =>
            tz.label.toLowerCase().includes(this.searchTerm) ||
            tz.timezone.toLowerCase().includes(this.searchTerm)
        );

        this.timezoneGrid.innerHTML = filtered.map(tz => `
            <div class="clock-card">
                <div class="timezone-name">${tz.label}</div>
                <div class="digital-clock">${this.getTime(tz.timezone)}</div>
                <div class="time-period"></div>
                <div class="date-display">${this.getDate(tz.timezone)}</div>
            </div>
        `).join('');

        if (filtered.length === 0 && this.searchTerm) {
            this.timezoneGrid.innerHTML = `
                <div class="empty-state">
                    <p>No se encontraron zonas horarias que coincidan con: "${this.searchTerm}"</p>
                </div>
            `;
        }
    }

    renderCustomClocks() {
        if (this.customTimezones.length === 0) {
            this.customList.innerHTML = `
                <div class="empty-state">
                    <p>No has agregado zonas personalizadas aún</p>
                </div>
            `;
            return;
        }

        this.customList.innerHTML = this.customTimezones.map(tz => `
            <div class="clock-card">
                <div class="timezone-name">${tz.label}</div>
                <div class="digital-clock">${this.getTime(tz.timezone)}</div>
                <div class="time-period"></div>
                <div class="date-display">${this.getDate(tz.timezone)}</div>
                <button class="delete-btn" onclick="globalClock.deleteCustomTimezone(${tz.id})">Eliminar</button>
            </div>
        `).join('');
    }
}

// Inicializar cuando el documento está listo
let globalClock;
document.addEventListener('DOMContentLoaded', () => {
    globalClock = new GlobalClock();
});