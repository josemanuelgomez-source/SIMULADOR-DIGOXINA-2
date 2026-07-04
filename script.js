// ============================================================================
// SIMULADOR EDUCATIVO: DIGOXINA Y LA BOMBA Na+/K+-ATPasa
// ============================================================================
// Sistema de animación que modela la fisiología celular con física interactiva

class DigoxinaSimulator {
    constructor() {
        // Canvas principal
        this.canvas = document.getElementById('membraneCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Canvas del gráfico
        this.graphCanvas = document.getElementById('performanceChart');
        this.graphCtx = this.graphCanvas.getContext('2d');

        // Controles
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.speedBtn = document.getElementById('speedBtn');
        this.digoxinSlider = document.getElementById('digoxinSlider');

        // Estado de simulación
        this.isRunning = false;
        this.isPaused = false;
        this.speedMultiplier = 1;
        this.time = 0;

        // Variables fisiológicas
        this.naIntracellular = 150;
        this.naExtracellular = 145;
        this.kIntracellular = 5;
        this.kExtracellular = 140;
        this.caIntracellular = 0.1;

        // ATPasas y Intercambiadores
        this.pumps = [];
        this.exchangers = [];
        this.digoxinaMolecules = [];
        this.atpParticles = [];

        // Historial para gráfico
        this.graphData = [];
        this.maxGraphPoints = 100;

        // Inicializar
        this.initializePumpsAndExchangers();
        this.attachEventListeners();
        this.updateCounters();

        // Iniciar loop de animación
        this.animationFrameId = null;
        this.startAnimation();
    }

    initializePumpsAndExchangers() {
        const membraneY = this.canvas.height / 2;
        const proteinSpacing = this.canvas.width / 20;

        // Crear 20 proteínas alternadas: 10 ATPasas y 10 NCX
        for (let i = 0; i < 20; i++) {
            const x = (i + 0.5) * proteinSpacing;

            if (i % 2 === 0) {
                // Bomba Na+/K+-ATPasa (posiciones pares)
                this.pumps.push(new NaKATPase(x, membraneY, this));
            } else {
                // Intercambiador Na+/Ca2+ (posiciones impares)
                this.exchangers.push(new NCXExchanger(x, membraneY, this));
            }
        }
    }

    attachEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.toggle());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.speedBtn.addEventListener('click', () => this.changeSpeed());
        this.digoxinSlider.addEventListener('input', (e) => this.updateDigoxinLevel(e));
    }

    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.startBtn.textContent = 'Simulación en ejecución';
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
    }

    toggle() {
        this.isPaused = !this.isPaused;
        this.pauseBtn.textContent = this.isPaused ? 'Reanudar' : 'Pausar';
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.time = 0;
        this.speedMultiplier = 1;
        this.naIntracellular = 150;
        this.naExtracellular = 145;
        this.kIntracellular = 5;
        this.kExtracellular = 140;
        this.caIntracellular = 0.1;
        this.digoxinaMolecules = [];
        this.atpParticles = [];
        this.graphData = [];

        this.pumps.forEach(pump => pump.reset());
        this.exchangers.forEach(ex => ex.reset());

        this.startBtn.textContent = 'Iniciar Simulación';
        this.startBtn.disabled = false;
        this.pauseBtn.textContent = 'Pausar';
        this.pauseBtn.disabled = true;
        this.speedBtn.textContent = 'Velocidad ×1';
        this.digoxinSlider.value = 0;

        this.updateCounters();
        this.draw();
    }

    changeSpeed() {
        this.speedMultiplier = this.speedMultiplier === 1 ? 2 : 1;
        this.speedBtn.textContent = `Velocidad ×${this.speedMultiplier}`;
    }

    updateDigoxinLevel(e) {
        const concentration = parseInt(e.target.value);
        document.getElementById('digoxinValue').textContent = concentration;

        // Generar moléculas de digoxina según concentración
        if (this.isRunning && !this.isPaused) {
            const targetCount = Math.floor((concentration / 100) * 15);
            while (this.digoxinaMolecules.length < targetCount) {
                this.digoxinaMolecules.push(new DigoxinaMolecule(this));
            }
        }
    }

    update(deltaTime) {
        if (!this.isRunning || this.isPaused) return;

        const dt = deltaTime * this.speedMultiplier;

        // Actualizar ATPasas
        this.pumps.forEach(pump => pump.update(dt));

        // Actualizar Intercambiadores Na+/Ca2+
        this.exchangers.forEach(exchanger => exchanger.update(dt));

        // Actualizar moléculas de digoxina
        this.digoxinaMolecules = this.digoxinaMolecules.filter(mol => !mol.isDead);
        this.digoxinaMolecules.forEach(mol => mol.update(dt));

        // Actualizar partículas ATP
        this.atpParticles = this.atpParticles.filter(atp => !atp.isDead);
        this.atpParticles.forEach(atp => atp.update(dt));

        // Detectar colisiones digoxina-ATPasa
        this.checkDigoxinaPumpCollisions();

        // Actualizar concentraciones de iones
        this.updateIonConcentrations();

        // Actualizar gráfico cada 50 ms
        if (this.time % 5 === 0) {
            this.updateGraphData();
        }

        this.time++;
        this.updateCounters();
    }

    checkDigoxinaPumpCollisions() {
        this.digoxinaMolecules.forEach(digoxina => {
            if (digoxina.isAttached) return;

            this.pumps.forEach(pump => {
                if (pump.isBlocked) return;

                // Distancia euclidiana simple
                const dx = digoxina.x - pump.x;
                const dy = digoxina.y - pump.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 25) {
                    digoxina.attachTo(pump);
                    pump.block(digoxina);
                }
            });
        });
    }

    updateIonConcentrations() {
        // Cálculo fisiológico simplificado
        const activePumpsCount = this.pumps.filter(p => !p.isBlocked).length;
        const blockedPumpsCount = this.pumps.filter(p => p.isBlocked).length;

        // Las ATPasas activas disminuyen Na+ intracelular
        if (activePumpsCount > 0) {
            this.naIntracellular -= activePumpsCount * 0.05;
            this.kIntracellular += activePumpsCount * 0.03;
        }

        // Al bloquearse ATPasas, se acumula Na+ intracelular
        if (blockedPumpsCount > 0) {
            this.naIntracellular += blockedPumpsCount * 0.02;
        }

        // Limitar rangos fisiológicos
        this.naIntracellular = Math.max(140, Math.min(160, this.naIntracellular));
        this.kIntracellular = Math.max(3, Math.min(8, this.kIntracellular));
    }

    updateGraphData() {
        const digoxinConcentration = parseInt(this.digoxinSlider.value);
        const activePumpsCount = this.pumps.filter(p => !p.isBlocked).length;

        this.graphData.push({
            digoxin: digoxinConcentration,
            activePumps: activePumpsCount
        });

        if (this.graphData.length > this.maxGraphPoints) {
            this.graphData.shift();
        }
    }

    updateCounters() {
        document.getElementById('naIntracellular').textContent = this.naIntracellular.toFixed(1);
        document.getElementById('naExtracellular').textContent = this.naExtracellular.toFixed(1);
        document.getElementById('kIntracellular').textContent = this.kIntracellular.toFixed(1);
        document.getElementById('kExtracellular').textContent = this.kExtracellular.toFixed(1);
        document.getElementById('caIntracellular').textContent = this.caIntracellular.toFixed(2);

        const activePumpsCount = this.pumps.filter(p => !p.isBlocked).length;
        const blockedPumpsCount = this.pumps.filter(p => p.isBlocked).length;
        document.getElementById('activePumps').textContent = activePumpsCount;
        document.getElementById('blockedPumps').textContent = blockedPumpsCount;

        // Velocidad del intercambiador basada en Na+ intracelular
        // A mayor Na+ intracelular, menor velocidad (relación inversa)
        const exchangerSpeed = Math.max(30, 130 - this.naIntracellular);
        document.getElementById('exchangerSpeed').textContent = Math.round(exchangerSpeed);
    }

    draw() {
        // Limpiar canvas principal
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Dibujar membrana y componentes
        this.drawMembrane();
        this.drawExtracellularSpace();
        this.drawCytoplasm();

        // Dibujar fosfolípidos
        this.drawPhospholipids();

        // Dibujar moléculas de digoxina
        this.digoxinaMolecules.forEach(mol => mol.draw(this.ctx));

        // Dibujar ATPasas
        this.pumps.forEach(pump => pump.draw(this.ctx));

        // Dibujar Intercambiadores
        this.exchangers.forEach(exchanger => exchanger.draw(this.ctx));

        // Dibujar partículas ATP
        this.atpParticles.forEach(atp => atp.draw(this.ctx));

        // Dibujar gráfico
        this.drawGraph();
    }

    drawMembrane() {
        const membraneY = this.canvas.height / 2;
        const membraneThickness = 8;

        // Línea de membrana
        this.ctx.strokeStyle = '#999';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, membraneY);
        this.ctx.lineTo(this.canvas.width, membraneY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawExtracellularSpace() {
        const membraneY = this.canvas.height / 2;
        this.ctx.fillStyle = 'rgba(227, 242, 253, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, membraneY);

        this.ctx.fillStyle = '#0284c7';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('ESPACIO EXTRACELULAR', 20, 25);
    }

    drawCytoplasm() {
        const membraneY = this.canvas.height / 2;
        this.ctx.fillStyle = 'rgba(243, 229, 245, 0.5)';
        this.ctx.fillRect(0, membraneY, this.canvas.width, this.canvas.height - membraneY);

        this.ctx.fillStyle = '#a855f7';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('CITOPLASMA', 20, this.canvas.height - 15);
    }

    drawPhospholipids() {
        const membraneY = this.canvas.height / 2;
        const spacing = 15;
        const headRadius = 3;
        const tailLength = 8;

        for (let x = 0; x < this.canvas.width; x += spacing) {
            // Cabeza (esfera verde claro)
            this.ctx.fillStyle = '#90ee90';
            this.ctx.beginPath();
            this.ctx.arc(x, membraneY, headRadius, 0, Math.PI * 2);
            this.ctx.fill();

            // Colas (líneas hacia adentro)
            this.ctx.strokeStyle = '#90ee90';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x - 2, membraneY - headRadius);
            this.ctx.lineTo(x - 4, membraneY - tailLength);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(x + 2, membraneY + headRadius);
            this.ctx.lineTo(x + 4, membraneY + tailLength);
            this.ctx.stroke();
        }
    }

    drawGraph() {
        const padding = 50;
        const width = this.graphCanvas.width - 2 * padding;
        const height = this.graphCanvas.height - 2 * padding;

        // Fondo
        this.graphCtx.fillStyle = '#f9f9f9';
        this.graphCtx.fillRect(0, 0, this.graphCanvas.width, this.graphCanvas.height);

        // Ejes
        this.graphCtx.strokeStyle = '#333';
        this.graphCtx.lineWidth = 2;
        this.graphCtx.beginPath();
        this.graphCtx.moveTo(padding, height + padding);
        this.graphCtx.lineTo(padding, padding);
        this.graphCtx.lineTo(this.graphCanvas.width - padding, padding);
        this.graphCtx.stroke();

        // Etiqueta eje X
        this.graphCtx.fillStyle = '#333';
        this.graphCtx.font = 'bold 12px Arial';
        this.graphCtx.textAlign = 'center';
        this.graphCtx.fillText('Concentración Digoxina (%)', this.graphCanvas.width / 2, this.graphCanvas.height - 15);

        // Etiqueta eje Y
        this.graphCtx.save();
        this.graphCtx.translate(20, this.graphCanvas.height / 2);
        this.graphCtx.rotate(-Math.PI / 2);
        this.graphCtx.textAlign = 'center';
        this.graphCtx.fillText('ATPasas Activas', 0, 0);
        this.graphCtx.restore();

        // Líneas guía
        this.graphCtx.strokeStyle = '#ddd';
        this.graphCtx.lineWidth = 1;
        for (let i = 1; i < 10; i++) {
            const y = padding + (i / 10) * height;
            this.graphCtx.beginPath();
            this.graphCtx.moveTo(padding - 5, y);
            this.graphCtx.lineTo(this.graphCanvas.width - padding, y);
            this.graphCtx.stroke();
        }

        // Dibujar línea del gráfico
        if (this.graphData.length > 1) {
            this.graphCtx.strokeStyle = '#667eea';
            this.graphCtx.lineWidth = 3;
            this.graphCtx.beginPath();

            this.graphData.forEach((data, index) => {
                const xPos = padding + (index / this.maxGraphPoints) * width;
                const yPos = height + padding - (data.activePumps / 10) * height;

                if (index === 0) {
                    this.graphCtx.moveTo(xPos, yPos);
                } else {
                    this.graphCtx.lineTo(xPos, yPos);
                }
            });

            this.graphCtx.stroke();

            // Puntos
            this.graphCtx.fillStyle = '#667eea';
            this.graphData.forEach((data, index) => {
                const xPos = padding + (index / this.maxGraphPoints) * width;
                const yPos = height + padding - (data.activePumps / 10) * height;
                this.graphCtx.beginPath();
                this.graphCtx.arc(xPos, yPos, 4, 0, Math.PI * 2);
                this.graphCtx.fill();
            });
        }
    }

    startAnimation() {
        const animate = (timestamp) => {
            const deltaTime = 1 / 60; // 60 FPS
            this.update(deltaTime);
            this.draw();
            this.animationFrameId = requestAnimationFrame(animate);
        };
        this.animationFrameId = requestAnimationFrame(animate);
    }
}

