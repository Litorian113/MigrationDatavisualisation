// Define months array
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Global variables to store all dots
let allDots = [];
let currentDots = [];

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

// Add Dots from the dataset
function addDots(data) {
  allDots = []; // Clear the list of dots

  data.forEach(entry => {
    if (entry.Coordinates) {
      const dot = new Dot(entry.Coordinates, entry["Incident year"], entry["Reported Month"], entry["Total Number of Dead and Missing"]);
      allDots.push(dot);
      // console.log(`Dot created for ${entry["Incident year"]}, ${entry["Reported Month"]}, Coordinates: ${entry.Coordinates}`);
    }
  });

  filterDotsBySliderValue(); // Filter based on the slider value initially
}

// Load data from data.json
fetch('./data/data.json')
  .then(response => response.json())
  .then(data => {
    addDots(data); // Create and add dots from the dataset
  });

// Filter dots based on the current slider value
function filterDotsBySliderValue() {
  const sliderValue = document.getElementById('dateSlider').value;
  const year = Math.floor(sliderValue / 12) + 2014;
  const month = months[sliderValue % 12];

  // Update the displayed date
  document.getElementById('dateDisplay').innerText = `${month} ${year}`;

  // Remove current dots from the scene
  currentDots.forEach(dot => scene.remove(dot.mesh));
  currentDots = allDots.filter(dot => {
    const dotYear = dot.incidentYear;
    const dotMonth = dot.incidentMonth;
    return dotYear < year || (dotYear === year && months.indexOf(dotMonth) <= months.indexOf(month));
  });

  // Add filtered dots to the scene
  currentDots.forEach(dot => scene.add(dot.mesh));
}

// Slider event listener
document.getElementById('dateSlider').addEventListener('input', filterDotsBySliderValue);

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
