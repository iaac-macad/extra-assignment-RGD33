// Import libraries
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Rhino3dmLoader } from 'three/addons/loaders/3DMLoader.js'
import rhino3dm from 'rhino3dm'
import { RhinoCompute } from 'rhinocompute'

const definitionName = "RGDUmbrellaPavilion.gh";

// Set up sliders
var MiddleCircleR_slider = document.getElementById("MiddleCircleR");
MiddleCircleR_slider.addEventListener("mouseup", onSliderChange, false);
MiddleCircleR_slider.addEventListener("touchend", onSliderChange, false);

var HeightOfMiddle_slider = document.getElementById("HeightOfMiddle");
HeightOfMiddle_slider.addEventListener("mouseup", onSliderChange, false);
HeightOfMiddle_slider.addEventListener("touchend", onSliderChange, false);

var TopCircleR_slider = document.getElementById("TopCircleR");
TopCircleR_slider.addEventListener("mouseup", onSliderChange, false);
TopCircleR_slider.addEventListener("touchend", onSliderChange, false);

var HeightOfTop_slider = document.getElementById("HeightOfTop");
HeightOfTop_slider.addEventListener("mouseup", onSliderChange, false);
HeightOfTop_slider.addEventListener("touchend", onSliderChange, false);

var BaseCircleR_slider = document.getElementById("BaseCircleR");
BaseCircleR_slider.addEventListener("mouseup", onSliderChange, false);
BaseCircleR_slider.addEventListener("touchend", onSliderChange, false);

var DivisionCount_slider = document.getElementById("DivisionCount");
DivisionCount_slider.addEventListener("mouseup", onSliderChange, false);
DivisionCount_slider.addEventListener("touchend", onSliderChange, false);

var ShiftBase_slider = document.getElementById("ShiftBase");
ShiftBase_slider.addEventListener("mouseup", onSliderChange, false);
ShiftBase_slider.addEventListener("touchend", onSliderChange, false);

var ShiftMiddle_slider = document.getElementById("ShiftMiddle");
ShiftMiddle_slider.addEventListener("mouseup", onSliderChange, false);
ShiftMiddle_slider.addEventListener("touchend", onSliderChange, false);

var ShiftMiddle1_slider = document.getElementById("ShiftMiddle1");
ShiftMiddle1_slider.addEventListener("mouseup", onSliderChange, false);
ShiftMiddle1_slider.addEventListener("touchend", onSliderChange, false);


const loader = new Rhino3dmLoader();
loader.setLibraryPath("https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/");

let rhino, definition, doc;
rhino3dm().then(async (m) => {
  console.log("Loaded rhino3dm.");
  rhino = m; // global

  RhinoCompute.url = "http://localhost:8081/"; //if debugging locally.

  // load a grasshopper file!

  const url = definitionName;
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const arr = new Uint8Array(buffer);
  definition = arr;

  init();
  compute();
});

async function compute() {
  const param1 = new RhinoCompute.Grasshopper.DataTree("MiddleCircleR");
  const param2 = new RhinoCompute.Grasshopper.DataTree("HeightOfMiddle");
  const param3 = new RhinoCompute.Grasshopper.DataTree("TopCircleR");
  const param4 = new RhinoCompute.Grasshopper.DataTree("HeightOfTop");
  const param5 = new RhinoCompute.Grasshopper.DataTree("BaseCircleR");
  const param6 = new RhinoCompute.Grasshopper.DataTree("DivisionCount");
  const param7 = new RhinoCompute.Grasshopper.DataTree("ShiftBase");
  const param8 = new RhinoCompute.Grasshopper.DataTree("ShiftMiddle");
  const param9 = new RhinoCompute.Grasshopper.DataTree("ShiftMiddle1");

  param1.append([1], [MiddleCircleR_slider.valueAsNumber]);
  param2.append([2], [HeightOfMiddle_slider.valueAsNumber]);
  param3.append([3], [TopCircleR_slider.valueAsNumber]);
  param4.append([4], [HeightOfTop_slider.valueAsNumber]);
  param5.append([5], [BaseCircleR_slider.valueAsNumber]);
  param6.append([6], [DivisionCount_slider.valueAsNumber]);  
  param7.append([7], [ShiftBase_slider.valueAsNumber]);
  param8.append([8], [ShiftMiddle_slider.valueAsNumber]);
  param9.append([9], [ShiftMiddle1_slider.valueAsNumber]);


  // clear values
  const trees = [];
  trees.push(param1);
  trees.push(param2);
  trees.push(param3);
  trees.push(param4);
  trees.push(param5);
  trees.push(param6);
  trees.push(param7);
  trees.push(param8);
  trees.push(param9);


  const res = await RhinoCompute.Grasshopper.evaluateDefinition(
    definition,
    trees
  );



  doc = new rhino.File3dm();


  // hide spinner
  document.getElementById("loader").style.display = "none";

  //decode grasshopper objects and put them into a rhino document
  for (let i = 0; i < res.values.length; i++) {
    for (const [key, value] of Object.entries(res.values[i].InnerTree)) {
      for (const d of value) {
        const data = JSON.parse(d.data);
        const rhinoObject = rhino.CommonObject.decode(data);
        doc.objects().add(rhinoObject, null);
      }
    }
  }



  // go through the objects in the Rhino document

  let objects = doc.objects();
  for ( let i = 0; i < objects.count; i++ ) {
  
    const rhinoObject = objects.get( i );


     // asign geometry userstrings to object attributes
    if ( rhinoObject.geometry().userStringCount > 0 ) {
      const g_userStrings = rhinoObject.geometry().getUserStrings()


      //iterate through userData and store all userdata to geometry
      for ( let j = 0; j < g_userStrings.length; j++ ) {
        rhinoObject.attributes().setUserString(g_userStrings[j][0], g_userStrings[j][1])
      }

      // rhinoObject.attributes().setUserString(g_userStrings[0][0], g_userStrings[0][1])
      
    }
  }


  // clear objects from scene
  scene.traverse((child) => {
    if (!child.isLight) {
      scene.remove(child);
    }
  });

  const buffer = new Uint8Array(doc.toByteArray()).buffer;
  loader.parse(buffer, function (object) {

    // go through all objects, check for userstrings and assing colors
    
    object.traverse((child) => {
      if (child.isMesh) { //check if it's a mesh

        if (child.userData.attributes.geometry.userStringCount > 0) {
          
          //get color from userStrings
          const colorData = child.userData.attributes.userStrings[0]
          const col = colorData[1];
          console.log(col)

          //convert color from userstring to THREE color and assign it
          const threeColor = new THREE.Color("rgb(" + col + ")");
          const mat = new THREE.LineBasicMaterial({ color: threeColor });
          child.material = mat;
        }
      }
    });

    ///////////////////////////////////////////////////////////////////////
    // add object graph from rhino model to three.js scene
    scene.add(object);

  });
}

function onSliderChange() {
  // show spinner
  document.getElementById("loader").style.display = "block";
  compute();
}


// THREE BOILERPLATE //
let scene, camera, renderer, controls;

function init() {
  // create a scene and a camera
  scene = new THREE.Scene();
  scene.background = new THREE.Color(1, 1, 1);
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = -30;

  // create the renderer and add it to the html
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // add some controls to orbit the camera
  controls = new OrbitControls(camera, renderer.domElement);

  // add a directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.intensity = 2;
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight();
  scene.add(ambientLight);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  animate();
}

function meshToThreejs(mesh, material) {
  const loader = new THREE.BufferGeometryLoader();
  const geometry = loader.parse(mesh.toThreejsJSON());
  return new THREE.Mesh(geometry, material);
}
