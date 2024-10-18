// Define months array
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November'];

// Global variables to store all dots and current filter states
let allDots = [];
let allPins = []; // Store all pins for visibility optimization
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

// CSS2DRenderer for pin labels
const labelRenderer = new THREE.CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none'; // Allow pointer events to pass through
document.body.appendChild(labelRenderer.domElement);

// Light source
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5).normalize();
scene.add(light);

// Create globe geometry (radius, width segments, height segments)
const geometry = new THREE.SphereGeometry(1, 32, 32); // Adjusted to 32 segments for performance

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
controls.enableDamping = false; // Adds an inertia effect when dragging
controls.dampingFactor = 0.05; // Strength of the damping effect



// Raycaster and mouse vector
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Load GeoJSON data for country borders
fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
  .then(response => response.json())
  .then(data => {
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true });

    data.features.forEach(country => {
      if (country.geometry.type === 'Polygon') {
        country.geometry.coordinates.forEach(path => {
          const points = path.map(([lon, lat]) => convertCoordsTo3D(lon, lat));
          const borderGeometry = new THREE.BufferGeometry().setFromPoints(points);
          const borderLine = new THREE.Line(borderGeometry, borderMaterial);
          scene.add(borderLine); // Add each border to the scene individually
        });
      } else if (country.geometry.type === 'MultiPolygon') {
        country.geometry.coordinates.forEach(polygon => {
          polygon.forEach(path => {
            const points = path.map(([lon, lat]) => convertCoordsTo3D(lon, lat));
            const borderGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const borderLine = new THREE.Line(borderGeometry, borderMaterial);
            scene.add(borderLine); // Add each border to the scene individually
          });
        });
      }
    });
  });

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

// Function to create a line from the globe to the sprite
function createLine(lat, lon) {
  const startPosition = convertCoordsTo3D(lon, lat); // Position on the globe
  const endPosition = startPosition.clone().multiplyScalar(1.2); // Position above the globe (adjust factor for height)

  const points = [startPosition, endPosition]; // Line from the globe to the pin
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const line = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(line); // Add the line to the scene

  // Create a larger invisible click area
  const clickAreaRadius = 0.1; // Adjust this value to make the click area larger
  const clickMeshGeometry = new THREE.CircleGeometry(clickAreaRadius, 32);
  const clickMeshMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, color: 0xffffff });
  const clickMesh = new THREE.Mesh(clickMeshGeometry, clickMeshMaterial);
  clickMesh.position.copy(endPosition); // Positioniere das Click-Mesh
  scene.add(clickMesh);

  return endPosition; // Return the end position where the sprite will be placed
}


// Function to add pins as sprites
function addPin(lat, lon, infoCardId) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('../plus-icon.png', (texture) => {
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            color: 0xffffff // Optional: color tint for the sprite
        });

        const pinSprite = new THREE.Sprite(spriteMaterial);
        pinSprite.scale.set(0.05, 0.05, 1); // Adjust size of the sprite
        
        // Create a line and get the end position for the sprite
        const endPosition = createLine(lat, lon);
        pinSprite.position.copy(endPosition); // Position the sprite at the end of the line

        pinSprite.userData.infoCardId = infoCardId; // Store infoCardId for toggling
        allPins.push(pinSprite);

        // Add click event to toggle the info card
        pinSprite.callback = () => {
            toggleInfoCard(infoCardId); // Open the associated info card
        };

        pinSprite.onClick = function(event) {
            event.stopPropagation(); // Prevent click event from bubbling up
            this.callback(); // Call the callback to toggle the info card
        };

        scene.add(pinSprite);
    }, undefined, (error) => {
        console.error('Error loading texture:', error);
    });
}

// Toggle the visibility of the info card
function toggleInfoCard(infoCardId) {
    const infoCard = document.getElementById(infoCardId);
    if (infoCard.style.display === 'none' || infoCard.style.display === '') {
        infoCard.style.display = 'block'; // Show the info card
    } else {
        infoCard.style.display = 'none'; // Hide the info card
    }
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
    document.querySelectorAll(buttonGroup).forEach(button => button.classList.remove('active'));
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

// Throttle CSS2DRenderer rendering (render only every 3 frames)
let css2DRenderThrottle = 0;

// Visibility check for pins (render only when in view)
function updatePinPosition() {
  allPins.forEach(pin => {
      // Update the pin's position in the world
      pin.updateMatrixWorld(); 
  });
}



// Raycasting for detecting mouse hover/click events
function handleMouseMove(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(allPins);

    // Reset pin colors
    allPins.forEach(pin => {
        pin.material.color.set(0xffffff); // Reset color
    });

    if (intersects.length > 0) {
        const intersectedPin = intersects[0].object;

        // Change color of the intersected pin
        intersectedPin.material.color.set(0xaaaaaa); // Change to grey on hover

        // Click event for the intersected pin
        window.addEventListener('click', () => {
            intersectedPin.callback(); // Use the callback to toggle the info card
        }, { once: true }); // Ensure it only fires once per hover
    }
}

// Add event listener for mouse movements
window.addEventListener('mousemove', handleMouseMove);

// Example: Add 3 pins
addPin(31.533201, -106.755627, "infoCard");
addPin(36.464997, 12.218554, "infoCard2");
addPin(7.849924, -77.338784, "infoCard3");

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

    // Throttle CSS2DRenderer rendering every 3 frames
    if (css2DRenderThrottle % 3 === 0) {
        labelRenderer.render(scene, camera);
    }
    css2DRenderThrottle++;

    renderer.render(scene, camera);
    updatePinPosition(); // Update pin positions with globe rotation
}

// Start the animation
animate();

// Handle window resizing
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
