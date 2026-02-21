import sys

with open('/home/vzor/vzor/config/nginx/www/index.html', 'r') as f:
    code = f.read()

changes = 0

# === 1. Polar angle limits ===
old = "controls.maxDistance = 800; // v3.34: Allow zooming out far\n\n        // INTERACTION LISTENER"
new = "controls.maxDistance = 800; // v3.34: Allow zooming out far\n        controls.minPolarAngle = 0;\n        controls.maxPolarAngle = Math.PI;\n\n        // INTERACTION LISTENER"
if old in code:
    code = code.replace(old, new, 1)
    changes += 1
    print('1. Polar angles: OK')
else:
    print('1. Polar angles: NOT FOUND')

# === 2. Move handler: skip shader mouse in orbit + disable group rotation in drill-down ===
old = """        function move(x, y, cx, cy) {
            lastInteractTime = Date.now(); // Track interaction
            mv.x = (cx / window.innerWidth) * 2 - 1; mv.y = -(cy / window.innerHeight) * 2 + 1;
            ray.setFromCamera(mv, camera); const pt = new THREE.Vector3(); ray.ray.intersectPlane(pl, pt);
            material.uniforms.uMouse.value.set(pt.x, pt.y);
            material.uniforms.uMouseActive.value = 1.0;

            clearTimeout(mouseTimer);
            mouseTimer = setTimeout(() => {
                // We keep it at 0 on mobile unless moving, but on desktop we fade it
            }, 1000);

            // v3.12.9: Allow rotation in both normal and drill-down modes
            if (isDrag) {
                let dx = x - prevM.x; let dy = y - prevM.y;
                group.rotation.y += dx * 0.005;
                group.rotation.x += dy * 0.005;
                mom = { x: dx * 0.005, y: dy * 0.005 }; prevM = { x, y };
                lastInteractTime = Date.now(); // Reset idle timer on drag
            }"""
new = """        function move(x, y, cx, cy) {
            lastInteractTime = Date.now(); // Track interaction
            // v3.35: Skip shader mouse effects during orbit mode
            if (!window._orbitPivotTask) {
                mv.x = (cx / window.innerWidth) * 2 - 1; mv.y = -(cy / window.innerHeight) * 2 + 1;
                ray.setFromCamera(mv, camera); const pt = new THREE.Vector3(); ray.ray.intersectPlane(pl, pt);
                material.uniforms.uMouse.value.set(pt.x, pt.y);
                material.uniforms.uMouseActive.value = 1.0;
            }

            clearTimeout(mouseTimer);
            mouseTimer = setTimeout(() => {
                // We keep it at 0 on mobile unless moving, but on desktop we fade it
            }, 1000);

            // v3.12.9: In drill-down OrbitControls handles rotation
            if (isDrag) {
                let dx = x - prevM.x; let dy = y - prevM.y;
                if (!isDrilled) {
                    group.rotation.y += dx * 0.005;
                    group.rotation.x += dy * 0.005;
                    mom = { x: dx * 0.005, y: dy * 0.005 };
                }
                prevM = { x, y };
                lastInteractTime = Date.now();
            }"""
if old in code:
    code = code.replace(old, new, 1)
    changes += 1
    print('2. Move handler: OK')
else:
    print('2. Move handler: NOT FOUND')

# === 3. Drill-down entry 1 ===
old = "controls.enabled = true;\n            controls.target.set(0, 0, 0);\n\n            console.log('[DrillDown] UI shown for:'"
new = "controls.enabled = true;\n            controls.target.set(0, 0, 0);\n            window._orbitPivotTask = null;\n\n            console.log('[DrillDown] UI shown for:'"
if old in code:
    code = code.replace(old, new, 1)
    changes += 1
    print('3. Drill-down entry 1: OK')
else:
    print('3. Drill-down entry 1: NOT FOUND')

# === 4. Drill-down entry 2 ===
old = "controls.enabled = true;\n            controls.target.set(0, 0, 0);\n\n            // Sync Camera Z"
new = "controls.enabled = true;\n            controls.target.set(0, 0, 0);\n            window._orbitPivotTask = null;\n\n            // Sync Camera Z"
if old in code:
    code = code.replace(old, new, 1)
    changes += 1
    print('4. Drill-down entry 2: OK')
else:
    print('4. Drill-down entry 2: NOT FOUND')

# === 5. Mousedown: skip uMouseActive in orbit ===
old = "            mom = { x: 0, y: 0 };\n            material.uniforms.uMouseActive.value = 1;\n        });"
new = "            mom = { x: 0, y: 0 };\n            if (!window._orbitPivotTask) material.uniforms.uMouseActive.value = 1;\n        });"
if old in code:
    code = code.replace(old, new, 1)
    changes += 1
    print('5. Mousedown guard: OK')
