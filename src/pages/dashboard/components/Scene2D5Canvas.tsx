import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { CollectorRealtime, LayoutNode } from '@/shared/types/contracts';

function colorByStatus(status: CollectorRealtime['status']): number {
  if (status === 'alarm') {
    return 0xff5b6b;
  }
  if (status === 'warn') {
    return 0xffd45d;
  }
  return 0x3dc6ff;
}

function cssColor(name: string, fallback: string): THREE.Color {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(raw || fallback);
}

export function Scene2D5Canvas({
  layout,
  collectors,
  title = '2.5D 场景',
  embedded = false
}: {
  layout: LayoutNode[];
  collectors: CollectorRealtime[];
  title?: string;
  embedded?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const width = Math.max(canvas.clientWidth, 360);
    const height = Math.max(canvas.clientHeight, 280);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 2000);
    camera.position.set(width * 0.52, -height * 0.62, 520);
    camera.lookAt(width * 0.5, height * 0.55, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.62);
    const keyLight = new THREE.DirectionalLight(0x8fd8ff, 0.9);
    keyLight.position.set(width * 0.2, -260, 360);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.45);
    fillLight.position.set(width * 0.85, height * 0.9, 220);
    scene.add(ambient, keyLight, fillLight);

    const lineColor = cssColor('--line', '#2f4f73');
    const accentColor = cssColor('--accent', '#3dc6ff');
    const baseFloorColor = new THREE.Color('#d9e0e8');

    const floorGroup = new THREE.Group();
    scene.add(floorGroup);

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(width - 24, height - 30, 18),
      new THREE.MeshStandardMaterial({
        color: baseFloorColor,
        roughness: 0.45,
        metalness: 0.18
      })
    );
    floor.position.set(width / 2, height / 2, -15);
    floorGroup.add(floor);

    const gridMat = new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0.4 });
    const grid = new THREE.Group();
    for (let x = 40; x < width - 20; x += 55) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 34, -4),
        new THREE.Vector3(x, height - 34, -4)
      ]);
      grid.add(new THREE.Line(geo, gridMat));
    }
    for (let y = 40; y < height - 20; y += 55) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(28, y, -4),
        new THREE.Vector3(width - 28, y, -4)
      ]);
      grid.add(new THREE.Line(geo, gridMat));
    }
    floorGroup.add(grid);

    const factoryRow = new THREE.Group();
    const unitGeo = new THREE.BoxGeometry(82, 52, 44);
    for (let i = 0; i < 6; i += 1) {
      const unit = new THREE.Mesh(
        unitGeo,
        new THREE.MeshStandardMaterial({
          color: new THREE.Color('#c6ced8').offsetHSL(0, 0, (i % 2) * -0.015),
          roughness: 0.42,
          metalness: 0.3
        })
      );
      unit.position.set(110 + i * 130, 94 + (i % 2) * 24, 20);
      factoryRow.add(unit);
    }
    scene.add(factoryRow);

    const statusMap = new Map(collectors.map((item) => [item.collectorId, item.status]));
    const collectorGroup = new THREE.Group();
    const rotatingRings: THREE.Mesh[] = [];

    layout.forEach((node, idx) => {
      const status = statusMap.get(node.collectorId) ?? 'normal';
      const colorHex = colorByStatus(status);
      const statusColor = new THREE.Color(colorHex);

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(9, 11, 10, 24),
        new THREE.MeshStandardMaterial({ color: statusColor, emissive: statusColor, emissiveIntensity: 0.12, metalness: 0.7, roughness: 0.3 })
      );
      base.position.set(node.x, height - node.y, 6);

      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(3.4, 3.4, 28, 20),
        new THREE.MeshStandardMaterial({ color: 0xb4eeff, emissive: accentColor, emissiveIntensity: 0.08, metalness: 0.85, roughness: 0.22 })
      );
      mast.position.set(node.x, height - node.y, 22);

      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(4.3, 18, 14),
        new THREE.MeshStandardMaterial({ color: statusColor, emissive: statusColor, emissiveIntensity: 0.18, metalness: 0.52, roughness: 0.28 })
      );
      cap.position.set(node.x, height - node.y, 38);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(13.5, 1.2, 16, 64),
        new THREE.MeshStandardMaterial({
          color: statusColor,
          emissive: statusColor,
          emissiveIntensity: status === 'alarm' ? 0.35 : 0.18,
          transparent: true,
          opacity: status === 'alarm' ? 0.95 : 0.72,
          metalness: 0.5,
          roughness: 0.3
        })
      );
      ring.position.set(node.x, height - node.y, 28);
      ring.rotation.x = Math.PI / 2;
      ring.rotation.z = idx * 0.1;

      collectorGroup.add(base, mast, cap, ring);
      rotatingRings.push(ring);
    });

    scene.add(collectorGroup);

    const scanner = new THREE.Mesh(
      new THREE.PlaneGeometry(width - 80, 9),
      new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0.2 })
    );
    scanner.position.set(width / 2, 45, 30);
    scene.add(scanner);

    let frame = 0;
    let t = 0;
    const animate = () => {
      t += 0.026;
      scanner.position.y = 45 + ((Math.sin(t) + 1) / 2) * (height - 90);

      rotatingRings.forEach((ring, idx) => {
        ring.rotation.z += 0.013 + idx * 0.00035;
        const material = ring.material as THREE.MeshStandardMaterial;
        material.opacity = 0.58 + (Math.sin(t * 2 + idx * 0.2) + 1) * 0.18;
      });

      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(frame);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
        if (obj instanceof THREE.Line) {
          obj.geometry.dispose();
          obj.material.dispose();
        }
      });
      renderer.dispose();
    };
  }, [collectors, layout]);

  if (embedded) {
    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', borderRadius: 10 }} />;
  }

  return (
    <section className="panel">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <canvas ref={canvasRef} style={{ width: '100%', height: 520, borderRadius: 10 }} />
    </section>
  );
}
