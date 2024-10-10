class Dot {
    constructor(coordinates) {
      // Koordinaten umwandeln in [lon, lat]
      const [lat, lon] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
  
      // Material für den Punkt (rot)
      this.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  
      // Geometrie für den Punkt (sehr klein)
      this.geometry = new THREE.SphereGeometry(0.002, 8, 8);
  
      // Mesh erstellen und positionieren
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      const position = this.convertCoordsTo3D(lon, lat);
      this.mesh.position.copy(position);
    }
  
    // Methode zum Konvertieren von geografischen Koordinaten (Lon/Lat) in 3D-Koordinaten auf der Kugel
    convertCoordsTo3D(lon, lat) {
      const radius = 1.01; // Punkt minimal außerhalb des Globus, damit er sichtbar ist
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
  
      return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    }
  }
  