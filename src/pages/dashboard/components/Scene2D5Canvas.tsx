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

export function Scene2D5Canvas({ layout, collectors }: { layout: LayoutNode[]; collectors: CollectorRealtime[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, canvas.clientWidth, canvas.clientHeight, 0, -1, 1);
    const background = new THREE.Mesh(
      new THREE.PlaneGeometry(canvas.clientWidth, canvas.clientHeight),
      new THREE.MeshBasicMaterial({ color: 0x102138 })
    );
    background.position.set(canvas.clientWidth / 2, canvas.clientHeight / 2, -0.1);
    scene.add(background);

    const statusMap = new Map(collectors.map((item) => [item.collectorId, item.status]));
    const points = layout.map((node) => {
      const geometry = new THREE.CircleGeometry(8, 24);
      const material = new THREE.MeshBasicMaterial({ color: colorByStatus(statusMap.get(node.collectorId) ?? 'normal') });
      const point = new THREE.Mesh(geometry, material);
      point.position.set(node.x, canvas.clientHeight - node.y, 0.2);
      point.renderOrder = node.zIndex;
      scene.add(point);
      return point;
    });

    renderer.render(scene, camera);

    return () => {
      points.forEach((mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        scene.remove(mesh);
      });
      renderer.dispose();
    };
  }, [collectors, layout]);

  return (
    <section className="panel">
      <h3 style={{ marginTop: 0 }}>2.5D 场景</h3>
      <canvas ref={canvasRef} style={{ width: '100%', height: 520, borderRadius: 10 }} />
    </section>
  );
}
