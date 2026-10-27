const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

async function record() {
  console.log('Starting 15-second video recording of Anatomical Reptile Skeleton Cursor...');

  const outputFile = path.resolve(__dirname, 'reptile_skeleton_cursor_15s.mp4');
  
  // Set up FFmpeg process to pipe MJPEG frames to H.264 MP4
  const ffmpeg = spawn('ffmpeg', [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', '30',
    '-i', '-',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '17',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outputFile
  ]);

  ffmpeg.stderr.on('data', d => {
    // console.log('FFmpeg:', d.toString());
  });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    defaultViewport: { width: 1280, height: 720 }
  });

  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));

  // Ensure DOM and canvas are ready
  await page.waitForFunction(() => !!window.__app);

  const totalSeconds = 15.0;
  const fps = 30;
  const totalFrames = Math.round(totalSeconds * fps); // 450 frames
  const batchSize = 30; // 1 second per batch

  console.log(`Rendering ${totalFrames} frames at ${fps} fps (${totalSeconds}s total)...`);

  for (let frameOffset = 0; frameOffset < totalFrames; frameOffset += batchSize) {
    const count = Math.min(batchSize, totalFrames - frameOffset);
    
    // Evaluate a batch of frames in browser
    const frames = await page.evaluate((startFrame, frameCount, fpsVal) => {
      const c = document.getElementById('reptile-canvas');
      const results = [];

      function getMousePos(t) {
        // 15-second choreographed mouse trajectory
        // Canvas: 1280x720, Center: (640, 360)
        
        if (t <= 1.0) {
          // Phase 1: Still idle rest near center-left
          return { x: 500, y: 360 };
        } else if (t <= 1.8) {
          // Phase 2: Gentle awakening drift
          const p = (t - 1.0) / 0.8;
          const s = p * p * (3 - 2 * p);
          return {
            x: 500 + s * 60,
            y: 360 - s * 100
          };
        } else if (t <= 5.0) {
          // Phase 3: Smooth crawling arc towards top-right
          const p = (t - 1.8) / 3.2;
          const x = 560 + Math.sin(p * Math.PI * 0.85) * 380;
          const y = 260 - Math.sin(p * Math.PI) * 110 + p * 130;
          return { x, y };
        } else if (t <= 9.0) {
          // Phase 4: Active serpentine chase & figure-8 sprint
          const p = (t - 5.0) / 4.0;
          const angle = p * Math.PI * 2;
          const x = 640 + Math.sin(angle) * 340;
          const y = 380 + Math.sin(angle * 2) * 170;
          return { x, y };
        } else if (t <= 12.0) {
          // Phase 5: Fluid circular turn
          const p = (t - 9.0) / 3.0;
          const angle = Math.PI * 0.5 + p * Math.PI * 2;
          const x = 640 + Math.cos(angle) * 260;
          const y = 360 + Math.sin(angle) * 180;
          return { x, y };
        } else if (t <= 13.5) {
          // Phase 6: Smooth deceleration glide to rest position
          const p = (t - 12.0) / 1.5;
          const s = p * p * (3 - 2 * p);
          const startX = 640 + Math.cos(Math.PI * 2.5) * 260;
          const startY = 360 + Math.sin(Math.PI * 2.5) * 180;
          const targetX = 680;
          const targetY = 360;
          return {
            x: startX + (targetX - startX) * s,
            y: startY + (targetY - startY) * s
          };
        } else {
          // Phase 7: Settle and subtle idle breathing
          return { x: 680, y: 360 };
        }
      }

      for (let i = 0; i < frameCount; i++) {
        const frameIdx = startFrame + i;
        const time = frameIdx / fpsVal;
        const mouse = getMousePos(time);
        
        window.__app.step(1.0 / fpsVal, mouse.x, mouse.y);
        const dataUrl = c.toDataURL('image/jpeg', 0.94);
        results.push(dataUrl.substring(23)); // strip 'data:image/jpeg;base64,'
      }

      return results;
    }, frameOffset, count, fps);

    // Stream JPEG buffers into FFmpeg stdin
    for (const b64 of frames) {
      const buf = Buffer.from(b64, 'base64');
      ffmpeg.stdin.write(buf);
    }

    const currentSeconds = Math.min(totalSeconds, ((frameOffset + count) / fps)).toFixed(1);
    console.log(`Rendered frame ${frameOffset + count}/${totalFrames} (${currentSeconds}s / ${totalSeconds}s)`);
  }

  // Finalize FFmpeg encoding
  ffmpeg.stdin.end();

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
    ffmpeg.on('error', reject);
  });

  await browser.close();

  const stats = fs.statSync(outputFile);
  console.log(`SUCCESS! 15-second video created: ${outputFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
}

record().catch(console.error);
