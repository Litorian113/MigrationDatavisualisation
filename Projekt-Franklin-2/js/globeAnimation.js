// Scene setup
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 2;

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container1').appendChild(renderer.domElement);

// OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.enableZoom = true;

// Light source
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5).normalize();
scene.add(light);

// Create globe geometry
const globeGeometry = new THREE.SphereGeometry(1, 32, 32);
const globeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: false });
const globe = new THREE.Mesh(globeGeometry, globeMaterial);
scene.add(globe);

// Function to convert geographic coordinates (Lon/Lat) to 3D positions on a sphere
function convertCoordsTo3D(lon, lat) {
    const radius = 1.01; // Slightly above the globe for better visibility
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

// Function to add country borders as lines on the globe
function loadCountryBorders() {
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
        .then(response => response.json())
        .then(data => {
            const borderMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

            data.features.forEach(country => {
                if (country.geometry.type === 'Polygon') {
                    country.geometry.coordinates.forEach(path => {
                        const points = path.map(([lon, lat]) => convertCoordsTo3D(lon, lat));
                        const borderGeometry = new THREE.BufferGeometry().setFromPoints(points);
                        const borderLine = new THREE.Line(borderGeometry, borderMaterial);
                        globe.add(borderLine); // Add each border as a child of the globe
                    });
                } else if (country.geometry.type === 'MultiPolygon') {
                    country.geometry.coordinates.forEach(polygon => {
                        polygon.forEach(path => {
                            const points = path.map(([lon, lat]) => convertCoordsTo3D(lon, lat));
                            const borderGeometry = new THREE.BufferGeometry().setFromPoints(points);
                            const borderLine = new THREE.Line(borderGeometry, borderMaterial);
                            globe.add(borderLine); // Add each border as a child of the globe
                        });
                    });
                }
            });
        });
}

// Load country borders
loadCountryBorders();

// Dot class to encapsulate dot properties
class Dot {
    constructor(lat, lon, size, color) {
        this.lat = lat;
        this.lon = lon;
        this.mesh = this.createDotMesh(size, color);
    }

    createDotMesh(size, color) {
        const dotMaterial = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.6 });
        const dotGeometry = new THREE.SphereGeometry(size, 8, 8);
        const dotMesh = new THREE.Mesh(dotGeometry, dotMaterial);
        const position = convertCoordsTo3D(this.lon, this.lat);
        dotMesh.position.copy(position);
        dotMesh.visible = false; // Initially invisible

        // Add the dot as a child of the globe so it rotates with it
        globe.add(dotMesh);

        return dotMesh;
    }

    setVisible(visible) {
        this.mesh.visible = visible;
    }
}

// Store dots by month
let dotsByMonth = Array(120).fill(null).map(() => []);

// Function to add Dots from the dataset and store them in the dots array with heatmap-like coloring
function addDots(data) {
    data.forEach(entry => {
        if (entry.Coordinates && entry["Total Number of Dead and Missing"] !== undefined) {
            const [lat, lon] = entry.Coordinates.split(',').map(coord => parseFloat(coord.trim()));

            // Determine the size and color of the dot based on "Total Number of Dead and Missing"
            const totalDeadMissing = entry["Total Number of Dead and Missing"];
            let size = 0.004;
            let color = 0xFF8C00;

            if (totalDeadMissing >= 3 && totalDeadMissing <= 20) {
                size = 0.008;
                color = 0xFF2400;
            } else if (totalDeadMissing > 20) {
                size = 0.015;
                color = 0xB00000;
            }

            // Calculate which month index the entry belongs to
            const year = entry["Incident year"];
            const month = entry["Reported Month"];
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const sliderIndex = (year - 2014) * 12 + months.indexOf(month);

            if (sliderIndex >= 0 && sliderIndex < 120) {
                const dot = new Dot(lat, lon, size, color); // Create a new Dot
                dotsByMonth[sliderIndex].push(dot); // Add dot to the appropriate month array
            }
        }
    });
}

// Load incident data from the JSON file
function loadData() {
    fetch('/Projekt-Franklin-2/data/dataGlobe.json')
        .then(response => response.json())
        .then(data => {
            addDots(data); // Add dots to the globe with the heatmap effect
        })
        .catch(error => console.error('Error loading data:', error));
}

// Load the data and prepare the dots
loadData();

// Slider and date display
const slider = document.getElementById('timeSlider');
const dateDisplay = document.getElementById('dateDisplay');
const playPauseButton = document.getElementById('playPauseButton');
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Animation variables
let isPlaying = false;
let animationInterval = null;

// Update dots based on the slider value
function updateDotsByMonth(sliderValue) {
    const year = 2014 + Math.floor(sliderValue / 12);
    const month = sliderValue % 12;
    dateDisplay.textContent = `${months[month]} ${year}`;

    // Set visibility of all dots up to the selected month
    dotsByMonth.forEach((dots, index) => {
        const shouldShow = index <= sliderValue;
        dots.forEach(dot => dot.setVisible(shouldShow));
    });
}

// Update the slider event listener
slider.addEventListener('input', (event) => {
    const sliderValue = parseInt(event.target.value);
    updateDotsByMonth(sliderValue);
});

// Initial display for the first month
updateDotsByMonth(0);

// Play/Pause button functionality
playPauseButton.addEventListener('click', () => {
    if (isPlaying) {
        // Pause the animation
        clearInterval(animationInterval);
        playPauseButton.textContent = '▶'; // Change back to play button
    } else {
        // Start the animation
        playPauseButton.textContent = '⏸'; // Change to pause button
        animationInterval = setInterval(() => {
            let sliderValue = parseInt(slider.value);
            if (sliderValue < 119) {
                sliderValue++;
                slider.value = sliderValue;
                updateDotsByMonth(sliderValue);
            } else {
                // Stop when the end is reached
                clearInterval(animationInterval);
                playPauseButton.textContent = '▶'; // Reset to play button
                isPlaying = false;
            }
        }, 500); // Adjust the speed of the slider animation (500ms per step)
    }
    isPlaying = !isPlaying;
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y -= 0.001; // Auto-rotation of the globe
    controls.update();
    renderer.render(scene, camera);
}

animate();

// Handle window resizing
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
