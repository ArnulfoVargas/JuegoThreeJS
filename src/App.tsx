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
  scene.fog = new THREE.Fog( 0xcccccc, 20, 15 );

  //Luz ambiental
  const ambientLight = new THREE.AmbientLight(0xe0e0e0,1);
  scene.add(ambientLight);
  
  //Luz direccional
  const light = new THREE.DirectionalLight(0xffffff,0.6);
  light.position.set(0,4,2);
  scene.add(light);
  
  //Elementos del juego
  let points : number = 0;

  class Player {
    playerBody : THREE.Group<THREE.Object3DEventMap> | any;
    playerPhys : CANNON.Body;
    isLoaded : boolean = false;
    isAlive : boolean = true;
    id : number;

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
      this.id = this.playerPhys.id;
    }

    onClick = () => {
      if(this.isAlive)
        this.playerPhys.velocity.set(0, 6, 0);
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

    onCollide = () => {
      this.isAlive = false;
      this.playerPhys.type = CANNON.Body.STATIC;
    }
  }


  class Pipes {
    
    topPipe : THREE.Group<THREE.Object3DEventMap> | any;
    lowPipe : THREE.Group<THREE.Object3DEventMap> | any;
    lowPipePhys : CANNON.Body;
    topPipePhys : CANNON.Body;
    addPointsPhys : CANNON.Body;
    loadIndex : number = 0;
    loaded : boolean = false;

    constructor() {

      const randomHeight = Math.floor(Math.random() * 13)
      
      // Low Pipe
      gltfLoader.load("/models/pipe.gltf", (pipe) => {
        const pipeLoaded = pipe.scene;
        pipeLoaded.position.set(0, 0, 100)
        this.lowPipe = pipeLoaded;
        scene.add(pipeLoaded);
        this.loadIndex += 1;

        this.loaded = this.loadIndex >= 2;
      })

      //Low pipe phys
      this.lowPipePhys= new CANNON.Body({
        shape: new CANNON.Box(new CANNON.Vec3(1, 8.5 ,1)),
        type: CANNON.Body.KINEMATIC,
        mass: 0,
      })
      this.lowPipePhys.position.set(0, -17 + randomHeight, 30)
      this.lowPipePhys.velocity.set(0, 0, -2)

      physWorld.addBody(this.lowPipePhys)

      this.lowPipePhys.addEventListener("collide", (event : any) => {
        if(player.id === event.body.id){
          onCollide()
        }
      })

      //High pipe
      gltfLoader.load("/models/pipeInverted.gltf", (pipe) => {
        const pipeLoaded = pipe.scene;
        pipeLoaded.position.set(0, 0, 100)
        this.topPipe = pipeLoaded;
        scene.add(pipeLoaded)
        this.loadIndex += 1;

        this.loaded = this.loadIndex >= 2;
      })

      //High pipe phys
      this.topPipePhys= new CANNON.Body({
        shape: new CANNON.Box(new CANNON.Vec3(1, 8.5 ,1)),
        type: CANNON.Body.KINEMATIC,
        mass: 0,
      })
      this.topPipePhys.position.set(0, 5 + randomHeight, 30)
      this.topPipePhys.velocity.set(0, 0, -2)

      physWorld.addBody(this.topPipePhys)

      this.topPipePhys.addEventListener("collide", (event : any) => {
        if(player.id === event.body.id){
          onCollide()
        }
      })

      // AddPoints collider
      this.addPointsPhys = new CANNON.Body({
        type: CANNON.Body.KINEMATIC,
        shape: new CANNON.Box(new CANNON.Vec3(.1, 2.5, .1)),
        mass: 0,
      })
      this.addPointsPhys.position.set(0, -6 + randomHeight, 30)
      this.addPointsPhys.velocity.set(0, 0, -2)
      this.addPointsPhys.collisionResponse = false;

      physWorld.addBody(this.addPointsPhys)

      this.addPointsPhys.addEventListener("collide", (event : any) => {
        if(player.id === event.body.id){
          points += 1;
        }
      })
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
      this.addPointsPhys.velocity.set(0, 0, -speed)
    }

    stopMovement = () => {
      this.lowPipePhys.velocity.set(0, 0, 0)
      this.topPipePhys.velocity.set(0, 0, 0)
      this.addPointsPhys.velocity.set(0, 0, 0)
    }

    resetPipe = () => {
      const randomHeight = Math.floor(Math.random() * 13)
      this.topPipePhys.position.set(0, 5 + randomHeight, 30)
      this.lowPipePhys.position.set(0, -17 + randomHeight, 30)
      this.addPointsPhys.position.set(0, -6 + randomHeight, 30)
    }
  }

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

  //Creacion de pipes
  const pipes : Array<Pipes>= []
  let createdPipes : number = 0;
  const maxPipes : number = 6;
  const timePerSpawn : number = 3000;
  let pipeIndex : number = 0;

  let currentInterval = setInterval(()=>{

    pipes.push(new Pipes())
    createdPipes += 1;
    if(createdPipes >= maxPipes){
      clearInterval(currentInterval)
      
      currentInterval = setInterval(() => {

        pipes[pipeIndex].resetPipe();
        pipeIndex++;
        pipeIndex %= pipes.length;
      }, timePerSpawn)
    }
  }, timePerSpawn)

  //Creacion de bordes

  function createBorder(x:number, y:number, z:number){
    const borderPhys= new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(3, .5 ,40)),
      type: CANNON.Body.STATIC,
      mass: 0,
    })
    borderPhys.position.set(x, y, z);
    physWorld.addBody(borderPhys)

    const borderGeo = new THREE.BoxGeometry(6,1,80)
    const borderMat = new THREE.MeshPhongMaterial({color: 'green'})
    const borderObj = new THREE.Mesh(borderGeo, borderMat);
    scene.add(borderObj);
    borderObj.position.copy(new THREE.Vector3(
      borderPhys.position.x,
      borderPhys.position.y,
      borderPhys.position.z
    ))

    borderPhys.addEventListener("collide", (event : any) => {
      if(player.id === event.body.id){
        onCollide()
      }
    })
  }

  createBorder(0, -10, 10);
  createBorder(0, 10, 10);

  //Logica del gameplay
  window.addEventListener("click", () => {
    player.onClick()
  })

  function onCollide() {
    player.onCollide()
    clearInterval(currentInterval)

    for (const pipe of pipes)
      pipe.stopMovement()
  }

  const physStep = 1 / 60;
  function animate() {

    for(const pipe of pipes)
      pipe.updatePosition()

    physWorld.step(physStep)

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
      {doThreeJS()}
    </>
  )
}

export default App

