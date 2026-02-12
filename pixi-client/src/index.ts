import {
  Application,
  Sprite,
  Texture,
  Graphics,
} from "pixi.js";
import { AUDIO_DATA } from "./js/AudioData";
import { IMAGE_DATA } from "./js/imageData";
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { AnimatedSprite } from "pixi.js";
import { Container } from "pixi.js";

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

  const bg = new Sprite(await loadTextureFromBase64(IMAGE_DATA.BG_seg));
  bg.width = app.screen.width;
  bg.height = app.screen.height;
  app.stage.addChild(bg);

  const wallpaper = new Graphics();
  const stripeWidth = 60;
  let toggle = false;

  for (let x = 0; x < app.screen.width; x += stripeWidth) {
    wallpaper.rect(x, 0, stripeWidth, app.screen.height * 0.68);
    wallpaper.fill(toggle ? 0x8bc6ff : 0x9bd0ff);
    toggle = !toggle;
  }
  app.stage.addChild(wallpaper);

  const world = new Container();
  app.stage.addChild(world);

  resizeBackground();

  root.appendChild(app.canvas);

  function jumpTo(targetX: number, targetY: number, duration: number, onComplete?: () => void) {

    const landing = {
      x: targetX,
      y: targetY - player.height / 2
    };

    player.textures = jumpUpFrames;
    player.gotoAndPlay(0);
    jumpSound.currentTime = 0;
    jumpSound.play();

    gsap.to(player, {
      duration,
      rotation: Math.PI * 2,
      ease: "power1.out",
    });

    gsap.to(player, {
      duration,
      ease: "power1.inOut",
      motionPath: {
        path: [
          { x: player.x, y: player.y },
          { x: (player.x + targetX) / 2, y: player.y - 150 },
          { x: landing.x, y: landing.y },
        ],
        curviness: 0.2,
      },
      onComplete: () => {
        player.rotation = 0;
        player.textures = landFrames;
        player.gotoAndPlay(0);
        playDustEffect(player.x, player.y + player.height / 2);

        if (onComplete) onComplete();
      },
    });
  }

  function resizeBackground() {
    bg.width = app.screen.width;
    bg.height = app.screen.height;

    wallpaper.clear();
    let toggle = false;
    for (let x = 0; x < app.screen.width; x += stripeWidth) {
      wallpaper.rect(x, 0, stripeWidth, app.screen.height * 0.68);
      wallpaper.fill(toggle ? 0x8bc6ff : 0x9bd0ff);
      toggle = !toggle;
    }
  }

  function rideSkate() {

    const rideDistance = app.screen.width * 0.4;
    const rideDuration = 1.2;

    gsap.to(world, {
      x: world.x - rideDistance,
      duration: rideDuration,
      ease: "power2.out"
    });

    gsap.to([skate, player], {
      x: `+=${rideDistance}`,
      duration: rideDuration,
      ease: "power2.out"
    });
  }

  function scrollRight(amount: number, duration: number) {
    gsap.to(world, {
      x: -amount,
      duration,
      ease: "power1.inOut"
    });
  }

  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  function playDustEffect(x: number, y: number) {
    const dust = new AnimatedSprite(dustFrames);
    dust.anchor.set(0.5);
    dust.scale.set(0.7);
    dust.animationSpeed = 0.6;
    dust.loop = false;
    dust.position.set(x, y);
    world.addChild(dust);

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
    document.body.addEventListener(
      "click",
      () => {
        bgMusic.play();
      },
      { once: true },
    );
  });

  const jumpSound = loadAudio(AUDIO_DATA.jump);

  const shelf = new Sprite(await loadTextureFromBase64(IMAGE_DATA.shelf));
  shelf.anchor.set(0.5);
  shelf.position.set(app.screen.width * 0.2, app.screen.height * 0.5);
  world.addChild(shelf);

  const ball = new Sprite(await loadTextureFromBase64(IMAGE_DATA.ball));
  ball.anchor.set(0.5);
  ball.scale.set(1);
  ball.position.set(app.screen.width * 0.4, app.screen.height * 0.8);
  world.addChild(ball);

  const ballShadow = new Graphics();
  ballShadow.ellipse(0, 0, ball.width * 0.6, ball.height * 0.15);
  ballShadow.fill(0x000000, 0.15);
  ballShadow.position.set(ball.x - 20, ball.y + ball.height / 2 - 10);
  world.addChildAt(ballShadow, world.getChildIndex(ball));

  const chair = new Sprite(await loadTextureFromBase64(IMAGE_DATA.chair));
  chair.anchor.set(0.5);
  chair.scale.set(0.8);
  chair.position.set(app.screen.width * 0.6, app.screen.height * 0.7);
  world.addChild(chair);

  const decor1 = new Sprite(await loadTextureFromBase64(IMAGE_DATA.decor1));
  decor1.anchor.set(0.5);
  decor1.scale.set(0.8);
  decor1.position.set(app.screen.width * 0.8, app.screen.height * 0.75);
  world.addChild(decor1);

  const start = new Sprite(await loadTextureFromBase64(IMAGE_DATA.start));
  start.anchor.set(0.5);
  start.scale.set(0.8);
  start.position.set(app.screen.width * 1, app.screen.height * 0.45);
  world.addChild(start);

  const skate = new Sprite(await loadTextureFromBase64(IMAGE_DATA.skate));
  skate.anchor.set(0.5);
  skate.scale.set(0.8);
  skate.position.set(app.screen.width * 1.2, app.screen.height * 0.78);
  world.addChild(skate);

  const shelf2 = new Sprite(await loadTextureFromBase64(IMAGE_DATA.shelf));
  shelf2.anchor.set(0.5);
  shelf2.scale.set(0.8);
  shelf2.position.set(app.screen.width * 1.8, app.screen.height * 0.5);
  world.addChild(shelf2);

  const duck = new Sprite(await loadTextureFromBase64(IMAGE_DATA.duck));
  duck.anchor.set(0.5);
  duck.scale.set(0.8);
  duck.position.set(app.screen.width * 1.8, app.screen.height * 0.425);
  world.addChild(duck);

  const clock = new Sprite(await loadTextureFromBase64(IMAGE_DATA.clock));
  clock.anchor.set(0.5);
  clock.scale.set(0.8);
  clock.position.set(app.screen.width * 2, app.screen.height * 0.6);
  world.addChild(clock);

  const arr = new Sprite(await loadTextureFromBase64(IMAGE_DATA.arr));
  arr.anchor.set(0.5);
  arr.scale.set(0.8);
  arr.position.set(app.screen.width * 2, app.screen.height * 0.2);
  world.addChild(arr);


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
    shelf.y - shelf.height / 2 - player.height / 2 + 10,
  );
  world.addChild(player);

  let isJumping = false;
  let clickCount = 0;

  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  const ballLanding = { x: 0, y: 0 };

  app.stage.on("pointerdown", () => {
    if (isJumping) return;

    if (clickCount === 0) {
      clickCount = 1;
      isJumping = true;

      showClickCircle(
        player.x,
        player.y + player.height / 2
      );

      player.textures = jumpUpFrames;
      player.gotoAndPlay(0);
      jumpSound.currentTime = 0;
      jumpSound.play();

      setTimeout(() => {

        jumpTo(ball.x, ball.y - ball.height / 2 + 15, 0.9, () => {

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
              });
            },
          });

          setTimeout(() => {

            jumpTo(chair.x, chair.y - chair.height / 2 + 10, 0.6, () => {
              isJumping = false;
              rollBallAndDestroy();
            });

          }, 150);

        });

      }, 200);
    }

    else if (clickCount === 1) {
      clickCount = 2;
      isJumping = true;

      showClickCircle(
        player.x,
        player.y + player.height / 2
      );

      jumpSound.currentTime = 0;
      jumpSound.play();

      scrollRight(app.screen.width * 0.5, 0.8);

      jumpTo(decor1.x + 12, decor1.y - decor1.height / 2 + 12, 0.7, () => {

        gsap.to(decor1.scale, {
          x: 0.9,
          y: 0.9,
          duration: 0.08,
          ease: "power1.out",
          onComplete: () => {
            gsap.to(decor1.scale, {
              x: 0.8,
              y: 0.8,
              duration: 0.5,
              ease: "elastic.out(1, 0.4)"
            });
          }
        });

        jumpTo(start.x, start.y - start.height / 100 + 5, 0.7, () => {
          isJumping = false;
        });
      });
    }

    else if (clickCount === 2) {
      clickCount = 3;
      isJumping = true;

      showClickCircle(
        player.x,
        player.y + player.height / 2
      );

      jumpSound.currentTime = 0;
      jumpSound.play();

      jumpTo(
        skate.x,
        skate.y - skate.height / 2 - player.height / 9 + 30,
        0.6,
        () => {

          isJumping = false;

          rideSkate();

        }
      );
    }

    else if (clickCount === 3) {
      clickCount = 4;
      isJumping = true;

      jumpTo(
        duck.x,
        duck.y - duck.height / 2 + 10,
        0.6,
        () => {

          jumpTo(
            clock.x,
            clock.y - clock.height / 2 + 10,
            0.6,
            () => {
              isJumping = false;
            }
          );

        }
      );
    }

    else if (clickCount === 4) {
      console.log("[Moloco] Second click. isMoloco:", isMoloco());
      console.log("[Moloco] Detected?", isMoloco());
      goToStore();
    }
  });

  function showClickCircle(x: number, y: number) {
    for (let i = 0; i < 2; i++) {
      const ring = new Graphics();
      ring.circle(0, 0, 40);
      ring.stroke({ width: 2, color: 0xffffff, alpha: 1 });
      ring.position.set(x, y);
      world.addChild(ring);

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

    resizeBackground();

    shelf.position.set(app.screen.width * 0.2, app.screen.height * 0.5);
    ball.position.set(app.screen.width * 0.5, app.screen.height * 0.8);
    chair.position.set(app.screen.width * 0.8, app.screen.height * 0.7);
    decor1.position.set(app.screen.width * 1.0, app.screen.height * 0.75);
    start.position.set(app.screen.width * 1.3, app.screen.height * 0.45);
    skate.position.set(app.screen.width * 1.5, app.screen.height * 0.78);
    shelf2.position.set(app.screen.width * 1.8, app.screen.height * 0.5);
    duck.position.set(shelf2.x, shelf2.y - shelf2.height / 2 - duck.height / 2 + 3);
    clock.position.set(shelf2.x + app.screen.width * 0.3, shelf2.y - shelf2.height / 2 - clock.height / 2
    );

    if (clickCount === 0) {
      player.position.set(
        shelf.x + 130,
        shelf.y - shelf.height / 2 - player.height / 2 + 8
      );
    } else if (clickCount === 1) {
      player.position.set(
        chair.x,
        chair.y - chair.height / 2 - player.height / 2
      );
    } else if (clickCount === 2) {
      player.position.set(
        start.x,
        start.y - start.height / 2 - player.height / 2
      );

    } else if (clickCount === 3) {
      player.position.set(
        skate.x,
        skate.y - skate.height / 2 - player.height / 2 + 10
      );

    } else {
      player.position.set(
        clock.x,
        clock.y - clock.height / 2 - player.height / 2
      );
    }
  });

}

import { isMoloco } from "./js/moloco";
import { goToStore } from "./js/goToStore";
document.addEventListener("DOMContentLoaded", initApp);
