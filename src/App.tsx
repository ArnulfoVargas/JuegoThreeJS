import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import * as CANNON from 'cannon';

function doThreeJS(){
 
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );
  const gltfLoader = new GLTFLoader();
  const rgbeLoader = new RGBELoader();
  const textureLoader = new THREE.TextureLoader;
  const physWorld = new CANNON.World()

  physWorld.gravity = new CANNON.Vec3(0, -9.81, 0)

  //Luz ambiental
  const ambientLight = new THREE.AmbientLight(0xe0e0e0,1);
  scene.add(ambientLight);
  
  //Luz direccional
  const light = new THREE.DirectionalLight(0xffffff,0.6);
  light.position.set(0,4,2);
  scene.add(light);
  
  //Elementos del juego
  class Player {
    playerBody : THREE.Group<THREE.Object3DEventMap>;
    playerPhys : CANNON.Body;
    isLoaded : boolean = false;
    isAlive : boolean = true;

    constructor() {
      gltfLoader.load("/models/bird.gltf", (bird) => {
        const playerLoaded = bird.scene;
        scene.add(playerLoaded)
        this.playerBody = playerLoaded; 

        this.isLoaded = true;
      })

      this.playerPhys = new CANNON.Body({
        shape: new CANNON.Sphere(.5),
        type: CANNON.Body.DYNAMIC,
        mass: 1
      })

      physWorld.addBody(this.playerPhys)
    }

    onClick = () => {
      this.playerPhys.velocity.set(0, 5, 0);
    }

    updatePosition = () => {
      if (!this.isLoaded) return;
      if (!this.isAlive) {
        this.playerPhys.velocity.set(0,0,0);
        return;
      }
      
      const physTopPosition = new THREE.Vector3(this.playerPhys.position.x, this.playerPhys.position.y, this.playerPhys.position.z)
      this.playerBody.position.copy(physTopPosition)
    }
  }


  class Pipes {
    
    topPipe : THREE.Group<THREE.Object3DEventMap>;
    lowPipe : THREE.Group<THREE.Object3DEventMap>;
    lowPipePhys : CANNON.Body;
    topPipePhys : CANNON.Body;
    loadIndex : number = 0;
    loaded : boolean = false;

    constructor() {

      const randomHeight = Math.floor(Math.random() * 13)
      
      // Low Pipe
      gltfLoader.load("/models/pipe.gltf", (pipe) => {
        const pipeLoaded = pipe.scene;
        //half 8.5
        // pos x = 30 miny = -17 maxy = -5
        this.lowPipe = pipeLoaded;
        scene.add(pipeLoaded);
        this.loadIndex += 1;

        this.loaded = this.loadIndex >= 2;
      })

      this.lowPipePhys= new CANNON.Body({
        shape: new CANNON.Box(new CANNON.Vec3(1, 8.5 ,1)),
        type: CANNON.Body.KINEMATIC,
        mass: 0,
      })
      this.lowPipePhys.position.set(0, -17 + randomHeight, 30)
      this.lowPipePhys.velocity.set(0, 0, -2)

      //High pipe
      gltfLoader.load("/models/pipeInverted.gltf", (pipe) => {
        const pipeLoaded = pipe.scene;
        //half 8.5
        // pos x = 30 miny = 5 maxy = 17
        this.topPipe = pipeLoaded;
        scene.add(pipeLoaded)
        this.loadIndex += 1;

        this.loaded = this.loadIndex >= 2;
      })

      this.topPipePhys= new CANNON.Body({
        shape: new CANNON.Box(new CANNON.Vec3(1, 8.5 ,1)),
        type: CANNON.Body.KINEMATIC,
        mass: 0,
      })
      this.topPipePhys.position.set(0, 5 + randomHeight, 30)
      this.topPipePhys.velocity.set(0, 0, -2)

      physWorld.addBody(this.topPipePhys)
      physWorld.addBody(this.lowPipePhys)
    }

    updatePosition = () => {

      if (!this.loaded) return;

      const physTopPosition = new THREE.Vector3(this.topPipePhys.position.x, this.topPipePhys.position.y, this.topPipePhys.position.z)
      const physlowPosition = new THREE.Vector3(this.lowPipePhys.position.x, this.lowPipePhys.position.y, this.lowPipePhys.position.z)
      this.topPipe.position.copy(physTopPosition)
      this.lowPipe.position.copy(physlowPosition)
    }

    updateSpeed = (speed : number) => {
      this.lowPipePhys.velocity.set(0, 0, -speed)
      this.topPipePhys.velocity.set(0, 0, -speed)
    }

    stopMovement = () => {
      this.lowPipePhys.velocity.set(0, 0, 0)
      this.topPipePhys.velocity.set(0, 0, 0)
    }
  }

  const pipe = new Pipes()
  const player = new Player()

  //Fonditos
  textureLoader.load("/background/fondito.jpg", (bg) => {
    bg.mapping = THREE.EquirectangularRefractionMapping;
    scene.background = bg;
  })

  rgbeLoader.load('/background/fondito.hdr', (bg) => { 
    bg.mapping = THREE.EquirectangularRefractionMapping
    scene.environment = bg;
  })

  //Camara y aja
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  camera.position.set(-20, 0, 7.5)
  camera.rotation.set(0, -1.5708 ,0)

  //Logica del gameplay
  window.addEventListener("click", () => {
    player.onClick()
  })

  const physStep = 1 / 30;
  function animate() {

    physWorld.step(physStep)

    pipe.updatePosition()
    player.updatePosition()

    requestAnimationFrame( animate );


    renderer.render( scene, camera );
  }


  window.addEventListener( 'resize', onWindowResize, false );
  
  function onWindowResize(){ //funcion para redimensionar ventana si el usuario le anda moviendo
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
  }
  
  animate(); //Iniciamos el loop
}


const App = () => {

  return (
    <>
      <div id="info">Buenas</div>
      {doThreeJS()}
    </>
  )
}

export default App

