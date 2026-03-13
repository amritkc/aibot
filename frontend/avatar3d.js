import * as THREE from "https://unpkg.com/three@0.162.0/build/three.module.js";

const canvas = document.getElementById("avatarCanvas");
if (!canvas) {
  window.avatar3dController = {
    setMood() {},
    setSpeaking() {},
    setWalking() {},
  };
} else {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 1.25, 4.2);

  const keyLight = new THREE.DirectionalLight(0xfff3ea, 1.2);
  keyLight.position.set(2.2, 3.3, 3.8);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xc6ccff, 0.8);
  fillLight.position.set(-3.1, 1.6, 1.5);
  scene.add(fillLight);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  const root = new THREE.Group();
  scene.add(root);

  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = -0.2;
  root.add(bodyGroup);

  const hairMat = new THREE.MeshStandardMaterial({ color: 0x41395a, roughness: 0.45, metalness: 0.08 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf7c7b1, roughness: 0.72, metalness: 0.02 });
  const clothMat = new THREE.MeshStandardMaterial({ color: 0xf58db2, roughness: 0.66, metalness: 0.05 });
  const obiMat = new THREE.MeshStandardMaterial({ color: 0x5f52d6, roughness: 0.55, metalness: 0.08 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2b3040, roughness: 0.6, metalness: 0.05 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.72, 44, 36), skinMat);
  head.scale.set(1, 0.96, 0.9);
  head.position.y = 1.34;
  bodyGroup.add(head);

  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.77, 44, 36), hairMat);
  hairCap.scale.set(1.02, 0.72, 1.02);
  hairCap.position.set(0, 1.68, -0.02);
  bodyGroup.add(hairCap);

  const backHair = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.92, 8, 16), hairMat);
  backHair.position.set(0, 0.9, -0.48);
  backHair.scale.set(1.35, 1.1, 0.8);
  bodyGroup.add(backHair);

  const bow = new THREE.Mesh(new THREE.TorusKnotGeometry(0.12, 0.045, 90, 14), new THREE.MeshStandardMaterial({ color: 0xff77a8, roughness: 0.55 }));
  bow.position.set(0, 1.9, 0.3);
  bow.rotation.x = 0.8;
  bodyGroup.add(bow);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.9, 10, 20), clothMat);
  body.position.set(0, 0.3, 0);
  body.scale.set(1.06, 1, 0.8);
  bodyGroup.add(body);

  const obi = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.08, 12, 40), obiMat);
  obi.rotation.x = Math.PI / 2;
  obi.position.set(0, 0.15, 0);
  bodyGroup.add(obi);

  const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.5, 8, 14), skinMat);
  leftArm.position.set(-0.58, 0.55, 0.02);
  leftArm.rotation.z = 0.22;
  bodyGroup.add(leftArm);

  const rightArm = leftArm.clone();
  rightArm.position.x = 0.58;
  rightArm.rotation.z = -0.22;
  bodyGroup.add(rightArm);

  const leftLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.56, 8, 14), legMat);
  leftLeg.position.set(-0.21, -0.62, 0);
  bodyGroup.add(leftLeg);

  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.21;
  bodyGroup.add(rightLeg);

  const eyeGeo = new THREE.SphereGeometry(0.1, 20, 16);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x22283a, roughness: 0.4 });

  function buildEye(x) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(x, 1.43, 0.56);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.043, 16, 12), pupilMat);
    pupil.position.set(0, -0.005, 0.07);
    eye.add(pupil);
    return eye;
  }

  const leftEye = buildEye(-0.2);
  const rightEye = buildEye(0.2);
  bodyGroup.add(leftEye);
  bodyGroup.add(rightEye);

  const blushMat = new THREE.MeshStandardMaterial({ color: 0xff9ab9, transparent: true, opacity: 0.35 });
  const blushLeft = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), blushMat);
  blushLeft.position.set(-0.33, 1.28, 0.55);
  blushLeft.scale.set(1.4, 0.7, 0.5);
  bodyGroup.add(blushLeft);

  const blushRight = blushLeft.clone();
  blushRight.position.x = 0.33;
  bodyGroup.add(blushRight);

  const mouthMat = new THREE.MeshStandardMaterial({ color: 0xb45467, roughness: 0.7 });
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.08, 20, 12), mouthMat);
  mouth.scale.set(1.6, 0.45, 0.5);
  mouth.position.set(0, 1.16, 0.57);
  bodyGroup.add(mouth);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(1.1, 48),
    new THREE.MeshBasicMaterial({ color: 0x59607f, transparent: true, opacity: 0.2 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.12;
  scene.add(ground);

  const state = {
    mood: "calm",
    speaking: false,
    walking: false,
  };

  function setMood(mood) {
    state.mood = mood;
    if (mood === "distress") {
      body.material.color.set(0xdf6b92);
      mouth.material.color.set(0x9a3448);
      bow.material.color.set(0xff9fbc);
    } else if (mood === "success") {
      body.material.color.set(0x6bc7a3);
      mouth.material.color.set(0x6a9f4f);
      bow.material.color.set(0x8bd0ff);
    } else {
      body.material.color.set(0xf58db2);
      mouth.material.color.set(0xb45467);
      bow.material.color.set(0xff77a8);
    }
  }

  function setSpeaking(flag) {
    state.speaking = flag;
  }

  function setWalking(flag) {
    state.walking = flag;
  }

  window.avatar3dController = { setMood, setSpeaking, setWalking };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const clock = new THREE.Clock();

  function animate() {
    const t = clock.getElapsedTime();

    const idleY = Math.sin(t * 1.8) * 0.03;
    root.position.y = idleY;
    root.rotation.y = Math.sin(t * 0.7) * 0.08;

    leftEye.scale.y = rightEye.scale.y = Math.abs(Math.sin(t * 0.7)) < 0.02 ? 0.12 : 1;

    if (state.speaking) {
      const talk = 0.45 + (Math.sin(t * 18) + 1) * 0.25;
      mouth.scale.y = talk;
      mouth.scale.x = 1.35 - talk * 0.35;
    } else {
      mouth.scale.y = 0.45;
      mouth.scale.x = 1.6;
    }

    if (state.walking) {
      const swing = Math.sin(t * 8) * 0.48;
      leftArm.rotation.x = swing * 0.35;
      rightArm.rotation.x = -swing * 0.35;
      leftLeg.rotation.x = -swing * 0.42;
      rightLeg.rotation.x = swing * 0.42;
      bodyGroup.position.y = Math.abs(Math.sin(t * 8)) * 0.08;
    } else {
      leftArm.rotation.x = 0;
      rightArm.rotation.x = 0;
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
      bodyGroup.position.y = 0;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener("resize", resize);
  animate();
}