else:
    print('5. Mousedown guard: NOT FOUND')

# === 6. Right-click + Escape to exit orbit ===
old = "        // Double-click on empty space = unfocus block (registered ONCE)\n        document.getElementById('canvas-wrapper').addEventListener('dblclick', (event) => {"
new = """        // v3.35: Right-click exits orbit mode
        document.getElementById('canvas-wrapper').addEventListener('contextmenu', (event) => {
            if (window._orbitPivotTask && isDrilled) {
                event.preventDefault();
                if (window.resetOrbitPivot) window.resetOrbitPivot();
            }
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && window._orbitPivotTask && isDrilled) {
                if (window.resetOrbitPivot) window.resetOrbitPivot();
            }
        });

        // Double-click on empty space = unfocus block (registered ONCE)
        document.getElementById('canvas-wrapper').addEventListener('dblclick', (event) => {"""
if old in code:
    code = code.replace(old, new, 1)
    changes += 1
    print('6. Right-click/Escape exit: OK')
else:
    print('6. Right-click/Escape exit: NOT FOUND')

# === 7. Dblclick flyBack: proper controls management ===
old = """            if (dblHits.length === 0) {
                window._focusedBlock = null;
                window._focusedPhase = null;
                group.children.forEach(ch => {
                    if (ch.userData && ch.userData.isLabel) ch.visible = true;
                });
                // Return camera to overview position
                const startPos = camera.position.clone();
                const startTarget = controls.target.clone();
                const overviewPos = new THREE.Vector3(0, 0, 450);
                const overviewTarget = new THREE.Vector3(0, 0, 0);
                const duration = 1000;
                const startTime = Date.now();
                function flyBack() {
                    const elapsed = Date.now() - startTime;
                    const t = Math.min(elapsed / duration, 1);
                    const ease = 1 - Math.pow(1 - t, 3);
                    camera.position.lerpVectors(startPos, overviewPos, ease);
                    controls.target.lerpVectors(startTarget, overviewTarget, ease);
                    controls.update();
                    if (t < 1) requestAnimationFrame(flyBack);
                }
                flyBack();
            }"""
new = """            if (dblHits.length === 0) {
                if (window._orbitPivotTask && window._orbitPivotTask.mesh) {
                    window._orbitPivotTask.mesh.scale.setScalar(1.0);
                    if (window._orbitPivotTask.mesh.userData.material)
                        window._orbitPivotTask.mesh.userData.material.opacity = 0.9;
                }
                window._orbitPivotTask = null;
                window._isFlyAnimating = true;
                window._focusedBlock = null;
                window._focusedPhase = null;
                controls.enabled = false;
                flushControlsDeltas();
                group.children.forEach(ch => {
                    if (ch.userData && ch.userData.isLabel) ch.visible = true;
                });
                const startPos = camera.position.clone();
                const startTarget = controls.target.clone();
                const overviewPos = new THREE.Vector3(0, 0, 450);
                const overviewTarget = new THREE.Vector3(0, 0, 0);
                const duration = 1000;
                const startTime = Date.now();
                function flyBack() {
                    const elapsed = Date.now() - startTime;
                    const t = Math.min(elapsed / duration, 1);
                    const ease = 1 - Math.pow(1 - t, 3);
                    camera.position.lerpVectors(startPos, overviewPos, ease);
                    controls.target.lerpVectors(startTarget, overviewTarget, ease);
                    camera.lookAt(controls.target);
                    if (t < 1) {
                        requestAnimationFrame(flyBack);
                    } else {
                        controls.enableDamping = true;
                        controls.dampingFactor = 0.05;
                        controls.enableZoom = false;
                        controls.enablePan = true;
                        controls.minDistance = 30;
                        controls.maxDistance = 800;
                        controls.enabled = true;
                        controls.update();
                        window._isFlyAnimating = false;
                    }
                }
                flyBack();
            }"""
if old in code:
    code = code.replace(old, new, 1)
    changes += 1
    print('7. Dblclick flyBack: OK')
else:
    print('7. Dblclick flyBack: NOT FOUND')

# === 8. Custom wheel: skip when task focused ===
old = "if (isDrilled && !isOverNodeEditor && !isOverDetailPanel && !isOverLeftPanel) {"
new = "if (isDrilled && !window._orbitPivotTask && !isOverNodeEditor && !isOverDetailPanel && !isOverLeftPanel) {"
if old in code:
    code = code.replace(old, new, 1)
    changes += 1
    print('8. Custom wheel guard: OK')
else:
    print('8. Custom wheel guard: NOT FOUND')

# === 9. uMouseActive decay: force 0 in orbit ===
old = """            // Smoother MouseActive fade
            if (!isDrag && material.uniforms.uMouseActive.value > 0.0) {
                material.uniforms.uMouseActive.value *= 0.92;
            }"""
