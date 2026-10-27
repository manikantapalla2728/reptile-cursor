# Anatomical Reptile Skeleton Cursor — Minimalist Scientific Illustration

An interactive, minimalist anatomical reptile skeleton mouse cursor created with vanilla JavaScript and HTML5 Canvas.

Designed strictly around scientific skeletal illustration aesthetics on a pure black background (`#000000`) with thin, delicate off-white bone linework, articulated joints, curved ribs, and natural quadruped inverse kinematics.

https://github.com/user-attachments/assets/reptile_skeleton_cursor_15s.mp4

---

## 🦴 Visual Design & Anatomy

- **Pure Black Canvas**: 100% jet black backdrop (`#000000`) without gradients, glowing halos, or particle effects.
- **Scientific Skeletal Linework**: Rendered using delicate 1.1px–1.4px off-white/pale bone lines (`rgba(238, 242, 246, 0.92)`).
- **52-Vertebra Spinal Column**: Articulated cervical, thoracic, sacral, and caudal sections with perpendicular vertebral centra discs.
- **18 Pairs of Curved Ribs**: Sweeping parabolic costal hoops forming a slender, streamlined thoracic basket.
- **Whiplash Caudal Tail**: Long, tapering serpentine tail equipped with herringbone chevron transverse spines.
- **Skeletal Reptilian Skull**: Features a rostral nasal ring, eye fenestrae/orbits, braincase suture, and temporal cheek arches.
- **Four Articulated Limbs**: 2-joint sprawling quadruped posture (humerus/femur, radius/tibia) with bone condyle rings.
- **5 Radiating Skeletal Digits**: Each foot possesses 5 distinct radiating toe bones ending in sharp claw hooks.

---

## 🦎 Kinematics & Animation

1. **Active Mouse Chasing**:
   - Detects cursor motion with instant responsiveness.
   - Head pivots smoothly towards the pointer.
   - Accelerates into a crawling stride and decelerates naturally as it approaches.
   - Maintains a graceful offset (~75px) so the cursor pointer remains clearly visible.

2. **Vertebral Distance Constraints**:
   - Each vertebra trails behind the preceding one with angular flexibility limits.
   - Dynamic axial S-wave undulation propagates through the ribcage during crawling.
   - Tail follows with smooth, natural whip lag without spiraling or coiling.

3. **Alternating Diagonal Crawling Gait**:
   - Quadruped diagonal sequence: Front-Left + Rear-Right (Group A) alternates with Front-Right + Rear-Left (Group B).
   - Analytical 2-joint Inverse Kinematics (Law of Cosines) calculates exact elbow and knee flexions.
   - Feet step forward cleanly along smooth parabolic arcs.

4. **Natural Settling & Idle State**:
   - When the cursor stops, the reptile slows down and halts near the pointer.
   - Limbs settle naturally into a balanced standing stance.
   - A subtle physiological respiratory cycle expands and contracts the ribcage in a gentle resting breath.

---

## 🎮 Controls

| Action | Description |
|---|---|
| **Mouse Move** | The reptile detects and chases the cursor, orienting and crawling towards it. |
| **Mouse Stop** | The reptile approaches and settles near the pointer in an idle pose. |
| **Key 'C'** | Toggle between hiding and showing the native system cursor. |

---

## 🚀 Getting Started

Simply open `index.html` in any modern web browser:

```bash
# Clone the repository
git clone https://github.com/manikantapalla2728/reptile-cursor.git

# Navigate to the folder
cd reptile-cursor

# Open index.html directly
start index.html # On Windows
open index.html  # On macOS
xdg-open index.html # On Linux
```

---

## 🛠️ Technical Details

- **Vanilla JavaScript**: Pure JS without frameworks or external runtime dependencies.
- **HTML5 Canvas 2D**: Direct procedural line drawing with high-DPI (`window.devicePixelRatio`) scaling.
- **Delta-Time Physics**: Smooth 60 FPS animation loop (`requestAnimationFrame`) synchronized with delta time.
- **Zero Assets**: 100% self-contained procedurally drawn skeleton.
- **Automated Video Recording**: Includes `record-video.js` script to generate 15-second HD video demos via Headless Chrome & FFmpeg.