// ============================================================================
// CLASE: BOMBA Na+/K+-ATPasa
// ============================================================================
// Simula el mecanismo de transporte activo que expulsa 3 Na+ e introduce 2 K+
// consumiendo 1 ATP por ciclo

class NaKATPase {
    constructor(x, y, simulator) {
        this.x = x;
        this.y = y;
        this.simulator = simulator;
        this.radius = 20;

        // Estado de animación
        this.phase = 0; // 0-1, representa la posición en el ciclo
        this.cycleTime = 1000; // ms por ciclo
        this.elapsedTime = 0;

        // Estado de bloqueo
        this.isBlocked = false;
        this.blockingDigoxina = null;

        // Iones en tránsito
        this.ions = [];
    }

    reset() {
        this.phase = 0;
        this.elapsedTime = 0;
        this.isBlocked = false;
        this.blockingDigoxina = null;
        this.ions = [];
    }

    update(dt) {
        if (this.isBlocked) return;

        this.elapsedTime += dt * 1000; // Convertir a ms

        if (this.elapsedTime >= this.cycleTime) {
            this.elapsedTime = 0;
            this.executeCycle();
        }

        this.phase = this.elapsedTime / this.cycleTime;

        // Mover iones en tránsito
        this.ions = this.ions.filter(ion => !ion.isDead);
        this.ions.forEach(ion => ion.update(dt));
    }

