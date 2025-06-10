# Projectile Motion Simulator

This is a web-based simulation of projectile motion, allowing users to visualize and experiment with different parameters affecting a projectile's trajectory.

## Features

*   **Adjustable Parameters**: Control initial velocity, launch angle, drag coefficient, and gravitational acceleration.
*   **Real-time Visualization**: See the projectile's path update dynamically as parameters change.
*   **Interactive Controls**: Use sliders to fine-tune values and buttons to run, pause, and reset the simulation.
*   **Graphing**: Toggle display of velocity components (speed, Vx, Vy) and forces (Drag, Gravity, Net) over time.
*   **Zoom Controls**: Adjust the zoom level of the main simulation canvas.

## How to Run

To run this simulation, follow these simple steps:

1.  **Clone the repository (if applicable) or download the project files.**
2.  **Navigate to the project directory:**
    ```bash
    cd projectile_motion
    ```
3.  **Open `index.html` in your web browser.** You can usually do this by double-clicking the `index.html` file or by running a command like:
    ```bash
    start index.html
    ```
    (for Windows)

## Usage

Once the simulation is open in your browser:

*   Use the **sliders** to adjust the initial velocity, angle, drag coefficient, and gravity.
*   Check the **"Show Velocity"** and **"Show Forces"** checkboxes to display real-time graphs of these values.
*   Click **"Run Simulation"** to start the projectile motion.
*   Use **"Pause/Resume"** to temporarily stop or continue the simulation.
*   Click **"Reset"** to clear the current trajectory and prepare for a new simulation.
*   Use the **"+"** and **"-"** buttons under "Zoom Controls" to zoom in and out of the simulation view.

## Technologies Used

*   **HTML5**: For the basic structure and content of the web page.
*   **CSS3**: For styling and layout.
*   **JavaScript**: For the interactive simulation logic, physics calculations, and canvas drawing.