new = """            // Smoother MouseActive fade (force 0 in orbit mode)
            if (window._orbitPivotTask) {
                material.uniforms.uMouseActive.value = 0;
            } else if (!isDrag && material.uniforms.uMouseActive.value > 0.0) {
                material.uniforms.uMouseActive.value *= 0.92;
            }"""
if old in code:
    code = code.replace(old, new, 1)
    changes += 1
    print('9. uMouseActive orbit guard: OK')
else:
    print('9. uMouseActive orbit guard: NOT FOUND')

# === 10. Main loop controls.update() guard ===
old = """            if (isDrilled) {
                // OrbitControls handles camera
                controls.update();"""
new = """            if (isDrilled) {
                // OrbitControls handles camera (skip during fly animations)
                if (!window._isFlyAnimating) controls.update();"""
if old in code:
    code = code.replace(old, new, 1)
    changes += 1
    print('10. controls.update guard: OK')
else:
    print('10. controls.update guard: NOT FOUND')

# === 11. Force simulation: pin focused task ===
old = """                    // Apply forces + boundary constraint
                    for (let i = 0; i < n; i++) {
                        const t = tp[i];
                        const pos = t.mesh.position;

                        // Pull toward own block center"""
new = """                    // Apply forces + boundary constraint
                    for (let i = 0; i < n; i++) {
                        const t = tp[i];
                        const pos = t.mesh.position;

                        // Pin focused task so orbit pivot is stable
                        if (window._orbitPivotTask && t === window._orbitPivotTask) {
                            t._vx = 0; t._vy = 0; t._vz = 0;
                            t._fx = 0; t._fy = 0; t._fz = 0;
                            continue;
                        }

                        // Pull toward own block center"""
if old in code:
    code = code.replace(old, new, 1)
    changes += 1
    print('11. Force sim pin: OK')
else:
    print('11. Force sim pin: NOT FOUND')

# === 12. Remove per-frame orbit target update ===
old = """                    // v3.33: Keep orbit pivot on focused task as it moves
                    if (window._orbitPivotTask && window._orbitPivotTask.mesh) {
                        const fp = window._orbitPivotTask.mesh.position;
                        controls.target.set(fp.x, fp.y, fp.z);
                    }"""
new = "                    // v3.33: Orbit target set once by flyToTask; task pinned, no per-frame update"
if old in code:
    code = code.replace(old, new, 1)
    changes += 1
    print('12. Remove per-frame orbit update: OK')
else:
    print('12. Remove per-frame orbit update: NOT FOUND')

# === 13. Idle drift: skip in drill-down ===
old = "if (elapsed > 10000) {\n                    // Check if we are actually rotated away from 0\n                    if (Math.abs(group.rotation.y) > 0.01"
new = "if (elapsed > 10000 && !isDrilled) {\n                    // Check if we are actually rotated away from 0\n                    if (Math.abs(group.rotation.y) > 0.01"
if old in code:
    code = code.replace(old, new, 1)
    changes += 1
    print('13. Idle drift guard: OK')
else:
    print('13. Idle drift guard: NOT FOUND')

# === 14. Replace flyToTask + resetOrbitPivot ===
old = "        // v3.33: Blender/Rhino-style orbit pivot\n        // Click task \u2192 orbit around it. Click empty \u2192 reset to origin.\n        // Camera STAYS where it is. Only the pivot point changes.\n        window._orbitPivotTask = null; // currently focused task (or null)\n\n        window.flyToTask = function(task) {\n            if (!task || !task.mesh) return;\n            window._orbitPivotTask = task;\n\n            const tp = task.mesh.position;\n            const targetPos = new THREE.Vector3(tp.x, tp.y, tp.z);\n            const startTarget = controls.target.clone();\n            const duration = 400; // fast pivot change\n            const startTime = Date.now();\n\n            // Enable OrbitControls zoom when focused on a task\n            controls.enableZoom = true;\n\n            lastInteractTime = Date.now() + 10000;\n\n            function animatePivot() {\n                const elapsed = Date.now() - startTime;\n                const t = Math.min(elapsed / duration, 1);\n                const ease = 1 - Math.pow(1 - t, 3);\n\n                controls.target.lerpVectors(startTarget, targetPos, ease);\n                controls.update();\n\n                if (t < 1) requestAnimationFrame(animatePivot);\n                else lastInteractTime = Date.now();\n            }\n            animatePivot();\n        };\n\n        window.resetOrbitPivot = function() {\n            window._orbitPivotTask = null;\n\n            const startTarget = controls.target.clone();\n            const originTarget = new THREE.Vector3(0, 0, 0);\n            const duration = 400;\n            const startTime = Date.now();\n\n            controls.enableZoom = false; // back to manual zoom\n\n            function animateReset() {\n                const elapsed = Date.now() - startTime;\n                const t = Math.min(elapsed / duration, 1);\n                const ease = 1 - Math.pow(1 - t, 3);\n\n                controls.target.lerpVectors(startTarget, originTarget, ease);\n                controls.update();\n\n                if (t < 1) requestAnimationFrame(animateReset);\n            }\n            animateReset();\n        };"

