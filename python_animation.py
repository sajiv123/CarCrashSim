from flask import Flask, render_template, request, jsonify
import json
import time

app = Flask(__name__)

# Simulation parameters
simulation_params = {
    'speed': 60,  # in mph
    'brakeDeceleration': 1.0,  # factor
    'followDistance': 100,  # in inches
    'reactionTime': 1.5,  # in seconds
    'timeStep': 0.01,  # in seconds
    'maxTime': 10  # in seconds
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/start_simulation', methods=['POST'])
def start_simulation():
    global simulation_params
    simulation_params = {
        'speed': float(request.form['speed']),
        'brakeDeceleration': float(request.form['brakeDeceleration']),
        'followDistance': float(request.form['followDistance']),
        'reactionTime': float(request.form['reactionTime']),
        'timeStep': 0.01,
        'maxTime': 10
    }
    return jsonify({'status': 'Simulation started'})

@app.route('/get_data')
def get_data():
    # Simulate some data for demo purposes
    time_points = [i * simulation_params['timeStep'] for i in range(int(simulation_params['maxTime'] / simulation_params['timeStep']))]
    car1_speeds = [simulation_params['speed']] * len(time_points)
    car2_speeds = [simulation_params['speed']] * len(time_points)
    distances = [simulation_params['followDistance']] * len(time_points)
    
    data = {
        'time': time_points,
        'car1_speed': car1_speeds,
        'car2_speed': car2_speeds,
        'distance': distances
    }
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
