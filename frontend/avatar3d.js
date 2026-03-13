import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";

const canvas = document.getElementById("avatarCanvas");
if (!canvas) {
  window.avatar3dController = {
    setMood() {},
    setSpeaking() {},
    setWalking() {}
  };
} else {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    40,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 0.2, 6.2);

  const ambient = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xfff4f7, 1.0);
  key.position.set(4, 5, 7);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xbac7ff, 0.55);
  fill.position.set(-4, 2, 4);
  scene.add(fill);

  const rim = new THREE.PointLight(0xffb5cb, 0.65, 24);
  rim.position.set(0, -1.4, 4);
  scene.add(rim);

  const mascot = new THREE.Group();
  scene.add(mascot);

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(1.25, 56, 56),
    new THREE.MeshStandardMaterial({
      color: 0xf8f7ff,
      roughness: 0.22,
      metalness: 0.04
    })
  );
  mascot.add(body);

  const belly = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 48, 48),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.02
    })
  );
  belly.position.set(0, -0.2, 1.02);
  belly.scale.set(1, 0.84, 0.32);
  mascot.add(belly);

  function makeEar(xOffset, tiltZ) {
    const ear = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.2, 0.78, 8, 22),
      new THREE.MeshStandardMaterial({
        color: 0xf5f3ff,
        roughness: 0.25,
        metalness: 0.02
      })
    );
    ear.position.set(xOffset, 1.35, 0.08);
    ear.rotation.z = tiltZ;
    return ear;
  }

  const earL = makeEar(-0.45, -0.2);
  const earR = makeEar(0.45, 0.2);
  mascot.add(earL);
  mascot.add(earR);

  function makeInnerEar(xOffset, tiltZ) {
    const innerEar = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.1, 0.48, 8, 16),
      new THREE.MeshStandardMaterial({
        color: 0xffd7e5,
        roughness: 0.4,
        metalness: 0.0
      })
    );
    innerEar.position.set(xOffset, 1.28, 0.22);
    innerEar.rotation.z = tiltZ;
    return innerEar;
  }

  mascot.add(makeInnerEar(-0.45, -0.2));
  mascot.add(makeInnerEar(0.45, 0.2));

  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x27223f,
    roughness: 0.24,
    metalness: 0.05
  });

  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 24), eyeMat);
  leftEye.position.set(-0.35, 0.2, 1.06);
  mascot.add(leftEye);

  const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 24), eyeMat);
  rightEye.position.set(0.35, 0.2, 1.06);
  mascot.add(rightEye);

  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.03, 16, 24, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xfc86ab, roughness: 0.3 })
  );
  mouth.rotation.z = Math.PI;
  mouth.position.set(0, -0.03, 1.08);
  mascot.add(mouth);

  const blushMat = new THREE.MeshStandardMaterial({
    color: 0xff9dbc,
    transparent: true,
    opacity: 0.7,
    roughness: 0.55,
    metalness: 0.0
  });

  const blushL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 20), blushMat);
  blushL.position.set(-0.62, -0.04, 1.0);
  blushL.scale.set(1.25, 0.75, 0.4);
  mascot.add(blushL);

  const blushR = blushL.clone();
  blushR.position.x = 0.62;
  mascot.add(blushR);

  const shadow = new THREE.Mesh(
    new THREE.RingGeometry(1.08, 1.62, 64),
    new THREE.MeshBasicMaterial({
      color: 0x8f98cf,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.45;
  scene.add(shadow);

  const state = {
    mood: "neutral",
    speaking: false,
    walking: false,
    t: 0
  };

  function moodColor() {
    if (state.mood === "happy") return new THREE.Color(0xfaf8ff);
    if (state.mood === "sad") return new THREE.Color(0xeef2ff);
    if (state.mood === "anxious") return new THREE.Color(0xfff2f8);
    if (state.mood === "angry") return new THREE.Color(0xfff0f2);
    return new THREE.Color(0xf8f7ff);
  }

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", resize);

  function animate() {
    state.t += 0.015;

    const idleBounce = Math.sin(state.t * 1.7) * 0.04;
    const speakPulse = state.speaking ? Math.sin(state.t * 20) * 0.07 : 0;
    const walkSway = state.walking ? Math.sin(state.t * 4.5) * 0.18 : 0;

    mascot.position.y = idleBounce + speakPulse;
    mascot.rotation.z = walkSway * 0.35;
    mascot.rotation.y = Math.sin(state.t * 1.1) * 0.06 + walkSway * 0.35;
    earL.rotation.x = 0.08 + Math.sin(state.t * 2.2) * 0.08;
    earR.rotation.x = 0.08 + Math.sin(state.t * 2.2 + 0.4) * 0.08;

    const bodyScale = 1 + (state.speaking ? Math.sin(state.t * 17) * 0.03 : Math.sin(state.t * 1.6) * 0.01);
    body.scale.set(1.0, bodyScale, 1.0);
    belly.scale.y = 0.84 + (state.speaking ? 0.04 : 0);

    const target = moodColor();
    body.material.color.lerp(target, 0.08);

    const blink = Math.abs(Math.sin(state.t * 1.2 + 0.3)) > 0.992 ? 0.15 : 1;
    leftEye.scale.y += (blink - leftEye.scale.y) * 0.35;
    rightEye.scale.y += (blink - rightEye.scale.y) * 0.35;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();

  window.avatar3dController = {
    setMood(nextMood) {
      state.mood = (nextMood || "neutral").toLowerCase();
    },
    setSpeaking(flag) {
      state.speaking = Boolean(flag);
    },
    setWalking(flag) {
      state.walking = Boolean(flag);
    }
  };
}
