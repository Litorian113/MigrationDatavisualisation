class Dot {
  constructor(coordinates, incidentYear, incidentMonth) {
    this.incidentYear = incidentYear;
    this.incidentMonth = incidentMonth;

    // Parse the coordinates (assuming format "lat, lon")
    const [lat, lon] = coordinates.split(',').map(coord => parseFloat(coord.trim()));

    // Log to ensure coordinates are correctly parsed
    console.log(`Creating dot for ${incidentYear}, ${incidentMonth} at coordinates: ${lat}, ${lon}`);

    // Material for the dot (red)
    this.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    // Geometry for the dot (very small)
    this.geometry = new THREE.SphereGeometry(0.002, 8, 8);

    // Create the mesh and position it on the globe
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    const position = this.convertCoordsTo3D(lon, lat);

    // Log the 3D position
    console.log(`Dot 3D position: ${position.x}, ${position.y}, ${position.z}`);
    this.mesh.position.copy(position);
  }

  // Function to convert geographic coordinates (Lon/Lat) to 3D positions on the globe
  convertCoordsTo3D(lon, lat) {
    const radius = 1.01; // Slightly outside the globe for visibility
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    return new THREE.Vector3(
      -(radius * Math.sin(phi) * Math.cos(theta)),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }
}
