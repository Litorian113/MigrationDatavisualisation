// Define months array
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Global variables to store all dots
let allDots = [];
let currentDots = [];

// Erstelle die Szene
const scene = new THREE.Scene();

// Erstelle die Kamera (FOV, Seitenverhältnis, nahe und ferne Clipping-Ebenen)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 2;

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Licht hinzufügen
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5).normalize();
scene.add(light);

// Kugelgeometrie erstellen (Radius, Segmente in Breite, Segmente in Höhe)
const geometry = new THREE.SphereGeometry(1, 64, 64);

// Material für den schwarzen Globus
const globeMaterial = new THREE.MeshBasicMaterial({
  color: 0x000000, // Setzt die Farbe des Globus auf Schwarz
  wireframe: false, // Entfernt das Drahtgitter
});

// Mesh (schwarze Kugel) erstellen
const globe = new THREE.Mesh(geometry, globeMaterial);
scene.add(globe);

// OrbitControls für die Maussteuerung hinzufügen
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Trägheitseffekt
controls.dampingFactor = 0.05; // Stärke des Dämpfungseffekts

// GeoJSON-Daten laden (z.B. Natural Earth Grenzdaten für Ländergrenzen)
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

// Funktion zum Zeichnen der Ländergrenzen
function drawBorders(polygon, borderMaterial) {
  polygon.forEach(path => {
    const points = path.map(([lon, lat]) => convertCoordsTo3D(lon, lat));
    const borderGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const borderLine = new THREE.Line(borderGeometry, borderMaterial);
    scene.add(borderLine);
  });
}

// Funktion zum Hinzufügen von Punkten auf Breiten- und Längengraden
function addLatLonPoints() {
  const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Weiße Punkte
  const pointGeometry = new THREE.SphereGeometry(0.0025, 8, 8); // Sehr kleine Kugeln als Punkte

  // Breitenkreise (von -90 bis 90 Grad in 10-Grad-Schritten)
  for (let lat = -90; lat <= 90; lat += 10) {
    for (let lon = -180; lon <= 180; lon += 10) {
      const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
      const position = convertCoordsTo3D(lon, lat);
      pointMesh.position.copy(position);
      scene.add(pointMesh);
    }
  }

  // Längenkreise (von -180 bis 180 Grad in 10-Grad-Schritten)
  for (let lon = -180; lon <= 180; lon += 10) {
    for (let lat = -90; lat <= 90; lat += 10) {
      const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
      const position = convertCoordsTo3D(lon, lat);
      pointMesh.position.copy(position);
      scene.add(pointMesh);
    }
  }
}

// Punkte auf Breiten- und Längengraden hinzufügen
addLatLonPoints();

// Funktion zum Hinzufügen von Dots (Punkten) aus dem Datensatz
function addDots(data) {
  allDots = []; // Leere Liste für alle Dots

  data.forEach(entry => {
    if (entry.Coordinates) {
      const dot = new Dot(entry.Coordinates, entry["Incident year"], entry["Reported Month"]);
      allDots.push(dot);
      console.log(`Dot created for ${entry["Incident year"]}, ${entry["Reported Month"]}, Coordinates: ${entry.Coordinates}`);
      // Do not add the dots to the scene yet, wait for the slider value
    }
  });

  filterDotsBySliderValue(); // Start filtering based on the current slider value
}

// Datensatz laden (data.json)
fetch('./data/data.json') // Der Pfad zur data.json im data-Ordner
  .then(response => response.json())
  .then(data => {
    addDots(data); // Punkte aus dem Datensatz erzeugen und hinzufügen
  });

// Funktion zur Umwandlung von geografischen Koordinaten (Lon/Lat) in 3D-Koordinaten auf einer Kugel
function convertCoordsTo3D(lon, lat) {
  const radius = 1.01; // Die Punkte und Ländergrenzen werden leicht über der Kugel gezeichnet
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Filter dots by the current slider value
function filterDotsBySliderValue() {
  const sliderValue = document.getElementById('dateSlider').value;
  const year = Math.floor(sliderValue / 12) + 2014;
  const month = months[sliderValue % 12];

  // Log the current year and month to the console
  console.log(`Slider position: ${sliderValue} => Date: ${month} ${year}`);

  // Update the displayed date
  document.getElementById('dateDisplay').innerText = `${month} ${year}`;

  // Remove the current dots from the scene
  currentDots.forEach(dot => scene.remove(dot.mesh)); 
  currentDots = allDots.filter(dot => {
    const dotYear = dot.incidentYear;
    const dotMonth = dot.incidentMonth;

    // Only keep dots from before or on the selected date
    return dotYear < year || (dotYear === year && months.indexOf(dotMonth) <= months.indexOf(month));
  });

  // Log filtered dots
  console.log(`Filtered ${currentDots.length} dots for ${month} ${year}`);

  // Add the filtered dots to the scene
  currentDots.forEach(dot => scene.add(dot.mesh)); 
}

// Slider event listener
document.getElementById('dateSlider').addEventListener('input', filterDotsBySliderValue);

// Animationsfunktion
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // Für Damping-Effekte
  renderer.render(scene, camera);
}

// Starte die Animation
animate();

// Wenn das Fenster verändert wird, passe die Kamera und den Renderer an
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
