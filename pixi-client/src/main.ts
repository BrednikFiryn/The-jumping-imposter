import {
  Application,
  Sprite,
  Texture,
  Graphics,
  FederatedPointerEvent,
} from "pixi.js";
import { AUDIO_DATA } from "../js/AudioData";
import { IMAGE_DATA } from "../js/imageData";
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { AnimatedSprite } from "pixi.js";

gsap.registerPlugin(MotionPathPlugin);

function loadAudio(base64: string): HTMLAudioElement {
  const audio = new Audio();
  audio.src = base64.trim();
  audio.volume = 0.7;
  return audio;
}

async function loadTextureFromBase64(base64: string): Promise<Texture> {
  return new Promise((resolve) => {
    const clean = base64.replace(/\s+/g, "");
    const img = new Image();
    img.onload = () => resolve(Texture.from(img));
    img.onerror = () => resolve(Texture.EMPTY);
    img.src = clean.startsWith("data:image")
      ? clean
      : `data:image/png;base64,${clean}`;
  });
}

async function initApp() {
  const root = document.getElementById("pixi-container");
  if (!root) return;

  const app = new Application();
  await app.init({
    background: "#9BD0FF",
    resizeTo: window,
    antialias: true,
  });
  root.appendChild(app.canvas);

  function playDustEffect(x: number, y: number) {
    const dust = new AnimatedSprite(dustFrames);
    dust.anchor.set(0.5);
    dust.scale.set(0.7);
    dust.animationSpeed = 0.6;
    dust.loop = false;
    dust.position.set(x, y);
    app.stage.addChild(dust);

    dust.play();

    dust.onComplete = () => {
      app.stage.removeChild(dust);
      dust.destroy();
    };
  }

  function rollBallAndDestroy() {
    const offscreenX = -ball.width;

    gsap.to(ball, {
      x: offscreenX,
      rotation: -Math.PI * 4,
      duration: 1.2,
      ease: "power2.in",
      onUpdate: () => {
        ballShadow.x = ball.x - 20;

        const heightRatio = 1 - (ball.y - ballLanding.y) / 150;
        const scale = Math.max(1, heightRatio);

        ballShadow.scale.set(scale, scale);
      },
      onComplete: () => {
        app.stage.removeChild(ball);
        app.stage.removeChild(ballShadow);
        ballShadow.destroy();
        ball.destroy();
      },
    });
  }

  const bgMusic = loadAudio(AUDIO_DATA.bg);
  bgMusic.loop = true;
  bgMusic.play().catch(() => {
    document.body.addEventListener("click", () => {
      bgMusic.play();
    }, { once: true });
  });

  const jumpSound = loadAudio(AUDIO_DATA.jump);

  const bg = new Sprite(await loadTextureFromBase64(IMAGE_DATA.BG_seg));
  bg.width = app.screen.width;
  bg.height = app.screen.height;
  app.stage.addChild(bg);

  const wallpaper = new Graphics();
  const stripeWidth = 60;
  let toggle = false;

  for (let x = 0; x < app.screen.width; x += stripeWidth) {
    wallpaper.rect(x, 0, stripeWidth, app.screen.height * 0.68);
    wallpaper.fill(toggle ? 0x8BC6FF : 0x9BD0FF);
    toggle = !toggle;
  }
  app.stage.addChild(wallpaper);

  const shelf = new Sprite(await loadTextureFromBase64(IMAGE_DATA.shelf));
  shelf.anchor.set(0.5);
  shelf.position.set(app.screen.width * 0.2, app.screen.height * 0.5);
  app.stage.addChild(shelf);

  const ball = new Sprite(await loadTextureFromBase64(IMAGE_DATA.ball));
  ball.anchor.set(0.5);
  ball.scale.set(1);
  ball.position.set(app.screen.width * 0.5, app.screen.height * 0.8);
  app.stage.addChild(ball);

  const ballShadow = new Graphics();
  ballShadow.ellipse(0, 0, ball.width * 0.6, ball.height * 0.15);
  ballShadow.fill(0x000000, 0.15);
  ballShadow.position.set(ball.x - 20, ball.y + ball.height / 2 - 10);
  app.stage.addChildAt(ballShadow, app.stage.getChildIndex(ball));

  const chair = new Sprite(await loadTextureFromBase64(IMAGE_DATA.chair));
  chair.anchor.set(0.5);
  chair.scale.set(0.8);
  chair.position.set(app.screen.width * 0.8, app.screen.height * 0.7);
  app.stage.addChild(chair);

  const playerTextures: Texture[] = [];
  for (let i = 0; i <= 5; i++) {
    const frame = await loadTextureFromBase64(IMAGE_DATA[`imp_${i}`]);
    playerTextures.push(frame);
  }

  const allFrames: Texture[] = [];
  for (let i = 0; i <= 18; i++) {
    const frame = await loadTextureFromBase64(IMAGE_DATA[`imp_${i}`]);
    allFrames.push(frame);
  }

  const dustFrames: Texture[] = [];
  for (let i = 0; i <= 24; i++) {
    const frame = await loadTextureFromBase64(IMAGE_DATA[`dust_${i}`]);
    dustFrames.push(frame);
  }

  const jumpUpFrames = allFrames.slice(0, 9);
  const landFrames = allFrames.slice(9, 19);

  const player = new AnimatedSprite(jumpUpFrames);
  player.anchor.set(0.5);
  player.scale.set(0.7);
  player.animationSpeed = 0.5;
  player.loop = false;
  player.gotoAndStop(0);

  player.position.set(
    shelf.x + 130,
    shelf.y - shelf.height / 2 - player.height / 2 + 8,
  );
  app.stage.addChild(player);

  let isJumping = false;
  let hasJumped = false;

  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  let initialRotation = 0;
  let ballLanding = { x: 0, y: 0 };

  app.stage.on("pointerdown", (e: FederatedPointerEvent) => {
    if (isJumping) return;

    if (!hasJumped) {
      hasJumped = true;
      isJumping = true;
      initialRotation = player.rotation;
      showClickCircle(e.global.x, e.global.y);

      const ballLanding = {
        x: ball.x,
        y: ball.y - ball.height / 2 - player.height / 2 + 10,
      };

      const chairLanding = {
        x: chair.x,
        y: chair.y - chair.height / 2 - player.height / 2 + 8,
      };

      const duration1 = 0.9;
      const duration2 = 0.6;

      player.textures = jumpUpFrames;
      player.gotoAndPlay(0);
      jumpSound.currentTime = 0;
      jumpSound.play();

      setTimeout(() => {

        gsap.to(player, {
          duration: duration1,
          rotation: initialRotation + Math.PI * 2,
          ease: "power1.out",
        });

        gsap.to(player, {
          duration: duration1,
          ease: "power1.out",
          motionPath: {
            path: [
              { x: player.x, y: player.y },
              { x: ball.x / 1.2, y: player.y - 50 },
              { x: ballLanding.x, y: ballLanding.y },
            ],
            curviness: 0.1,
            autoRotate: false,

          },
          onComplete: () => {

            player.rotation = 0;
            player.textures = landFrames;
            player.gotoAndPlay(0);
            playDustEffect(player.x, player.y + player.height / 2);

            gsap.to(ball.scale, {
              x: 1.1,
              y: 0.9,
              duration: 0.1,
              ease: "power1.out",
              onComplete: () => {
                gsap.to(ball.scale, {
                  x: 1,
                  y: 1,
                  duration: 0.4,
                  ease: "power1.out",
                });
              },
            });

            setTimeout(() => {
              player.textures = jumpUpFrames;
              player.gotoAndPlay(0);
              jumpSound.currentTime = 0;
              jumpSound.play();

              gsap.to(player, {
                duration: duration2,
                rotation: Math.PI * 2,
                ease: "power1.out",
              });

              gsap.to(player, {
                duration: duration2,
                ease: "power1.inOut",
                motionPath: {
                  path: [
                    { x: player.x, y: player.y },
                    { x: (ball.x + chair.x) / 2, y: player.y - 150 },
                    { x: chairLanding.x, y: chairLanding.y },
                  ],
                  curviness: 0.1,
                  autoRotate: false,
                },
                onComplete: () => {
                  player.rotation = 0;
                  isJumping = false;

                  player.textures = landFrames;
                  player.gotoAndPlay(0);
                  playDustEffect(player.x, player.y + player.height / 2);

                  rollBallAndDestroy();
                },
              });
            }, 100);
          },
        });
      }, 200);

    } else {
      console.log("[Moloco] Second click. isMoloco:", isMoloco());
      console.log("[Moloco] Detected?", isMoloco());
      goToStore();
    }
  });

  function showClickCircle(x: number, y: number) {
    for (let i = 0; i < 2; i++) {
      const ring = new Graphics();
      ring.circle(0, 0, 20);
      ring.stroke({ width: 2, color: 0xffffff, alpha: 1 });
      ring.position.set(x, y);
      app.stage.addChild(ring);

      gsap.to(ring.scale, {
        x: 2 + i * 0.3,
        y: 2 + i * 0.3,
        duration: 0.4 + i * 0.15,
        ease: "power1.out",
      });

      gsap.to(ring, {
        alpha: 0,
        duration: 0.4 + i * 0.15,
        ease: "power1.out",
        delay: i * 0.1,
        onComplete: () => {
          ring.destroy();
        },
      });
    }
  }

  window.addEventListener("resize", () => {
    bg.width = app.screen.width;
    bg.height = app.screen.height;

    wallpaper.clear();
    let toggle = false;
    for (let x = 0; x < app.screen.width; x += stripeWidth) {
      wallpaper.rect(x, 0, stripeWidth, app.screen.height * 0.68);
      wallpaper.fill(toggle ? 0x8BC6FF : 0x9BD0FF);
      toggle = !toggle;
    }

    shelf.position.set(app.screen.width * 0.2, app.screen.height * 0.5);
    ball.position.set(app.screen.width * 0.5, app.screen.height * 0.8);
    chair.position.set(app.screen.width * 0.8, app.screen.height * 0.7);

    if (hasJumped) {
      player.position.set(
        chair.x,
        chair.y - chair.height / 2 - player.height / 2 + 8,
      );
    } else {
      player.position.set(
        shelf.x + 130,
        shelf.y - shelf.height / 2 - player.height / 2 + 8,
      );
    }
  });
}

import { isMoloco } from "../js/moloco";
import { goToStore } from "../js/goToStore";
document.addEventListener("DOMContentLoaded", initApp);
