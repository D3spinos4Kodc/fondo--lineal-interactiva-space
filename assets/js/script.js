const svg = document.getElementById('svgLine');
const path = document.getElementById('interactiveLine');
const numPoints = 100;
let points = [];
let isDragging = false;
let dragIndex = null;
let animation;

// Inicializa los puntos de la línea utilizando coordenadas predefinidas para mantener la forma de la imagen
function initializePoints() {
    const width = svg.clientWidth;
    const height = svg.clientHeight;

    points = []; // Reiniciar puntos

    // Coordenadas predefinidas 
    const predefinedPoints = [
        { x: 0., y: 0.4 * height },
        { x: 0.06 * width, y: 0.36 * height },
        { x: 0.19 * width, y: 0.73 * height },
        { x: 0.36 * width, y: 0.55 * height },
        { x: 0.5 * width, y: 0.63 * height },
        { x: 0.75 * width, y: 0.97 * height },
        { x: 0.91 * width, y: 0.62 * height },
        { x: 1 * width, y: 0.63 * height },
        { x: 1 * width, y: 0.64 * height }
    ];

    // Interpolar los puntos predefinidos para crear una línea suave
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const p = interpolate(predefinedPoints, t);
        points.push({ x: p.x, y: p.y, originalX: p.x, originalY: p.y });
    }

    drawSmoothPath();
}

// Función de interpolación para suavizar los puntos predefinidos
function interpolate(points, t) {
    const n = points.length - 1;
    const k = Math.floor(t * n);
    const f = t * n - k;

    const p0 = points[Math.max(0, k - 1)];
    const p1 = points[k];
    const p2 = points[Math.min(n, k + 1)];
    const p3 = points[Math.min(n, k + 2)];

    const x = cubicInterpolate(p0.x, p1.x, p2.x, p3.x, f);
    const y = cubicInterpolate(p0.y, p1.y, p2.y, p3.y, f);

    return { x, y };
}

// Función de interpolación cúbica
function cubicInterpolate(p0, p1, p2, p3, t) {
    return (
        0.5 *
        ((2 * p1) +
            (-p0 + p2) * t +
            (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
            (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)
    );
}

// Dibuja la línea utilizando los puntos con una interpolación más suave
function drawSmoothPath() {
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length - 2; i += 2) {
        const cp1x = points[i].x;
        const cp1y = points[i].y;
        const cp2x = points[i + 1].x;
        const cp2y = points[i + 1].y;
        const endX = points[i + 2].x;
        const endY = points[i + 2].y;
        d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`;
    }
    path.setAttribute('d', d);
}

// Efecto hover suave con deformación de onda extendida
function hoverEffect(event) {
    if (isDragging) return; // Anula el efecto hover si se está arrastrando

    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const hoverRadius = 280; // Radio extendido de la zona afectada por el hover
    const waveAmplitude = 20; // Amplitud de la onda
    const waveLength = 190; // Longitud de la onda

    points.forEach(point => {
        const distance = Math.hypot(point.x - mouseX, point.y - mouseY);

        if (distance < hoverRadius) {
            const factor = 1 - distance / hoverRadius;
            const offsetY = waveAmplitude * Math.sin(distance / waveLength * -1.8 * Math.PI); // Deformación tipo onda extendida
            point.y = point.originalY + offsetY * factor;
        } else {
            point.y = point.originalY;
        }
    });

    drawSmoothPath();
}

// Deforma la línea cuando se arrastra con el mouse
function deformLine(event) {
    if (!isDragging) return;

    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Calcula la diferencia del movimiento del mouse
    const dx = mouseX - points[dragIndex].x;
    const dy = mouseY - points[dragIndex].y;

    // Actualiza la posición del punto arrastrado
    points[dragIndex].x = mouseX;
    points[dragIndex].y = mouseY;

    // Deforma todos los puntos según la diferencia del movimiento del mouse
    points.forEach((point, index) => {
        if (index !== dragIndex) {
            const factor = Math.exp(-0.4 * Math.abs(dragIndex - index));
            point.x += dx * factor;
            point.y += dy * factor;
        }
    });

    drawSmoothPath();
}

// Anima la línea de vuelta a su forma original usando GSAP de manera suave y natural
function resetLine() {
    if (animation) animation.kill();

    animation = gsap.to(points, {
        duration: 1.1, // Duración más corta para un efecto de retorno rápido pero suave
        x: i => points[i].originalX,
        y: i => points[i].originalY,
        ease: "power2.out", // Función de ease para una animación más natural
        onUpdate: drawSmoothPath
    });
}

// Encuentra el punto más cercano al cursor del mouse cuando se hace clic
function findClosestPoint(mouseX, mouseY) {
    let closestIndex = null;
    let minDistance = Infinity;

    points.forEach((point, index) => {
        const distance = Math.hypot(point.x - mouseX, point.y - mouseY);
        if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
        }
    });

    return closestIndex;
}

// Eventos de mouse para manejar el arrastre y la deformación de la línea
svg.addEventListener('mousedown', (event) => {
    isDragging = true;
    if (animation) animation.kill();

    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    dragIndex = findClosestPoint(mouseX, mouseY);
});

svg.addEventListener('mousemove', (event) => {
    deformLine(event);
    hoverEffect(event);
});

svg.addEventListener('mouseup', () => {
    isDragging = false;
    dragIndex = null;
    resetLine();
});

svg.addEventListener('mouseleave', () => {
    isDragging = false;
    dragIndex = null;
    resetLine();
});

// Inicializa los puntos y dibuja la línea
initializePoints();
drawSmoothPath();

// Recalcula los puntos y redibuja la línea cuando cambia el tamaño de la ventana
window.addEventListener('resize', () => {
    initializePoints();
    drawSmoothPath();
});

// ANIMACION ASTEROIDE
const asteroid = document.getElementById('asteroid');
const cardForm = document.getElementById('cardForm1');

function animateAsteroid() {
    // Crear una línea de tiempo para la animación
    const tl = gsap.timeline({ onComplete: animateAsteroid });

    tl.set(asteroid, {
        x: '126vw', // Ajustar a la pantalla
        y: '-16vh', // Ajustar a la pantalla
        scale: 0.0001,
        rotation: -100,
        zIndex: 4,
        opacity: 1,
        
    });

    tl.to(asteroid, {
        duration: 14, // Mitad de la duración total para llegar a la posición de cruce
        x: '75vw', // Ajustar a la pantalla
        y: '25vh', // Ajustar a la pantalla
        scale: 0.45,
        rotation: 60,
        ease: "power2.inOut",
    });

    tl.to(asteroid, {
        duration: 14, // Mitad de la duración total para alejarse de la posición de cruce
        x: '-13vw', // Ajustar a la pantalla
        y: '40vh', // Ajustar a la pantalla
        scale: 0.0001,
        rotation: 80,
        ease: "power2.inOut",
        zIndex: 4,
        opacity: 1,
    });
}

// Iniciar la animación del asteroide
animateAsteroid();

window.addEventListener('resize', () => {
    initializePoints();
    drawSmoothPath();
    animateAsteroid(); // Reiniciar la animación del asteroide en el nuevo tamaño de pantalla
});
