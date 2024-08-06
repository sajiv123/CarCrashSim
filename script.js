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
    const timeStep = 0.01; // 100 FPS
    const speedData = {
        car1: [car1Speed],
        car2: [car2Speed]
    };
    const distanceData = {
        distance: []
    };

    const speedChart = document.getElementById('speedChart');
    const speedCtx = speedChart.getContext('2d');
    const distanceChart = document.getElementById('distanceChart');
    const distanceCtx = distanceChart.getContext('2d');

    function drawAxes(ctx, width, height, xLabel, yLabel, xTickCount, yTickCount, yMaxValue) {
        // Draw x and y axes
        ctx.beginPath();
        ctx.moveTo(40, height - 30); // y-axis
        ctx.lineTo(width - 10, height - 30); // x-axis
        ctx.lineTo(width - 10, 10); // End y-axis
        ctx.strokeStyle = 'black';
        ctx.stroke();

        // Draw x-axis ticks and labels
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '10px Arial';
        for (let i = 0; i <= xTickCount; i++) {
            const x = 40 + (width - 50) * (i / xTickCount);
            ctx.beginPath();
            ctx.moveTo(x, height - 30);
            ctx.lineTo(x, height - 25);
            ctx.stroke();

            ctx.fillText((i * 10).toFixed(0), x, height - 15);
        }

        // Draw y-axis ticks and labels
        for (let i = 0; i <= yTickCount; i++) {
            const y = height - 30 - (height - 40) * ((yTickCount - i) / yTickCount);
            ctx.beginPath();
            ctx.moveTo(40, y);
            ctx.lineTo(35, y);
            ctx.stroke();

            ctx.fillText((yMaxValue * (1 - i / yTickCount)).toFixed(0), 20, y);
        }

        // Label axes
        ctx.fillText(xLabel, width / 2, height - 10);
        ctx.save();
        ctx.translate(10, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(yLabel, 0, 0);
        ctx.restore();
    }

    function drawCharts() {
        // Clear canvas
        speedCtx.clearRect(0, 0, speedChart.width, speedChart.height);
        distanceCtx.clearRect(0, 0, distanceChart.width, distanceChart.height);

        // Draw axes
        drawAxes(speedCtx, speedChart.width, speedChart.height, 'Time (s)', 'Speed (mph)', 10, 10, 100);
        drawAxes(distanceCtx, distanceChart.width, distanceChart.height, 'Time (s)', 'Distance (inches)', 10, 10, 2500);

        // Draw speed chart
        speedCtx.beginPath();
        speedCtx.moveTo(40, speedChart.height - 30);
        speedData.car1.forEach((speed, index) => {
            const x = 40 + index * timeStep * 100; // Scale time for visibility
            const mphSpeed = speed / 17.6; // Convert inches/sec back to mph
            const y = speedChart.height - 30 - (mphSpeed / 100 * (speedChart.height - 40)); // 100 mph is the max
            speedCtx.lineTo(x, y);
        });
        speedCtx.strokeStyle = 'red';
        speedCtx.stroke();

        speedCtx.beginPath();
        speedCtx.moveTo(40, speedChart.height - 30);
        speedData.car2.forEach((speed, index) => {
            const x = 40 + index * timeStep * 100;
            const mphSpeed = speed / 17.6; // Convert inches/sec back to mph
            const y = speedChart.height - 30 - (mphSpeed / 100 * (speedChart.height - 40)); // 100 mph is the max
            speedCtx.lineTo(x, y);
        });
        speedCtx.strokeStyle = 'blue';
        speedCtx.stroke();

        // Draw distance chart
        distanceCtx.beginPath();
        distanceCtx.moveTo(40, distanceChart.height - 30);
        distanceData.distance.forEach((distance, index) => {
            const x = 40 + index * timeStep * 100;
            const scaledDistance = Math.max(0, Math.min(2500, distance));
            const y = distanceChart.height - 30 - (scaledDistance / 2500 * (distanceChart.height - 40));
            distanceCtx.lineTo(x, y);
        });
        distanceCtx.strokeStyle = 'green';
        distanceCtx.stroke();
    }

    function animate() {
        // Check for collision
        const car1RightEdge = car1PositionInches + (pixWidth * pixelToInchFactor);
        const car2LeftEdge = car2PositionInches;
        if (car1RightEdge >= car2LeftEdge) {
            // Stop the animation on collision
            drawCharts();
            return;
        } else if(car1Speed < 0.001){
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