    executeCycle() {
        // Crear ATP que se consume
        this.simulator.atpParticles.push(new ATPParticle(this.x, this.y, this.simulator));

        // Expulsar 3 Na+ hacia el exterior
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 3;
            const ion = new Ion('Na+', this.x, this.y, angle, 'exterior');
            this.ions.push(ion);
        }

        // Introducir 2 K+ desde el exterior
        for (let i = 0; i < 2; i++) {
            const angle = Math.PI + (Math.PI / 3) * i - Math.PI / 6;
            const ion = new Ion('K+', this.x, this.y, angle, 'interior');
            this.ions.push(ion);
        }
    }

    block(digoxina) {
        this.isBlocked = true;
        this.blockingDigoxina = digoxina;
    }

    draw(ctx) {
        // Color según estado
        const color = this.isBlocked ? '#1a1a4d' : '#87ceeb';

        // Hemisferio extracelular (superior)
        const y1 = this.y - this.radius * Math.sin(this.phase * Math.PI);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(this.x, y1, this.radius, this.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Concavidades para Na+ (3 ranuras)
        if (!this.isBlocked) {
            ctx.fillStyle = 'rgba(100, 100, 255, 0.6)';
            for (let i = 0; i < 3; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 3;
                const cx = this.x + Math.cos(angle) * (this.radius * 0.6);
                const cy = y1 + Math.sin(angle) * (this.radius * 0.4);
                ctx.beginPath();
                ctx.arc(cx, cy, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Hemisferio citoplasmático (inferior)
        const y2 = this.y + this.radius * Math.sin(this.phase * Math.PI);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(this.x, y2, this.radius, this.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ranuras para K+ (2 triángulos verdes)
        if (!this.isBlocked) {
            ctx.fillStyle = 'rgba(144, 238, 144, 0.7)';
            for (let i = 0; i < 2; i++) {
                const angle = Math.PI + (Math.PI / 3) * i - Math.PI / 6;
                const cx = this.x + Math.cos(angle) * (this.radius * 0.6);
                const cy = y2 + Math.sin(angle) * (this.radius * 0.4);
                ctx.beginPath();
                ctx.moveTo(cx - 4, cy);
                ctx.lineTo(cx + 4, cy);
                ctx.lineTo(cx, cy + 5);
                ctx.closePath();
                ctx.fill();
            }
        }

        // Marcador de bloqueo (esfera fucsia)
        if (this.isBlocked) {
            ctx.fillStyle = '#ff1493';
            ctx.beginPath();
            ctx.arc(this.x, y1 - 12, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Dibujar iones en tránsito
        this.ions.forEach(ion => ion.draw(ctx));
    }
}

// ============================================================================
// CLASE: INTERCAMBIADOR Na+/Ca2+ (NCX)
// ============================================================================
// Simula el transporte pasivo: 3 Na+ intracelular + 1 Ca2+ extracelular

class NCXExchanger {
    constructor(x, y, simulator) {
        this.x = x;
        this.y = y;
        this.simulator = simulator;
        this.radius = 18;

        // Estado de animación
        this.phase = 0; // 0-1, representa el ciclo
        this.baseSpeed = 1.5; // ciclos por segundo, afectado por Na+ intracelular

        // Iones en tránsito
        this.ions = [];

        // Tiempo base del ciclo
        this.elapsedTime = 0;
    }

    reset() {
        this.phase = 0;
        this.elapsedTime = 0;
        this.ions = [];
    }

    update(dt) {
        // Velocidad del intercambiador inversamente proporcional al Na+ intracelular
        // Fórmula: A mayor Na+ intracelular, menor velocidad de intercambio
        const naGradient = (160 - this.simulator.naIntracellular) / 20;
        const speed = Math.max(0.3, this.baseSpeed * naGradient);

        this.elapsedTime += dt * speed;

        if (this.elapsedTime >= 1) {
            this.elapsedTime -= 1;
            this.executeCycle();
        }

        this.phase = this.elapsedTime;

        // Mover iones en tránsito
        this.ions = this.ions.filter(ion => !ion.isDead);
        this.ions.forEach(ion => ion.update(dt));
    }

    executeCycle() {
        // 3 Na+ salen del citoplasma hacia el exterior
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI / 4) * i - Math.PI / 4;
            const ion = new Ion('Na+', this.x, this.y, angle, 'exterior');
            this.ions.push(ion);
        }

        // 1 Ca2+ entra desde el exterior
        const caAngle = Math.PI + (Math.PI / 3);
        const caIon = new Ion('Ca2+', this.x, this.y, caAngle, 'interior');
        this.ions.push(caIon);

        // Aumentar Ca2+ intracelular ligeramente
        this.simulator.caIntracellular += 0.01;
    }

    draw(ctx) {
        // Canal cilíndrico naranja que representa el intercambiador
        const openness = Math.sin(this.phase * Math.PI);

        // Cilindro exterior
        ctx.fillStyle = '#ff8c00';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.radius * 0.7, this.radius, 0, 0, Math.PI * 2);
        ctx.fill();

        // Canal interior visible
        ctx.fillStyle = 'rgba(255, 200, 124, 0.8)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.radius * 0.4, this.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Marcas de apertura
        ctx.strokeStyle = '#cc6600';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x - this.radius * 0.5, this.y - this.radius);
        ctx.lineTo(this.x - this.radius * 0.5, this.y + this.radius);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.x + this.radius * 0.5, this.y - this.radius);
        ctx.lineTo(this.x + this.radius * 0.5, this.y + this.radius);
        ctx.stroke();

        // Dibujar iones en tránsito
        this.ions.forEach(ion => ion.draw(ctx));
    }
}

// ============================================================================
// CLASE: ION (Na+, K+, Ca2+)
// ============================================================================
// Representa un ión individual moviéndose a través de la membrana

class Ion {
    constructor(type, x, y, angle, direction) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.angle = angle;
        this.direction = direction; // 'interior' o 'exterior'

        this.speed = 15; // píxeles/segundo - REDUCIDO DE 60 A 15 PARA RALENTIZAR
        this.distance = 0;
        this.maxDistance = 40;
        this.isDead = false;

        // Color según tipo
        this.colors = {
            'Na+': '#4169e1',
            'K+': '#90ee90',
            'Ca2+': '#ff6347'
        };
    }

    update(dt) {
        this.distance += this.speed * dt;

        // Calcular nueva posición
        this.x = this.startX + Math.cos(this.angle) * this.distance;
        this.y = this.startY + Math.sin(this.angle) * this.distance;

        if (this.distance >= this.maxDistance) {
            this.isDead = true;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.colors[this.type];
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Etiqueta del ión
        ctx.fillStyle = '#333';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.type, this.x, this.y + 3);
    }
}

