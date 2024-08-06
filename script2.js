document.getElementById('startButton').addEventListener('click', function() {
    const speedMph = parseFloat(document.getElementById('speed').value);
    const g_factor = parseFloat(document.getElementById('brakeDeceleration').value);
    const followDistanceInches = parseFloat(document.getElementById('followDistance').value);
    const reactionTime = parseFloat(document.getElementById('reactionTime').value);

    const car1 = document.getElementById('car1');
    const car2 = document.getElementById('car2');
    const container = document.getElementById('simulationContainer');

    const pixWidth = 40;
    const pixelToInchFactor = 180 / pixWidth; // Conversion factor from pixels to inches
    const containerWidthInches = container.clientWidth * pixelToInchFactor;

    // Convert mph to inches per second
    const speedInchesPerSec = speedMph * 17.6; // 1 mph = 17.6 inches/sec
    // Braking deceleration: 32 ft/s² converted to inches/s²
    const brakeDecelerationInchesPerSec2 = g_factor * 32 * 12;

    let car1PositionInches = 0;
    let car2PositionInches = followDistanceInches + (pixWidth * pixelToInchFactor);
    car1.style.left = (car1PositionInches / pixelToInchFactor) + 'px';
    car2.style.left = (car2PositionInches / pixelToInchFactor) + 'px';
    let car1Speed = speedInchesPerSec;
    let car2Speed = speedInchesPerSec;
    let car1Braking = false;
    let car2Braking = false; // Start with car2 braking
    let car1BrakeTime = -1;

    let time = 0;
    const timeStep = 0.005; // 100 FPS
    const speedData = {
        car1: [],
        car2: []
    };
    const distanceData = {
        distance: []
    };

    function drawCharts() {
        const speedTrace1 = {
            x: Array.from({ length: speedData.car1.length }, (_, i) => i * timeStep),
            y: speedData.car1.map(speed => speed / 17.6), // Convert inches/sec back to mph
            mode: 'lines',
            name: 'Car 1 Speed',
            line: { color: 'red' }
        };

        const speedTrace2 = {
            x: Array.from({ length: speedData.car2.length }, (_, i) => i * timeStep),
            y: speedData.car2.map(speed => speed / 17.6), // Convert inches/sec back to mph
            mode: 'lines',
            name: 'Car 2 Speed',
            line: { color: 'blue' }
        };

        const distanceTrace = {
            x: Array.from({ length: distanceData.distance.length }, (_, i) => i * timeStep),
            y: distanceData.distance.map(distance => Math.max(0, Math.min(2000, distance))),
            mode: 'lines',
            name: 'Distance',
            line: { color: 'green' }
        };

        const speedLayout = {
            title: 'Speed vs Time',
            xaxis: { title: 'Time (s)' },
            yaxis: { title: 'Speed (mph)', range: [0, 100] }
        };

        const distanceLayout = {
            title: 'Distance vs Time',
            xaxis: { title: 'Time (s)' },
            yaxis: { title: 'Distance (inches)', range: [0, 2000]}
        };

        Plotly.newPlot('speedChart', [speedTrace1, speedTrace2], speedLayout);
        Plotly.newPlot('distanceChart', [distanceTrace], distanceLayout);
    }

    function animate() {
        // Check for collision
        const car1RightEdge = car1PositionInches + (pixWidth * pixelToInchFactor);
        const car2LeftEdge = car2PositionInches;
        if (car1RightEdge >= car2LeftEdge) {
            // Stop the animation on collision
            drawCharts();
            return;
        } else if (car1Speed < 0.001) {
            return;
        }

        // Braking logic
        if (!car2Braking && car2PositionInches > containerWidthInches / 4) {
            car2Braking = true;
        }

        if (car2Braking) {
            car2Speed = Math.max(0, car2Speed - brakeDecelerationInchesPerSec2 * timeStep);
        }

        if (car2Braking && !car1Braking) {
            if (car1BrakeTime < 0) {
                car1BrakeTime = time + reactionTime;
            } else if (time >= car1BrakeTime) {
                car1Braking = true;
            }
        }

        if (car1Braking) {
            car1Speed = Math.max(0, car1Speed - brakeDecelerationInchesPerSec2 * timeStep);
        }

        // Update positions
        car1PositionInches += car1Speed * timeStep;
        car2PositionInches += car2Speed * timeStep;

        // Update styles
        car1.style.left = (car1PositionInches / pixelToInchFactor) + 'px';
        car2.style.left = (car2PositionInches / pixelToInchFactor) + 'px';

        // Collect data for graphs
        speedData.car1.push(car1Speed);
        speedData.car2.push(car2Speed);
        distanceData.distance.push(car2PositionInches - car1PositionInches);

        time += timeStep;

        // Draw the charts
        drawCharts();

        // Request the next animation frame
        requestAnimationFrame(animate);
    }

    setTimeout(animate, 1000);
});
