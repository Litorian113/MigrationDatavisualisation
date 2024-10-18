// Array to store all pin meshes
let pins = [];

// Function to add a pin with a clickable button
function addPin(lat, lon, infoCardId) {
    // Convert lat/lon to 3D coordinates on the globe
    const position = convertCoordsTo3D(lon, lat);

    // Create a sphere to represent the pin
    const pinGeometry = new THREE.SphereGeometry(0.01, 32, 32); // Small pin size
    const pinMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White pin color
    const pinMesh = new THREE.Mesh(pinGeometry, pinMaterial);
    pinMesh.position.copy(position);

    // Create a div element for the button
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'pin-button';
    buttonDiv.textContent = '+';
    buttonDiv.style.position = 'absolute';
    buttonDiv.style.backgroundColor = 'white';
    buttonDiv.style.borderRadius = '50%';
    buttonDiv.style.padding = '5px';
    buttonDiv.style.cursor = 'pointer';

    // Attach the button to the globe at the pin's position
    const pinButton = new THREE.CSS2DObject(buttonDiv);
    pinButton.position.copy(position);

    // Store the pin mesh and button in an array
    pins.push({ pinMesh, pinButton });

    // Add pin to the scene
    scene.add(pinMesh);
    scene.add(pinButton);

    // Add click event listener to toggle the infoCard
    buttonDiv.addEventListener('click', () => {
        toggleInfoCard(infoCardId);
    });
}
