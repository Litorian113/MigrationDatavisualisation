// Define months array
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Global variables to store all dots and current filter states
let allDots = [];
let currentFatalityFilter = "All"; // Default to 'All'
let currentGenderFilter = "All"; // Default to 'All'

// Default color settings
const colorMapping = {
    "default": 0xff6347,  // Original dot color
    "grey": 0x808080     // Grey color for non-selected dots
};

// Scene setup
const scene = new THREE.Scene();

// Camera setup (FOV, aspect ratio, near and far clipping planes)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 2;

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Light source
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5).normalize();
scene.add(light);

// Create globe geometry (radius, width segments, height segments)
const geometry = new THREE.SphereGeometry(1, 64, 64);

// Material for the black globe
const globeMaterial = new THREE.MeshBasicMaterial({
  color: 0x000000, // Set globe color to black
  wireframe: false, // Disable wireframe
});

// Create mesh (black sphere)
const globe = new THREE.Mesh(geometry, globeMaterial);
scene.add(globe);

// OrbitControls for mouse interaction
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Adds an inertia effect when dragging
controls.dampingFactor = 0.05; // Strength of the damping effect

// Load GeoJSON data for country borders
fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
  .then(response => response.json())
  .then(data => {
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true });

    data.features.forEach(country => {
      if (country.geometry.type === 'Polygon') {
        drawBorders(country.geometry.coordinates, borderMaterial);
      } else if (country.geometry.type === 'MultiPolygon') {
        country.geometry.coordinates.forEach(polygon => drawBorders(polygon, borderMaterial));
      }
    });
  });

// Function to draw country borders
function drawBorders(polygon, borderMaterial) {
  polygon.forEach(path => {
    const points = path.map(([lon, lat]) => convertCoordsTo3D(lon, lat));
    const borderGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const borderLine = new THREE.Line(borderGeometry, borderMaterial);
    scene.add(borderLine);
  });
}

// Function to add latitude and longitude grid points
function addLatLonPoints() {
  const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White points
  const pointGeometry = new THREE.SphereGeometry(0.0025, 8, 8); // Small spheres as points

  // Add points at latitude and longitude intersections
  for (let lat = -90; lat <= 90; lat += 10) {
    for (let lon = -180; lon <= 180; lon += 10) {
      const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
      const position = convertCoordsTo3D(lon, lat);
      pointMesh.position.copy(position);
      scene.add(pointMesh);
    }
  }
}

// Add points on latitude and longitude grid
addLatLonPoints();

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

// Function to add Dots from the dataset and store them in allDots array
function addDots(data) {
  allDots = []; // Clear the list of dots

  data.forEach(entry => {
    if (entry.Coordinates && entry["Total Number of Dead and Missing"] !== undefined) {
      const [lat, lon] = entry.Coordinates.split(',').map(coord => parseFloat(coord.trim())); // Split and parse coordinates
      
      // Determine the size and color of the dot based on "Total Number of Dead and Missing"
      const totalDeadMissing = entry["Total Number of Dead and Missing"];
      let size = 0.002; // Default smaller size
      let color = 0x8b0000; // Default darker red

      if (totalDeadMissing >= 3 && totalDeadMissing <= 20) {
        size = 0.005; // Medium size
        color = 0xff4500; // Medium red
      } else if (totalDeadMissing > 20) {
        size = 0.01; // Larger size
        color = 0xff6347; // Brighter red
      }
      
      // Create a transparent dot with different colors based on size
      const dotMaterial = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.6 });
      const dotGeometry = new THREE.SphereGeometry(size, 8, 8); // Adjust size based on categories
      const dotMesh = new THREE.Mesh(dotGeometry, dotMaterial);
      
      // Convert geographic coordinates to 3D positions on the globe
      const position = convertCoordsTo3D(lon, lat);
      dotMesh.position.copy(position);

      // Add cause of death and gender info to userData for filtering
      dotMesh.userData.causeOfDeath = entry["Cause of Death"];
      dotMesh.userData.originalColor = color; // Save the original color for future restoration
      dotMesh.userData.numFemales = entry["Number of Females"];
      dotMesh.userData.numMales = entry["Number of Males"];
      dotMesh.userData.numChildren = entry["Number of Children"];

      // Store all dots in memory
      allDots.push(dotMesh);
      scene.add(dotMesh); // Add dot to the scene
    }
  });
}