new = """        // v3.33: Blender-style orbit pivot
        // r160 OrbitControls: closure-scoped internals, flush via update() with damping OFF
        window._orbitPivotTask = null;
        window._isFlyAnimating = false;

        function flushControlsDeltas() {
            var d = controls.enableDamping;
            controls.enableDamping = false;
            controls.update();
            controls.enableDamping = d;
        }

        window.flyToTask = function(task) {
            if (!task || !task.mesh) return;
            window._orbitPivotTask = task;
            window._isFlyAnimating = true;

            group.rotation.set(0, 0, 0);
            mom.x = 0; mom.y = 0;
            material.uniforms.uMouseActive.value = 0;
            currentZoom = 1.0; targetZoom = 1.0;
            material.uniforms.uGraphZoom.value = 1.0;

            controls.enabled = false;
            flushControlsDeltas();

            var targetPos = new THREE.Vector3();
            task.mesh.getWorldPosition(targetPos);
            var startTarget = controls.target.clone();
            var startCamPos = camera.position.clone();

            var approachDir = startCamPos.clone().sub(targetPos);
            if (approachDir.length() < 0.001) approachDir.set(0, 0, 1);
            approachDir.normalize();

            var orbitRadius = 60;
            var endCamPos = targetPos.clone().add(approachDir.multiplyScalar(orbitRadius));
            var duration = 600;
            var startTime = Date.now();

            function animatePivot() {
                var elapsed = Date.now() - startTime;
                var t = Math.min(elapsed / duration, 1);
                var ease = 1 - Math.pow(1 - t, 3);
                camera.position.lerpVectors(startCamPos, endCamPos, ease);
                controls.target.lerpVectors(startTarget, targetPos, ease);
                camera.lookAt(controls.target);
                if (t < 1) {
                    requestAnimationFrame(animatePivot);
                } else {
                    controls.enableDamping = false;
                    controls.enableZoom = true;
                    controls.enablePan = false;
                    controls.minDistance = 20;
                    controls.maxDistance = 200;
                    controls.enabled = true;
                    controls.update();
                    window._isFlyAnimating = false;
                    lastInteractTime = Date.now();
                }
            }
            animatePivot();
        };

        window.resetOrbitPivot = function() {
            if (window._orbitPivotTask && window._orbitPivotTask.mesh) {
                window._orbitPivotTask.mesh.scale.setScalar(1.0);
                if (window._orbitPivotTask.mesh.userData.material)
                    window._orbitPivotTask.mesh.userData.material.opacity = 0.9;
            }
            window._orbitPivotTask = null;
            window._isFlyAnimating = true;

            controls.enabled = false;
            flushControlsDeltas();

            var startTarget = controls.target.clone();
            var startCamPos = camera.position.clone();
            var originTarget = new THREE.Vector3(0, 0, 0);
            var backDir = startCamPos.clone().sub(originTarget);
            if (backDir.length() < 0.001) backDir.set(0, 0, 1);
            backDir.normalize();
            var endCamPos = originTarget.clone().add(backDir.multiplyScalar(200));
            var duration = 500;
            var startTime = Date.now();

            function animateReset() {
                var elapsed = Date.now() - startTime;
                var t = Math.min(elapsed / duration, 1);
                var ease = 1 - Math.pow(1 - t, 3);
                camera.position.lerpVectors(startCamPos, endCamPos, ease);
                controls.target.lerpVectors(startTarget, originTarget, ease);
                camera.lookAt(controls.target);
                if (t < 1) {
                    requestAnimationFrame(animateReset);
                } else {
                    controls.enableDamping = true;
                    controls.dampingFactor = 0.05;
                    controls.enableZoom = false;
                    controls.enablePan = true;
                    controls.minDistance = 30;
                    controls.maxDistance = 800;
                    controls.enabled = true;
                    controls.update();
                    window._isFlyAnimating = false;
                }
            }
            animateReset();
        };"""

if old in code:
    code = code.replace(old, new, 1)
    changes += 1
    print('14. flyToTask + resetOrbitPivot: OK')
else:
    print('14. flyToTask + resetOrbitPivot: NOT FOUND')

with open('/home/vzor/vzor/config/nginx/www/index.html', 'w') as f:
    f.write(code)

print(f'\nTotal: {changes}/14 patches applied')
if changes < 14:
    print('WARNING: some patches did not match!')
else:
    print('ALL PATCHES APPLIED SUCCESSFULLY')
