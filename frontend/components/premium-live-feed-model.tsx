"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

type MotionType = "yaw" | "roll" | "pitch";
type MaterialType = "gold" | "steel";
type ProceduralModelType = "gold-lips-premium";

type PremiumLiveFeedModelProps = {
  modelPath?: string;
  motion: MotionType;
  material: MaterialType;
  proceduralModel?: ProceduralModelType;
  className?: string;
  scale?: number;
  baseRotation?: [number, number, number];
  interlockedPair?: boolean;
  fallback?: ReactNode;
};

function disposeMaterial(material: THREE.Material): void {
  const maybeTextureKeys = [
    "alphaMap",
    "aoMap",
    "bumpMap",
    "displacementMap",
    "emissiveMap",
    "envMap",
    "lightMap",
    "map",
    "metalnessMap",
    "normalMap",
    "roughnessMap",
    "specularMap"
  ];

  const materialRecord = material as unknown as Record<string, unknown>;
  maybeTextureKeys.forEach((key) => {
    const texture = materialRecord[key];
    if (texture && texture instanceof THREE.Texture) {
      texture.dispose();
    }
  });

  material.dispose();
}

function makeMaterial(type: MaterialType): THREE.MeshPhysicalMaterial {
  if (type === "gold") {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#d9ae57"),
      metalness: 1,
      roughness: 0.14,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      reflectivity: 1,
      envMapIntensity: 1.75
    });
  }

  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#c7ccd4"),
    metalness: 1,
    roughness: 0.26,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
    reflectivity: 1,
    envMapIntensity: 1.25
  });
}

function centerGeometry(geometry: THREE.BufferGeometry): void {
  geometry.computeBoundingBox();
  if (geometry.boundingBox) {
    const center = new THREE.Vector3();
    geometry.boundingBox.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);
  }
  geometry.computeVertexNormals();
}

function sculptLipSurface(
  geometry: THREE.BufferGeometry,
  fullnessStrength: number,
  verticalBias: number,
  cupidRidgeStrength: number
): void {
  const position = geometry.attributes.position;
  if (!(position instanceof THREE.BufferAttribute)) {
    return;
  }

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);

    const xFalloff = Math.exp(-Math.pow(x / 1.95, 2) * 4.1);
    const yFalloff = Math.exp(-Math.pow((y - verticalBias) / 1.2, 2) * 2.7);
    const cupidFalloff = Math.exp(-Math.pow(x / 0.52, 2) * 5.6);
    const edgeCut = 1 - Math.min(0.82, Math.abs(x) / 2.15);

    const depthBoost =
      fullnessStrength * xFalloff * yFalloff + cupidRidgeStrength * cupidFalloff * Math.exp(-Math.pow(y / 0.62, 2) * 6.2);

    position.setXYZ(index, x, y, z + depthBoost * edgeCut);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
}

function createPremiumGoldLipsSculpture(material: THREE.Material): THREE.Group {
  const sculpture = new THREE.Group();

  const upperLipShape = new THREE.Shape();
  upperLipShape.moveTo(-1.95, 0);
  upperLipShape.bezierCurveTo(-1.38, 0.66, -0.9, 0.97, -0.36, 0.74);
  upperLipShape.bezierCurveTo(-0.14, 1.06, 0.14, 1.06, 0.36, 0.74);
  upperLipShape.bezierCurveTo(0.9, 0.97, 1.38, 0.66, 1.95, 0);
  upperLipShape.bezierCurveTo(1.28, -0.33, 0.72, -0.5, 0.18, -0.4);
  upperLipShape.bezierCurveTo(0.08, -0.52, -0.08, -0.52, -0.18, -0.4);
  upperLipShape.bezierCurveTo(-0.72, -0.5, -1.28, -0.33, -1.95, 0);

  const lowerLipShape = new THREE.Shape();
  lowerLipShape.moveTo(-1.78, 0.02);
  lowerLipShape.bezierCurveTo(-1.1, -0.76, -0.54, -1.04, 0, -1.0);
  lowerLipShape.bezierCurveTo(0.54, -1.04, 1.1, -0.76, 1.78, 0.02);
  lowerLipShape.bezierCurveTo(1.22, 0.48, 0.66, 0.63, 0, 0.56);
  lowerLipShape.bezierCurveTo(-0.66, 0.63, -1.22, 0.48, -1.78, 0.02);

  const upperGeometry = new THREE.ExtrudeGeometry(upperLipShape, {
    steps: 5,
    depth: 0.84,
    curveSegments: 132,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.24,
    bevelOffset: 0,
    bevelSegments: 22
  });
  const lowerGeometry = new THREE.ExtrudeGeometry(lowerLipShape, {
    steps: 6,
    depth: 0.92,
    curveSegments: 128,
    bevelEnabled: true,
    bevelThickness: 0.22,
    bevelSize: 0.26,
    bevelOffset: 0,
    bevelSegments: 24
  });

  centerGeometry(upperGeometry);
  centerGeometry(lowerGeometry);
  sculptLipSurface(upperGeometry, 0.24, 0.2, 0.12);
  sculptLipSurface(lowerGeometry, 0.3, -0.2, 0.08);

  const upperMesh = new THREE.Mesh(upperGeometry, material);
  const lowerMesh = new THREE.Mesh(lowerGeometry, material);
  upperMesh.castShadow = false;
  upperMesh.receiveShadow = false;
  lowerMesh.castShadow = false;
  lowerMesh.receiveShadow = false;

  upperMesh.position.set(0, 0.5, 0.05);
  upperMesh.rotation.x = 0.08;
  lowerMesh.position.set(0, -0.56, 0.08);
  lowerMesh.rotation.x = -0.06;

  const philtrumGeometry = new THREE.TorusGeometry(0.28, 0.06, 42, 140, Math.PI * 1.18);
  const philtrumMesh = new THREE.Mesh(philtrumGeometry, material);
  philtrumMesh.rotation.set(Math.PI / 2, 0, Math.PI);
  philtrumMesh.position.set(0, 0.18, 0.34);

  sculpture.add(upperMesh);
  sculpture.add(lowerMesh);
  sculpture.add(philtrumMesh);
  sculpture.rotation.set(0.08, -0.18, -0.08);

  return sculpture;
}

