const svg = document.getElementById('svgLine');
        const path = document.getElementById('interactiveLine');
        const numPoints = 100;
        const points = [];
        let isDragging = false;
        let dragIndex = null;
        let animation;

        // Inicializa los puntos de la línea con ondas ajustables
        function initializePoints() {
            const width = svg.clientWidth;
            const height = svg.clientHeight;

            // Ajusta estas variables para cambiar la forma de cada onda
            const waveFrequencies = [0.5, 0.35, -0.62, 0.51, 0.32]; // Frecuencia de las ondas para cada segmento
            const waveHeights = [-24, 180, 170, 76, -200]; // Amplitud de las ondas para cada segmento
            const waveVerticalShifts = [0.3, 0.4, 0.66, 0.86, 0.86]; // suman 1.5 Desplazamiento vertical de las ondas (0 a 1, donde 0 es en la parte superior y 1 en la parte inferior) para cada segmento
            const waveWidths = [0.05, 0.15, 0.5, 0.15 , 0.15]; // sSuman 1 Ancho relativo de cada segmento de onda

            const totalWidthFactor = waveWidths.reduce((acc, width) => acc + width, 0);
            let accumulatedWidth = 0;

            for (let i = 0; i <= numPoints; i++) {
                const relativeIndex = i / numPoints;
                const segmentIndex = waveWidths.findIndex((width, index) => relativeIndex <= waveWidths.slice(0, index + 1).reduce((a, b) => a + b, 0) / totalWidthFactor);

                const waveFrequency = waveFrequencies[segmentIndex];
                const waveHeight = waveHeights[segmentIndex];
                const waveVerticalShift = waveVerticalShifts[segmentIndex];
                const waveWidth = waveWidths[segmentIndex];

                const segmentWidth = (waveWidth / totalWidthFactor) * width;
                const relativeX = (relativeIndex - accumulatedWidth) / waveWidth;
                const x = accumulatedWidth * width + segmentWidth * relativeX;
                const y = height * waveVerticalShift + Math.sin(relativeX * waveFrequency * Math.PI * 2) * waveHeight;

                points.push({ x, y, originalX: x, originalY: y });

                if (relativeIndex >= accumulatedWidth + waveWidth / totalWidthFactor) {
                    accumulatedWidth += waveWidth / totalWidthFactor;
                }
            }

            drawPath();
        }

        // Dibuja la línea utilizando los puntos
        function drawPath() {
            const d = points.reduce((acc, point, i) => {
                return acc + (i === 0 ? `M ${point.x},${point.y}` : ` L ${point.x},${point.y}`);
            }, '');

            path.setAttribute('d', d);
        }

        // Efecto hover suave con deformación de onda extendida
        function hoverEffect(event) {
            if (isDragging) return; // Anula el efecto hover si se está arrastrando

            const rect = svg.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            const hoverRadius = 200; // Radio extendido de la zona afectada por el hover
            const waveAmplitude = 35; // Amplitud de la onda
            const waveLength = 180; // Longitud de la onda

            points.forEach(point => {
                const distance = Math.hypot(point.x - mouseX, point.y - mouseY);

                if (distance < hoverRadius) {
                    const factor = 1 - distance / hoverRadius;
                    const offsetY = waveAmplitude * Math.sin(distance / waveLength * 2 * Math.PI); // Deformación tipo onda extendida
                    point.y = point.originalY + offsetY * factor;
                } else {
                    point.y = point.originalY;
                }
            });

            drawPath();
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
                    const factor = Math.exp(-0.1 * Math.abs(dragIndex - index));
                    point.x += dx * factor;
                    point.y += dy * factor;
                }
            });

            drawPath();
        }

        // Anima la línea de vuelta a su forma original usando GSAP de manera suave y natural
        function resetLine() {
            if (animation) animation.kill();

            animation = gsap.to(points, {
                duration: 1.9, // Duración más corta para un efecto de retorno rápido pero suave
                x: i => points[i].originalX,
                y: i => points[i].originalY,
                ease: "power2.out", // Función de ease para una animación más natural
                onUpdate: drawPath
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
        drawPath();