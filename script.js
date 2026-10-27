/**
 * ============================================================================
 * ANATOMICAL REPTILE SKELETON CURSOR
 * 
 * Minimalist Scientific Skeletal Illustration on Pure Black Canvas (#000000)
 * Directly matching the anatomical specimen reference image:
 * - 52-Segment Vertebral Column (Cervical, Thoracic, Sacral, Caudal)
 * - 18 Pairs of Prominent Curved Bony Ribs forming Thoracic Basket
 * - Long Tapering Whiplash Tail with Herringbone Chevron Transverse Spines
 * - Articulated Reptilian Skull with Nasal Ring, Fenestrae & Orbits
 * - Four Sprawling Skeletal Limbs with 2-Joint Analytical IK & Joint Condyles
 * - 5 Radiating Skeletal Digits with Terminal Claws on each Foot
 * - Alternating Diagonal Crawling Gait & Natural Axial S-Undulation
 * - Smooth Pointer Chasing with Organic Deceleration & Offset Settling
 * - Delicate, Thin Off-White Skeletal Linework on Black Paper
 * ============================================================================
 */

(function () {
  'use strict';

  /* ==========================================================================
     MATH & VECTOR UTILITIES
     ========================================================================== */

  const MathUtils = {
    clamp(val, min, max) {
      return Math.max(min, Math.min(max, val));
    },

    lerp(a, b, t) {
      return a + (b - a) * t;
    },

    dist(x1, y1, x2, y2) {
      return Math.hypot(x2 - x1, y2 - y1);
    },

    angle(x1, y1, x2, y2) {
      return Math.atan2(y2 - y1, x2 - x1);
    },

    normalizeAngle(angle) {
      while (angle > Math.PI) angle -= Math.PI * 2;
      while (angle < -Math.PI) angle += Math.PI * 2;
      return angle;
    },

    diffAngle(target, current) {
      return this.normalizeAngle(target - current);
    },

    smoothstep(t) {
      const c = this.clamp(t, 0, 1);
      return c * c * (3 - 2 * c);
    },

    lawOfCosines(a, b, c) {
      const val = (a * a + b * b - c * c) / (2 * a * b);
      return Math.acos(this.clamp(val, -1, 1));
    }
  };

  /* ==========================================================================
     SPINE VERTEBRA NODE
     ========================================================================== */

  class SpineVertebra {
    constructor(x, y, length, maxBendAngle) {
      this.x = x;
      this.y = y;
      this.angle = 0; // Forward-facing orientation of this vertebra
      this.length = length;
      this.maxBendAngle = maxBendAngle;
    }
  }

  /* ==========================================================================
     SKELETAL QUADRUPED LIMB (2-JOINT INVERSE KINEMATICS & DIAGONAL GAIT)
     ========================================================================== */

  class SkeletalLimb {
    constructor(isLeft, isRear, spineIndex, shoulderOffset, reachDistance) {
      this.isLeft = isLeft;
      this.isRear = isRear;
      this.spineIndex = spineIndex;
      this.shoulderOffset = shoulderOffset;
      this.reachDistance = reachDistance;

      // Bone lengths (Upper: Humerus/Femur, Lower: Radius/Tibia)
      this.upperLength = isRear ? 23.0 : 21.0;
      this.lowerLength = isRear ? 25.0 : 23.0;

      // Skeletal Joint Coordinates
      this.shoulderX = 0;
      this.shoulderY = 0;
      this.elbowX = 0;
      this.elbowY = 0;
      this.footX = 0;
      this.footY = 0;
      this.footAngle = 0;

      // Stepping Animation State
      this.plantedX = 0;
      this.plantedY = 0;
      this.targetX = 0;
      this.targetY = 0;
      this.stepStartX = 0;
      this.stepStartY = 0;

      this.isStepping = false;
      this.stepProgress = 1.0;
      this.stepDuration = 0.16;
    }

    initPlacement(originX, originY, spineAngle) {
      this.shoulderX = originX;
      this.shoulderY = originY;
      const sideSign = this.isLeft ? -1 : 1;
      const spreadAngle = spineAngle + sideSign * (this.isRear ? 2.15 : 1.25);
      this.footX = this.shoulderX + Math.cos(spreadAngle) * this.reachDistance;
      this.footY = this.shoulderY + Math.sin(spreadAngle) * this.reachDistance;
      this.plantedX = this.footX;
      this.plantedY = this.footY;
      this.footAngle = spineAngle + sideSign * 0.4;
    }

    startStep(targetX, targetY, duration) {
      this.isStepping = true;
      this.stepProgress = 0;
      this.stepDuration = Math.max(0.08, duration);
      this.stepStartX = this.plantedX;
      this.stepStartY = this.plantedY;
      this.targetX = targetX;
      this.targetY = targetY;
    }

    updateStep(dt) {
      if (this.isStepping) {
        this.stepProgress += dt / this.stepDuration;
        if (this.stepProgress >= 1.0) {
          this.stepProgress = 1.0;
          this.isStepping = false;
          this.plantedX = this.targetX;
          this.plantedY = this.targetY;
        } else {
          const t = MathUtils.smoothstep(this.stepProgress);
          this.plantedX = MathUtils.lerp(this.stepStartX, this.targetX, t);
          this.plantedY = MathUtils.lerp(this.stepStartY, this.targetY, t);
        }
      }
      this.footX = this.plantedX;
      this.footY = this.plantedY;
    }

    solveIK(originX, originY, spineAngle) {
      this.shoulderX = originX;
      this.shoulderY = originY;

      const dx = this.footX - this.shoulderX;
      const dy = this.footY - this.shoulderY;
      let dist = Math.hypot(dx, dy);

      // Constraint distances to reach envelope
      const maxReach = this.upperLength + this.lowerLength - 0.5;
      if (dist > maxReach) dist = maxReach;
      const minReach = Math.abs(this.upperLength - this.lowerLength) + 1.5;
      if (dist < minReach) dist = minReach;

      const baseAngle = Math.atan2(dy, dx);
      const interiorAlpha = MathUtils.lawOfCosines(this.upperLength, dist, this.lowerLength);

      // Sprawling quadruped joint orientation:
      // Front limbs: elbow bends outwards and backwards
      // Rear limbs: knee bends outwards and forwards
      const sideSign = this.isLeft ? -1 : 1;
      let jointAngle;
      if (!this.isRear) {
        jointAngle = baseAngle - sideSign * interiorAlpha;
      } else {
        jointAngle = baseAngle + sideSign * interiorAlpha;
      }

      this.elbowX = this.shoulderX + Math.cos(jointAngle) * this.upperLength;
      this.elbowY = this.shoulderY + Math.sin(jointAngle) * this.upperLength;

      // Align foot orientation with leg reach direction
      this.footAngle = MathUtils.lerp(this.footAngle, baseAngle, 0.22);
    }
  }

  /* ==========================================================================
     ANATOMICAL REPTILE SKELETON ENGINE
     ========================================================================== */

  class AnatomicalReptile {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      // Visual Line Styling: Museum scientific illustration on black paper
      this.boneColor = 'rgba(238, 242, 246, 0.92)';
      this.fineBoneColor = 'rgba(215, 222, 230, 0.78)';
      this.accentBoneColor = '#ffffff';

      // Mouse & Tracking
      this.mouseX = window.innerWidth * 0.5;
      this.mouseY = window.innerHeight * 0.5;
      this.lastMouseX = this.mouseX;
      this.lastMouseY = this.mouseY;
      this.mouseSpeed = 0;
      this.mouseInWindow = true;

      // Head Dynamics & Locomotion
      this.headX = this.mouseX - 140;
      this.headY = this.mouseY - 90;
      this.headAngle = MathUtils.angle(this.headX, this.headY, this.mouseX, this.mouseY);
      this.headVelocity = 0;
      this.maxSpeed = 270; // px/s
      this.stopDistance = 75; // Graceful offset so mouse pointer remains clearly visible

      // Gait & Undulation
      this.gaitPhase = 0;
      this.gaitFrequency = 8.5;
      this.undulationAmp = 7.0; // Axial spine wave amplitude (px)

      // Resting Breath Simulation
      this.breathPhase = 0;
      this.breathExpansion = 0;

      // Construct Complete Skeletal Anatomy
      this.initAnatomy();
    }

    /* --------------------------------------------------------------------------
       ANATOMICAL VERTEBRAL BLUEPRINT (HEAD TO TAIL TIP)
       -------------------------------------------------------------------------- */
    initAnatomy() {
      this.spine = [];
      this.totalVertebrae = 52;

      // Vertebra Distribution:
      // Index 0: Snout tip / Cranium anterior
      // Index 1-4: Cervical vertebrae (Neck) with small lateral cervical ribs
      // Index 5: Pectoral girdle (Front limbs attachment)
      // Index 6-23: Thoracic vertebrae (18 pairs of prominent curved ribs)
      // Index 24: Pelvic girdle (Rear limbs attachment)
      // Index 25-51: Caudal vertebrae (27 tail vertebrae with chevron spines)

      const segmentLengths = [];
      const maxBendAngles = [];
      const ribLengths = [];
      const cervicalRibs = [];

      for (let i = 0; i < this.totalVertebrae; i++) {
        if (i === 0) {
          // Cranium
          segmentLengths.push(16.0);
          maxBendAngles.push(0.35);
          ribLengths.push(0);
          cervicalRibs.push(0);
        } else if (i <= 4) {
          // Cervical neck
          segmentLengths.push(9.0);
          maxBendAngles.push(0.26);
          ribLengths.push(0);
          cervicalRibs.push(4.5 + i * 1.5);
        } else if (i === 5) {
          // Pectoral girdle
          segmentLengths.push(9.2);
          maxBendAngles.push(0.20);
          ribLengths.push(11);
          cervicalRibs.push(0);
        } else if (i <= 23) {
          // Thoracic ribcage (18 pairs of curved ribs, slender stomach)
          segmentLengths.push(9.2);
          maxBendAngles.push(0.18); // Stiff, stable ribcage
          cervicalRibs.push(0);

          // Slender stomach profile: gently expands up to 21px (total diameter ~42px)
          const torsoNorm = (i - 5) / 18; // 0 to 1
          const profile = Math.sin(torsoNorm * Math.PI);
          const ribLen = 10.5 + profile * 10.5; // 10.5px up to 21px
          ribLengths.push(ribLen);
        } else if (i === 24) {
          // Pelvic girdle
          segmentLengths.push(9.0);
          maxBendAngles.push(0.20);
          ribLengths.push(10);
          cervicalRibs.push(0);
        } else {
          // Caudal tail: tapers from 9.0px down to 4.5px
          const tailNorm = (i - 25) / 26; // 0 to 1
          const segLen = MathUtils.lerp(9.0, 4.5, tailNorm);
          segmentLengths.push(segLen);
          maxBendAngles.push(0.28); // Natural supple whip curvature
          ribLengths.push(0);
          cervicalRibs.push(0);
        }
      }

      this.ribLengths = ribLengths;
      this.cervicalRibs = cervicalRibs;

      // Chevron spine lengths along tail (vertebrae 25 to 51)
      this.chevronLengths = [];
      for (let i = 0; i < this.totalVertebrae; i++) {
        if (i >= 25) {
          const tailNorm = (i - 25) / 26;
          const len = (1 - tailNorm * 0.90) * 14.5; // 14.5px down to 1.5px
          this.chevronLengths.push(len);
        } else {
          this.chevronLengths.push(0);
        }
      }

      // Initialize spine trailing backwards behind the head
      let curX = this.headX;
      let curY = this.headY;
      const backwardAngle = this.headAngle + Math.PI;

      for (let i = 0; i < this.totalVertebrae; i++) {
        const segLen = segmentLengths[i];
        const maxBend = maxBendAngles[i];
        const node = new SpineVertebra(curX, curY, segLen, maxBend);
        node.angle = this.headAngle;
        this.spine.push(node);
        curX += Math.cos(backwardAngle) * segLen;
        curY += Math.sin(backwardAngle) * segLen;
      }

      // Four Skeletal Limbs (Pectoral & Pelvic Girdles)
      const pectoralIndex = 5;
      const pelvicIndex = 24;
      const shoulderSpread = 13.5;
      const pelvicSpread = 12.0;
      const reachFront = 32.0;
      const reachRear = 35.0;

      this.limbs = [
        new SkeletalLimb(true, false, pectoralIndex, shoulderSpread, reachFront),   // Front-Left
        new SkeletalLimb(false, false, pectoralIndex, shoulderSpread, reachFront),  // Front-Right
        new SkeletalLimb(true, true, pelvicIndex, pelvicSpread, reachRear),        // Rear-Left
        new SkeletalLimb(false, true, pelvicIndex, pelvicSpread, reachRear)         // Rear-Right
      ];

      for (let i = 0; i < this.limbs.length; i++) {
        const limb = this.limbs[i];
        const seg = this.spine[limb.spineIndex];
        limb.initPlacement(seg.x, seg.y, this.headAngle);
      }
    }

    /* --------------------------------------------------------------------------
       PHYSICS & ANIMATION UPDATE LOOP
       -------------------------------------------------------------------------- */
    update(dt) {
      // 1. Mouse Velocity Tracking
      const mouseDx = this.mouseX - this.lastMouseX;
      const mouseDy = this.mouseY - this.lastMouseY;
      const instantMouseSpeed = Math.hypot(mouseDx, mouseDy) / Math.max(0.001, dt);
      this.mouseSpeed = MathUtils.lerp(this.mouseSpeed, instantMouseSpeed, 0.25);
      this.lastMouseX = this.mouseX;
      this.lastMouseY = this.mouseY;

      // 2. Chasing & Steering towards Mouse Pointer
      const distToMouse = MathUtils.dist(this.headX, this.headY, this.mouseX, this.mouseY);
      const angleToMouse = MathUtils.angle(this.headX, this.headY, this.mouseX, this.mouseY);

      let desiredSpeed = 0;

      // Maintain offset distance so mouse pointer remains clearly visible
      if (distToMouse > this.stopDistance) {
        const excessDist = distToMouse - this.stopDistance;
        const speedFactor = MathUtils.clamp(excessDist / 120, 0, 1);
        desiredSpeed = this.maxSpeed * speedFactor;

        // Sprint when mouse moves swiftly or is far
        if (distToMouse > 240 || this.mouseSpeed > 450) {
          desiredSpeed = Math.min(370, this.maxSpeed * 1.45);
        }
      } else {
        // Arrived at resting offset
        desiredSpeed = 0;
      }

      // Smooth acceleration and deceleration
      this.headVelocity = MathUtils.lerp(this.headVelocity, desiredSpeed, Math.min(1.0, 9.5 * dt));
      if (this.headVelocity < 1.0 && desiredSpeed === 0) {
        this.headVelocity = 0;
      }

      // Head turning kinematics
      let targetHeading = angleToMouse;

      // Subtle exploratory micro-sway when resting
      if (this.headVelocity === 0) {
        const idleSway = Math.sin(this.breathPhase * 0.75) * 0.05;
        targetHeading += idleSway;
      }

      const angleDifference = MathUtils.diffAngle(targetHeading, this.headAngle);
      const turnRate = 4.5 + (this.headVelocity / this.maxSpeed) * 6.5;
      this.headAngle += angleDifference * Math.min(1.0, turnRate * dt);

      // Advance head along current facing angle
      const forwardStep = this.headVelocity * dt;
      this.headX += Math.cos(this.headAngle) * forwardStep;
      this.headY += Math.sin(this.headAngle) * forwardStep;

      // Assign to root node (Cranium)
      this.spine[0].x = this.headX;
      this.spine[0].y = this.headY;
      this.spine[0].angle = this.headAngle;

      // 3. Dynamic Axial Undulation (Crawling S-Wave)
      const isMoving = this.headVelocity > 4.0;
      if (isMoving) {
        const speedNorm = this.headVelocity / 170;
        this.gaitPhase += dt * this.gaitFrequency * speedNorm;
      }

      // 4. Subtle Breathing Cycle (Ribcage expansion)
      this.breathPhase += dt * (isMoving ? 4.0 : 1.9);
      this.breathExpansion = Math.sin(this.breathPhase) * (isMoving ? 0.6 : 1.8);

      // 5. Vertebral Constraint Solver (Distance Kinematics)
      // Each vertebra follows behind the previous one naturally
      for (let i = 1; i < this.spine.length; i++) {
        const prev = this.spine[i - 1];
        const curr = this.spine[i];

        // Vector from prev to curr
        let dx = curr.x - prev.x;
        let dy = curr.y - prev.y;
        let backwardAngle = Math.atan2(dy, dx);

        // Constrain bend angle relative to previous vertebra's backward direction
        const idealBackward = prev.angle + Math.PI;
        let diff = MathUtils.diffAngle(backwardAngle, idealBackward);

        // Add gentle undulation in torso region
        if (isMoving && i >= 5 && i <= 24) {
          const waveProgress = (i - 5) / 19;
          const wave = Math.sin(this.gaitPhase - waveProgress * Math.PI * 2.8) * 0.08 * (this.headVelocity / this.maxSpeed);
          diff += wave;
        }

        diff = MathUtils.clamp(diff, -curr.maxBendAngle, curr.maxBendAngle);
        backwardAngle = idealBackward + diff;

        // Position current vertebra at exact segment distance
        curr.x = prev.x + Math.cos(backwardAngle) * curr.length;
        curr.y = prev.y + Math.sin(backwardAngle) * curr.length;

        // Forward-facing orientation
        curr.angle = MathUtils.normalizeAngle(backwardAngle - Math.PI);
      }

      // 6. Quadruped Gait & Limb Stepping Update
      this.updateLimbs(dt);
    }

    /* --------------------------------------------------------------------------
       ALTERNATING QUADRUPED CRAWLING GAIT
       -------------------------------------------------------------------------- */
    updateLimbs(dt) {
      // Diagonal sequence gait pairs:
      // Group A: Front-Left (0) and Rear-Right (3)
      // Group B: Front-Right (1) and Rear-Left (2)
      const groupAStepping = this.limbs[0].isStepping || this.limbs[3].isStepping;
      const groupBStepping = this.limbs[1].isStepping || this.limbs[2].isStepping;

      const strideDistance = 25.0;
      const stepDuration = MathUtils.clamp(0.18 / Math.max(0.4, this.headVelocity / 160), 0.09, 0.22);

      for (let i = 0; i < this.limbs.length; i++) {
        const limb = this.limbs[i];
        const seg = this.spine[limb.spineIndex];

        // Shoulder / Hip attachment point on spine
        const sideSign = limb.isLeft ? -1 : 1;
        const normalAngle = seg.angle + sideSign * (Math.PI * 0.5);
        const shoulderX = seg.x + Math.cos(normalAngle) * limb.shoulderOffset;
        const shoulderY = seg.y + Math.sin(normalAngle) * limb.shoulderOffset;

        // Compute ideal forward-biased foot ground target
        // Front limbs place feet laterally-forward; Rear limbs laterally-backward
        const restSpreadAngle = seg.angle + sideSign * (limb.isRear ? 2.15 : 1.25);
        const forwardBias = (this.headVelocity / this.maxSpeed) * (limb.isRear ? 16 : 20);

        const idealTargetX = shoulderX + Math.cos(restSpreadAngle) * limb.reachDistance + Math.cos(seg.angle) * forwardBias;
        const idealTargetY = shoulderY + Math.sin(restSpreadAngle) * limb.reachDistance + Math.sin(seg.angle) * forwardBias;

        const distToIdeal = MathUtils.dist(limb.plantedX, limb.plantedY, idealTargetX, idealTargetY);

        // Check if limb should initiate step:
        const isGroupA = (i === 0 || i === 3);
        const canStep = isGroupA ? !groupBStepping : !groupAStepping;

        if (!limb.isStepping && canStep) {
          if (this.headVelocity > 5 && distToIdeal > strideDistance) {
            limb.startStep(idealTargetX, idealTargetY, stepDuration);
          } else if (this.headVelocity < 10 && distToIdeal > 16.0) {
            // Settle feet cleanly when halting near pointer
            limb.startStep(idealTargetX, idealTargetY, 0.16);
          }
        }

        limb.updateStep(dt);
        limb.solveIK(shoulderX, shoulderY, seg.angle);
      }
    }

    /* ==========================================================================
       PROCEDURAL SKELETAL RENDERING PIPELINE
       ========================================================================== */
    draw() {
      const ctx = this.ctx;
      ctx.save();

      // 1. Render Tail Chevron Spines (Herringbone caudal vertebrae)
      this.drawTailChevrons(ctx);

      // 2. Render Curved Ribcage Basket (Thoracic vertebrae) & Cervical Ribs
      this.drawRibs(ctx);

      // 3. Render Pectoral and Pelvic Skeletal Girdles
      this.drawGirdles(ctx);

      // 4. Render Articulated Vertebral Column & Centra Discs
      this.drawSpine(ctx);

      // 5. Render Four Articulated Skeletal Limbs & Claws
      this.drawLimbs(ctx);

      // 6. Render Skeletal Skull, Fenestrae & Nasal Ring
      this.drawSkull(ctx);

      // 7. Render Mouse Pointer Arrow (Offset in front)
      if (this.mouseInWindow) {
        this.drawMousePointer(ctx);
      }

      ctx.restore();
    }

    /* --------------------------------------------------------------------------
       CURVED THORACIC RIBS & CERVICAL PROCESSES
       -------------------------------------------------------------------------- */
    drawRibs(ctx) {
      ctx.save();
      ctx.strokeStyle = this.boneColor;
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';

      // 1. Delicate Cervical Ribs (Vertebrae 1 to 4)
      for (let i = 1; i <= 4; i++) {
        const seg = this.spine[i];
        const cLen = this.cervicalRibs[i];
        if (cLen <= 0) continue;

        const backAngle = seg.angle + Math.PI;
        for (let side = -1; side <= 1; side += 2) {
          const ribAng = backAngle + side * 0.82;
          ctx.beginPath();
          ctx.moveTo(seg.x, seg.y);
          ctx.lineTo(seg.x + Math.cos(ribAng) * cLen, seg.y + Math.sin(ribAng) * cLen);
          ctx.stroke();
        }
      }

      // 2. Thoracic Ribs (Vertebrae 5 through 23)
      for (let i = 5; i <= 23; i++) {
        const seg = this.spine[i];
        let ribLen = this.ribLengths[i];
        if (ribLen <= 0) continue;

        // Apply subtle physiological breathing expansion
        ribLen += this.breathExpansion * 0.55;

        const spineAngle = seg.angle;
        const normAngle = spineAngle + Math.PI * 0.5;
        const backAngle = spineAngle + Math.PI;

        const normX = Math.cos(normAngle);
        const normY = Math.sin(normAngle);
        const backX = Math.cos(backAngle);
        const backY = Math.sin(backAngle);

        // Draw Left and Right Symmetrical Curved Ribs
        for (let side = -1; side <= 1; side += 2) {
          const sideNormX = normX * side;
          const sideNormY = normY * side;

          // Parabolic crescent curve: arches outward and sweeps backward towards tail
          const tipX = seg.x + sideNormX * (ribLen * 0.94) + backX * (ribLen * 0.65);
          const tipY = seg.y + sideNormY * (ribLen * 0.94) + backY * (ribLen * 0.65);

          const ctrlX = seg.x + sideNormX * (ribLen * 1.10) + backX * (ribLen * 0.15);
          const ctrlY = seg.y + sideNormY * (ribLen * 1.10) + backY * (ribLen * 0.15);

          ctx.beginPath();
          ctx.moveTo(seg.x, seg.y);
          ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    /* --------------------------------------------------------------------------
       TAIL CHEVRON SPINES (HERRINGBONE TRANSVERSE PROCESSES)
       -------------------------------------------------------------------------- */
    drawTailChevrons(ctx) {
      ctx.save();
      ctx.strokeStyle = this.fineBoneColor;
      ctx.lineWidth = 1.1;
      ctx.lineCap = 'round';

      // Caudal vertebrae (indices 25 through 51)
      for (let i = 25; i < this.spine.length; i++) {
        const seg = this.spine[i];
        const len = this.chevronLengths[i];
        if (len <= 0) continue;

        const backAngle = seg.angle + Math.PI;
        // Chevron spines angle backward symmetrically at ~40 degrees relative to backbone
        const branchSpread = 0.70; // radians
        const angleLeft = backAngle - branchSpread;
        const angleRight = backAngle + branchSpread;

        const leftTipX = seg.x + Math.cos(angleLeft) * len;
        const leftTipY = seg.y + Math.sin(angleLeft) * len;

        const rightTipX = seg.x + Math.cos(angleRight) * len;
        const rightTipY = seg.y + Math.sin(angleRight) * len;

        // Draw left process
        ctx.beginPath();
        ctx.moveTo(seg.x, seg.y);
        ctx.lineTo(leftTipX, leftTipY);
        ctx.stroke();

        // Draw right process
        ctx.beginPath();
        ctx.moveTo(seg.x, seg.y);
        ctx.lineTo(rightTipX, rightTipY);
        ctx.stroke();
      }

      ctx.restore();
    }

    /* --------------------------------------------------------------------------
       PECTORAL & PELVIC SKELETAL GIRDLES
       -------------------------------------------------------------------------- */
    drawGirdles(ctx) {
      ctx.save();
      ctx.strokeStyle = this.boneColor;
      ctx.lineWidth = 1.35;
      ctx.lineCap = 'round';

      // 1. Pectoral Girdle (Vertebra 5)
      const pecSeg = this.spine[5];
      const pecNorm = pecSeg.angle + Math.PI * 0.5;
      const pecSpread = 13.5;
      const pecL_X = pecSeg.x + Math.cos(pecNorm) * -pecSpread;
      const pecL_Y = pecSeg.y + Math.sin(pecNorm) * -pecSpread;
      const pecR_X = pecSeg.x + Math.cos(pecNorm) * pecSpread;
      const pecR_Y = pecSeg.y + Math.sin(pecNorm) * pecSpread;

      ctx.beginPath();
      ctx.moveTo(pecL_X, pecL_Y);
      ctx.lineTo(pecSeg.x, pecSeg.y);
      ctx.lineTo(pecR_X, pecR_Y);
      ctx.stroke();

      // Scapular joint rings
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(pecL_X, pecL_Y, 1.5, 0, Math.PI * 2);
      ctx.arc(pecR_X, pecR_Y, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 2. Pelvic Girdle (Vertebra 24)
      const pelSeg = this.spine[24];
      const pelNorm = pelSeg.angle + Math.PI * 0.5;
      const pelSpread = 12.0;
      const pelL_X = pelSeg.x + Math.cos(pelNorm) * -pelSpread;
      const pelL_Y = pelSeg.y + Math.sin(pelNorm) * -pelSpread;
      const pelR_X = pelSeg.x + Math.cos(pelNorm) * pelSpread;
      const pelR_Y = pelSeg.y + Math.sin(pelNorm) * pelSpread;

      ctx.beginPath();
      ctx.moveTo(pelL_X, pelL_Y);
      ctx.lineTo(pelSeg.x, pelSeg.y);
      ctx.lineTo(pelR_X, pelR_Y);
      ctx.stroke();

      // Ilium joint rings
      ctx.beginPath();
      ctx.arc(pelL_X, pelL_Y, 1.6, 0, Math.PI * 2);
      ctx.arc(pelR_X, pelR_Y, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    /* --------------------------------------------------------------------------
       CENTRAL SPINAL COLUMN & VERTEBRAL CENTRA DISCS
       -------------------------------------------------------------------------- */
    drawSpine(ctx) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Continuous Central Spinal Cord Line
      ctx.strokeStyle = this.accentBoneColor;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(this.spine[0].x, this.spine[0].y);

      for (let i = 1; i < this.spine.length; i++) {
        const prev = this.spine[i - 1];
        const curr = this.spine[i];
        const midX = (prev.x + curr.x) * 0.5;
        const midY = (prev.y + curr.y) * 0.5;
        ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
      }
      const last = this.spine[this.spine.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();

      // 2. Transverse Vertebra Centra Crossbars
      ctx.strokeStyle = this.boneColor;
      ctx.lineWidth = 1.15;

      for (let i = 1; i < this.spine.length; i++) {
        const seg = this.spine[i];
        const normAngle = seg.angle + Math.PI * 0.5;
        const discRadius = i <= 24 ? 2.8 : Math.max(1.1, 2.8 * (1 - (i - 24) / 27));

        const p1X = seg.x + Math.cos(normAngle) * -discRadius;
        const p1Y = seg.y + Math.sin(normAngle) * -discRadius;
        const p2X = seg.x + Math.cos(normAngle) * discRadius;
        const p2Y = seg.y + Math.sin(normAngle) * discRadius;

        ctx.beginPath();
        ctx.moveTo(p1X, p1Y);
        ctx.lineTo(p2X, p2Y);
        ctx.stroke();
      }

      ctx.restore();
    }

    /* --------------------------------------------------------------------------
       FOUR ARTICULATED SKELETAL LIMBS & RADIATING DIGITS
       -------------------------------------------------------------------------- */
    drawLimbs(ctx) {
      ctx.save();
      ctx.strokeStyle = this.boneColor;
      ctx.fillStyle = '#000000';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 0; i < this.limbs.length; i++) {
        const limb = this.limbs[i];

        // 1. Upper Bone (Humerus / Femur)
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(limb.shoulderX, limb.shoulderY);
        ctx.lineTo(limb.elbowX, limb.elbowY);
        ctx.stroke();

        // 2. Lower Bone (Radius / Tibia)
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(limb.elbowX, limb.elbowY);
        ctx.lineTo(limb.footX, limb.footY);
        ctx.stroke();

        // 3. Articulated Joint Condyle Rings
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(limb.elbowX, limb.elbowY, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(limb.footX, limb.footY, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 4. Five Radiating Skeletal Toe Bones (Manus / Pes)
        this.drawSkeletalFoot(ctx, limb);
      }

      ctx.restore();
    }

    drawSkeletalFoot(ctx, limb) {
      ctx.save();
      ctx.translate(limb.footX, limb.footY);
      ctx.rotate(limb.footAngle);

      ctx.strokeStyle = this.boneColor;
      ctx.lineWidth = 1.1;

      // 5 Radiating Skeletal Digits
      const digitLengths = [9.0, 13.5, 17.5, 15.0, 10.5];
      const digitAngles = [-0.85, -0.42, 0.0, 0.42, 0.85];

      for (let t = 0; t < 5; t++) {
        const len = digitLengths[t];
        const ang = digitAngles[t];
        const toeTipX = Math.cos(ang) * len;
        const toeTipY = Math.sin(ang) * len;

        // Digit bone line
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(toeTipX, toeTipY);
        ctx.stroke();

        // Tiny sharp curved terminal claw hook
        const clawAngle = ang + (limb.isLeft ? 0.38 : -0.38);
        const clawTipX = toeTipX + Math.cos(clawAngle) * 2.8;
        const clawTipY = toeTipY + Math.sin(clawAngle) * 2.8;

        ctx.beginPath();
        ctx.moveTo(toeTipX, toeTipY);
        ctx.lineTo(clawTipX, clawTipY);
        ctx.stroke();
      }

      ctx.restore();
    }

    /* --------------------------------------------------------------------------
       ANATOMICAL SKELETAL REPTILE SKULL
       -------------------------------------------------------------------------- */
    drawSkull(ctx) {
      const head = this.spine[0];

      ctx.save();
      ctx.translate(head.x, head.y);
      ctx.rotate(head.angle);

      ctx.strokeStyle = this.accentBoneColor;
      ctx.fillStyle = '#000000';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Terminal Snout Ring (Rostral cartilage / nose ring as in reference image)
      const snoutTipX = 18.0;
      ctx.beginPath();
      ctx.arc(snoutTipX, 0, 2.8, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Cranial Rostral & Mandibular Outer Contours
      ctx.beginPath();
      ctx.moveTo(snoutTipX - 2.8, 0);
      ctx.lineTo(10.0, 3.2);
      ctx.bezierCurveTo(4.5, 7.5, 0.0, 9.5, -8.0, 8.0); // Left temporal squamosal arch
      ctx.lineTo(-13.0, 2.5); // Occipital condyle
      ctx.lineTo(-13.0, -2.5);
      ctx.lineTo(-8.0, -8.0); // Right temporal arch
      ctx.bezierCurveTo(0.0, -9.5, 4.5, -7.5, 10.0, -3.2);
      ctx.lineTo(snoutTipX - 2.8, 0);
      ctx.stroke();

      // 3. Central Sagittal Suture / Braincase Ridge
      ctx.strokeStyle = this.fineBoneColor;
      ctx.lineWidth = 1.05;
      ctx.beginPath();
      ctx.moveTo(snoutTipX - 2.8, 0);
      ctx.lineTo(-11.0, 0);
      ctx.stroke();

      // 4. Two Delicate Skeletal Eye Orbits (Fenestrae)
      const orbitX = 2.5;
      const orbitY = 5.0;
      const orbitRadiusX = 4.0;
      const orbitRadiusY = 2.4;

      // Left Eye Orbit
      ctx.beginPath();
      ctx.ellipse(orbitX, orbitY, orbitRadiusX, orbitRadiusY, 0.2, 0, Math.PI * 2);
      ctx.stroke();

      // Right Eye Orbit
      ctx.beginPath();
      ctx.ellipse(orbitX, -orbitY, orbitRadiusX, orbitRadiusY, -0.2, 0, Math.PI * 2);
      ctx.stroke();

      // 5. Delicate Lateral Jaw Suture Marks
      ctx.beginPath();
      ctx.moveTo(-3.0, 6.0);
      ctx.lineTo(-7.5, 4.2);
      ctx.moveTo(-3.0, -6.0);
      ctx.lineTo(-7.5, -4.2);
      ctx.stroke();

      ctx.restore();
    }

    /* --------------------------------------------------------------------------
       CLASSIC MOUSE POINTER ARROW (SHOWN AT CURSOR POSITION)
       -------------------------------------------------------------------------- */
    drawMousePointer(ctx) {
      ctx.save();
      ctx.translate(this.mouseX, this.mouseY);

      // Classic mouse cursor arrow polygon matching reference image
      const points = [
        [0, 0],
        [0, 21],
        [5.2, 16.4],
        [10.0, 25.8],
        [13.5, 24.2],
        [8.8, 14.8],
        [15.5, 14.8]
      ];

      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.closePath();

      // Pure white fill with crisp black outline matching reference
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.7;
      ctx.lineJoin = 'miter';
      ctx.stroke();

      ctx.restore();
    }
  }

  /* ==========================================================================
     APPLICATION CONTROLLER
     ========================================================================== */

  class App {
    constructor() {
      this.canvas = document.getElementById('reptile-canvas');
      this.reptile = new AnatomicalReptile(this.canvas);

      this.lastTime = performance.now();
      this.initCanvasSize();
      this.initEvents();

      // Start animation loop
      requestAnimationFrame(this.loop.bind(this));
    }

    initCanvasSize() {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;

      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;

      const ctx = this.canvas.getContext('2d');
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    }

    initEvents() {
      window.addEventListener('resize', () => {
        this.initCanvasSize();
      });

      window.addEventListener('pointermove', (e) => {
        this.reptile.mouseX = e.clientX;
        this.reptile.mouseY = e.clientY;
        this.reptile.mouseInWindow = true;
      });

      window.addEventListener('pointerenter', () => {
        this.reptile.mouseInWindow = true;
      });

      window.addEventListener('pointerleave', () => {
        // Keeps state
      });

      // Keyboard shortcut 'C' to toggle system cursor
      window.addEventListener('keydown', (e) => {
        if (e.key === 'c' || e.key === 'C') {
          document.body.classList.toggle('cursor-hidden');
        }
      });
    }

    step(dt, mouseX, mouseY) {
      this.reptile.mouseX = mouseX;
      this.reptile.mouseY = mouseY;
      this.reptile.mouseInWindow = true;
      this.reptile.update(dt);
      const ctx = this.reptile.ctx;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      this.reptile.draw();
    }

    loop(currentTime) {
      const dt = Math.min(0.08, (currentTime - this.lastTime) * 0.001);
      this.lastTime = currentTime;

      // Update simulation physics
      this.reptile.update(dt);

      // Render on pure black backdrop (#000000)
      const ctx = this.reptile.ctx;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      this.reptile.draw();

      requestAnimationFrame(this.loop.bind(this));
    }
  }

  // Launch when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.__app = new App(); });
  } else {
    window.__app = new App();
  }
})();