// Function to apply both Fatality and Gender filters
function applyFilters() {
    allDots.forEach(dot => {
        const causeOfDeath = dot.userData.causeOfDeath;
        const numFemales = dot.userData.numFemales;
        const numMales = dot.userData.numMales;
        const numChildren = dot.userData.numChildren;

        // Check Fatality filter
        const fatalityMatch = (currentFatalityFilter === "All" || causeOfDeath === currentFatalityFilter);

        // Check Gender filter
        let genderMatch = true; // Default to true for 'All'
        if (currentGenderFilter === "Women") {
            genderMatch = (numFemales > 0);
        } else if (currentGenderFilter === "Men") {
            genderMatch = (numMales > 0);
        } else if (currentGenderFilter === "Children") {
            genderMatch = (numChildren > 0);
        }

        // Apply filters
        if (fatalityMatch && genderMatch) {
            dot.material.color.setHex(dot.userData.originalColor);  // Restore original color from userData
        } else {
            dot.material.color.setHex(colorMapping["grey"]);  // Turn other dots grey
        }
    });
}

// Store buttons in variables for Fatality
const fatalityButtons = {
    "All": document.getElementById('fatalityAll'),
    "Mixed or unknown": document.getElementById('fatalityUnknown'),
    "Violence": document.getElementById('fatalityViolence'),
    "Drowning": document.getElementById('fatalityDrowning'),
    "Harsh environmental conditions / lack of adequate shelter, food, water": document.getElementById('fatalityHarsh'),
    "Accidental death": document.getElementById('fatalityAccident'),
    "Sickness / lack of access to adequate healthcare": document.getElementById('fatalitySickness'),
    "Vehicle accident / death linked to hazardous transport": document.getElementById('fatalityVehicle'),
};

// Attach event listeners to Fatality buttons
Object.keys(fatalityButtons).forEach(key => {
    fatalityButtons[key].addEventListener('click', () => {
        currentFatalityFilter = key;  // Set current fatality filter
        applyFilters();  // Apply the filters
    });
});

// Store buttons in variables for Gender
const genderButtons = {
    "All": document.getElementById('genderAll'),
    "Women": document.getElementById('genderWomen'),
    "Men": document.getElementById('genderMen'),
    "Children": document.getElementById('genderChildren')
};

// Attach event listeners to Gender buttons
Object.keys(genderButtons).forEach(key => {
    genderButtons[key].addEventListener('click', () => {
        currentGenderFilter = key;  // Set current gender filter
        applyFilters();  // Apply the filters
    });
});

// Funktion, um die "active"-Klasse für die Buttons zu setzen
function setActiveButton(buttonGroup, activeButton) {
  // Entferne die "active"-Klasse von allen Buttons in der Gruppe
  document.querySelectorAll(buttonGroup).forEach(button => button.classList.remove('active'));
  // Setze die "active"-Klasse für den ausgewählten Button
  activeButton.classList.add('active');
}

// Setze initial beide "All"-Buttons und den "On"-Button auf "active"
window.onload = function() {
  document.getElementById('fatalityAll').classList.add('active');
  document.getElementById('genderAll').classList.add('active');
  document.getElementById('infoBoxOn').classList.add('active');
}

// Event Listener für die Fatality-Buttons
document.querySelectorAll('.fatality-button').forEach(button => {
  button.addEventListener('click', function() {
      setActiveButton('.fatality-button', this);
  });
});

// Event Listener für die Gender-Buttons
document.querySelectorAll('.gender-button').forEach(button => {
  button.addEventListener('click', function() {
      setActiveButton('.gender-button', this);
  });
});

// Event Listener für die Infobox-Buttons
document.querySelectorAll('#infoBoxOn, #infoBoxOff').forEach(button => {
  button.addEventListener('click', function() {
      setActiveButton('#infoBoxOn, #infoBoxOff', this);
  });
});




// Load data from data.json
fetch('./data/data.json')
  .then(response => response.json())
  .then(data => {
    addDots(data); // Create and add dots from the dataset
  });

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // Update controls for smooth movement

  renderer.render(scene, camera);
}

// Start the animation
animate();

// Handle window resizing
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