// ============================================================================
// CLASE: DIGOXINA
// ============================================================================
// Representa una molécula de digoxina moviéndose mediante difusión browniana

class DigoxinaMolecule {
    constructor(simulator) {
        this.simulator = simulator;
        this.x = Math.random() * simulator.canvas.width;
        this.y = Math.random() * (simulator.canvas.height / 2 - 10) + 10; // Solo en espacio extracelular

        this.vx = (Math.random() - 0.5) * 5; // Velocidad browniana - REDUCIDA
        this.vy = (Math.random() - 0.5) * 5;

        this.radius = 6;
        this.isAttached = false;
        this.isDead = false;
    }

    update(dt) {
        if (this.isAttached) return;

        // Movimiento browniano
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Ruido aleatorio - REDUCIDO
        this.vx += (Math.random() - 0.5) * 3;
        this.vy += (Math.random() - 0.5) * 3;

        // Limitar velocidad - MÁS LENTO
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 15) {
            this.vx = (this.vx / speed) * 15;
            this.vy = (this.vy / speed) * 15;
        }

        // Rebote en bordes
        if (this.x < 0 || this.x > this.simulator.canvas.width) {
            this.vx *= -1;
        }
        if (this.y < 0 || this.y > this.simulator.canvas.height / 2) {
            this.vy *= -1;
        }