export function PremiumLiveFeedModel({
  modelPath,
  motion,
  material,
  proceduralModel,
  className = "",
  scale = 1,
  baseRotation = [0, 0, 0],
  interlockedPair = false,
  fallback = null
}: PremiumLiveFeedModelProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [renderError, setRenderError] = useState(false);
  const [baseRotationX, baseRotationY, baseRotationZ] = baseRotation;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    setRenderError(false);
    let isDisposed = false;
    let frameId = 0;
    let resizeObserver: ResizeObserver | null = null;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 4.4);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
    } catch {
      setRenderError(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const environment = new RoomEnvironment();
    const envRenderTarget = pmremGenerator.fromScene(environment);
    scene.environment = envRenderTarget.texture;

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.25);
    keyLight.position.set(3.2, 3.8, 5.1);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.25);
    rimLight.position.set(-3.5, 2.5, -4);
    scene.add(rimLight);

    const fillLight = new THREE.HemisphereLight(0xd9ebff, 0x1f1b2f, 1.05);
    scene.add(fillLight);
    if (proceduralModel === "gold-lips-premium") {
      const accentLight = new THREE.DirectionalLight(0xfff2cc, 1.35);
      accentLight.position.set(1.2, 1.5, 3.3);
      scene.add(accentLight);
    }

    const iconRoot = new THREE.Group();
    iconRoot.rotation.set(baseRotation[0], baseRotation[1], baseRotation[2]);
    scene.add(iconRoot);

    const sharedMaterial = makeMaterial(material);
    const appliedMaterials = new Set<THREE.Material>();
    const assignMaterial = (object: THREE.Object3D): void => {
      object.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) {
          return;
        }
        if (Array.isArray(node.material)) {
          node.material.forEach((materialItem) => {
            appliedMaterials.add(materialItem);
          });
        } else if (node.material) {
          appliedMaterials.add(node.material);
        }
        node.material = sharedMaterial;
      });
    };

    const fitToFrame = (object: THREE.Object3D): void => {
      const box = new THREE.Box3().setFromObject(object);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      const maxAxis = Math.max(size.x, size.y, size.z) || 1;
      const targetSize = 2.2 * scale;
      const factor = targetSize / maxAxis;
      object.scale.multiplyScalar(factor);
      object.position.sub(center.multiplyScalar(factor));
    };

    if (proceduralModel === "gold-lips-premium") {
      const premiumLips = createPremiumGoldLipsSculpture(sharedMaterial);
      iconRoot.add(premiumLips);
      fitToFrame(premiumLips);
    } else if (modelPath) {
      const loader = new GLTFLoader();
      loader.load(
        modelPath,
        (gltf) => {
          if (isDisposed) {
            return;
          }

          const modelRoot = gltf.scene;
          assignMaterial(modelRoot);

          if (interlockedPair) {
            const firstRing = modelRoot;
            const secondRing = modelRoot.clone(true);
            assignMaterial(secondRing);

            firstRing.position.set(-0.44, 0.02, 0.1);
            firstRing.rotation.set(0.15, 0.18, -0.1);
            secondRing.position.set(0.46, -0.08, -0.05);
            secondRing.rotation.set(-0.18, -0.25, 0.24);

            const ringPair = new THREE.Group();
            ringPair.add(firstRing);
            ringPair.add(secondRing);
            iconRoot.add(ringPair);
            fitToFrame(ringPair);
          } else {
            iconRoot.add(modelRoot);
            fitToFrame(modelRoot);
          }
        },
        undefined,
        () => {
          if (!isDisposed) {
            setRenderError(true);
          }
        }
      );
    } else {
      setRenderError(true);
    }

    const resize = (): void => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    resize();
    resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(mount);

    const wrapAngle = (value: number): number => value % (Math.PI * 2);
    const clock = new THREE.Clock();
    let primarySpin = 0;
    let secondarySpin = 0;
    const animate = (): void => {
      frameId = window.requestAnimationFrame(animate);
      const delta = clock.getDelta();
      primarySpin = wrapAngle(primarySpin + delta * 0.2);
      secondarySpin = wrapAngle(secondarySpin + delta * 0.1);

      if (motion === "yaw") {
        iconRoot.rotation.set(baseRotationX, wrapAngle(baseRotationY + primarySpin), baseRotationZ);
      } else if (motion === "roll") {
        iconRoot.rotation.set(
          wrapAngle(baseRotationX + secondarySpin),
          baseRotationY,
          wrapAngle(baseRotationZ + primarySpin)
        );
      } else if (motion === "pitch") {
        iconRoot.rotation.set(
          wrapAngle(baseRotationX + primarySpin),
          wrapAngle(baseRotationY + secondarySpin),
          baseRotationZ
        );
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();

      iconRoot.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) {
          return;
        }
        node.geometry.dispose();
      });

      appliedMaterials.forEach((materialItem) => {
        disposeMaterial(materialItem);
      });
      disposeMaterial(sharedMaterial);

      environment.dispose();
      envRenderTarget.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [baseRotationX, baseRotationY, baseRotationZ, interlockedPair, material, modelPath, motion, proceduralModel, scale]);

  return (
    <div className={className}>
      <div ref={mountRef} className={renderError ? "hidden" : "h-full w-full"} />
      {renderError && fallback}
    </div>
  );
}