        this.x = Math.max(0, Math.min(this.simulator.canvas.width, this.x));
        this.y = Math.max(0, Math.min(this.simulator.canvas.height / 2, this.y));
    }

    attachTo(pump) {
        this.isAttached = true;
        this.x = pump.x;
        this.y = pump.y - pump.radius - 10;
    }

    draw(ctx) {
        ctx.fillStyle = '#2d5016';
        ctx.beginPath();

        if (this.isAttached) {
            // Forma fija acoplada
            ctx.moveTo(this.x - 8, this.y - 3);
            ctx.lineTo(this.x, this.y - 8);
            ctx.lineTo(this.x + 8, this.y - 3);
            ctx.lineTo(this.x + 5, this.y + 8);
            ctx.lineTo(this.x - 5, this.y + 8);
        } else {
            // Forma de V móvil
            ctx.moveTo(this.x - 6, this.y - 4);
            ctx.lineTo(this.x, this.y + 4);
            ctx.lineTo(this.x + 6, this.y - 4);
        }

        ctx.fill();
    }
}

// ============================================================================
// CLASE: PARTÍCULA ATP
// ============================================================================
// Representa una partícula de ATP que se consume en la ATPasa

class ATPParticle {
    constructor(x, y, simulator) {
        this.x = x;
        this.y = y;
        this.simulator = simulator;

        this.vx = (Math.random() - 0.5) * 40;
        this.vy = (Math.random() - 0.5) * 40 - 30; // Tiende hacia arriba

        this.life = 0.5; // segundos
        this.maxLife = 0.5;
        this.isDead = false;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 50 * dt; // Gravedad

        this.life -= dt;

        if (this.life <= 0) {
            this.isDead = true;
        }
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;

        ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Brillo
        ctx.strokeStyle = `rgba(255, 255, 150, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================
// Cuando el documento está listo, crear la instancia del simulador

document.addEventListener('DOMContentLoaded', () => {
    new DigoxinaSimulator();
});
