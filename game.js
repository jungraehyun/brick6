"use strict";


/* =========================================================
   NEON BREAKER
   ========================================================= */


const canvas =
  document.getElementById("gameCanvas");

const ctx =
  canvas.getContext("2d");


const W = canvas.width;
const H = canvas.height;


/* =========================================================
   DOM
========================================================= */

const scoreEl =
  document.getElementById("score");

const bestEl =
  document.getElementById("best");

const waveEl =
  document.getElementById("wave");

const waveFooterEl =
  document.getElementById("waveFooter");

const statusEl =
  document.getElementById("status");

const speedTextEl =
  document.getElementById("speedText");

const titleScreen =
  document.getElementById("titleScreen");

const gameOverScreen =
  document.getElementById("gameOverScreen");

const startButton =
  document.getElementById("startButton");

const restartButton =
  document.getElementById("restartButton");

const finalScoreEl =
  document.getElementById("finalScore");


/* =========================================================
   STATE
========================================================= */

const STATE = {

  TITLE: "TITLE",

  PLAYING: "PLAYING",

  GAME_OVER: "GAME_OVER"

};


let state = STATE.TITLE;

let score = 0;

let best =
  Number(
    localStorage.getItem(
      "neonBreakerBest"
    ) || 0
  );

let wave = 1;

let shake = 0;

let lastTime = 0;


/* =========================================================
   EFFECT SYSTEM
========================================================= */

/*
   particles
   일반 블럭 파괴
*/

let particles = [];


/*
   explosionEffects
   3×3 폭발 / BOMB 폭발의
   원형 충격파 효과
*/

let explosionEffects = [];


/*
   floatingTexts
   +100 / BOMB!! 등의 글자
*/

let floatingTexts = [];


/*
   bomb 상태
*/

let bombResetPending = false;

let bombResetTimer = 0;

const BOMB_RESET_DELAY = 0.65;


/* =========================================================
   PADDLE
========================================================= */

const paddle = {

  x:
    W / 2 - 75,

  y:
    H - 55,

  width: 150,

  height: 14,

  speed: 900

};


/* =========================================================
   BALL
========================================================= */

const ball = {

  x:
    W / 2,

  y:
    H - 90,

  r: 8,

  speed: 480,

  baseSpeed: 480,

  maxSpeed: 950,

  vx: 0,

  vy: 0

};


/* =========================================================
   BRICKS
========================================================= */

const bricks = [];


const BRICK_ROWS = 7;

const BRICK_COLS = 12;

const BRICK_WIDTH = 76;

const BRICK_HEIGHT = 25;

const BRICK_GAP = 8;

const BRICK_START_X = 86;

const BRICK_START_Y = 85;


/* =========================================================
   START
========================================================= */

function startGame() {

  score = 0;

  wave = 1;

  particles = [];

  explosionEffects = [];

  floatingTexts = [];

  bombResetPending = false;

  bombResetTimer = 0;

  createBricks();

  resetPaddle();

  resetBall();

  state = STATE.PLAYING;

  titleScreen.classList.add(
    "hidden"
  );

  gameOverScreen.classList.add(
    "hidden"
  );

  statusEl.textContent =
    "PLAYING";

  updateHUD();
}


/* =========================================================
   RESET PADDLE
========================================================= */

function resetPaddle() {

  paddle.x =
    W / 2 -
    paddle.width / 2;
}


/* =========================================================
   RESET BALL
========================================================= */

function resetBall() {

  ball.x =
    W / 2;

  ball.y =
    H - 90;

  ball.speed =
    Math.min(

      ball.baseSpeed +
        (wave - 1) * 35,

      ball.maxSpeed

    );


  const angle =
    (-Math.PI / 2) +
    (Math.random() - 0.5) *
      0.7;


  ball.vx =
    Math.cos(angle) *
    ball.speed;


  ball.vy =
    Math.sin(angle) *
    ball.speed;
}


/* =========================================================
   CREATE BRICKS
========================================================= */

function createBricks() {

  bricks.length = 0;


  for (
    let row = 0;
    row < BRICK_ROWS;
    row++
  ) {

    for (
      let col = 0;
      col < BRICK_COLS;
      col++
    ) {

      let type = "normal";


      const random =
        Math.random();


      /*
        BOMB
        0.1%

        SPECIAL
        약 10%
      */

      if (
        random < 0.001
      ) {

        type = "bomb";

      } else if (
        random < 0.101
      ) {

        type = "special";
      }


      bricks.push({

        x:
          BRICK_START_X +
          col *
            (BRICK_WIDTH +
              BRICK_GAP),

        y:
          BRICK_START_Y +
          row *
            (BRICK_HEIGHT +
              BRICK_GAP),

        width:
          BRICK_WIDTH,

        height:
          BRICK_HEIGHT,

        alive:
          true,

        type,

        /*
          폭발 연출용
        */

        exploding: false,

        explosionTimer: 0

      });

    }

  }

}


/* =========================================================
   HUD
========================================================= */

function updateHUD() {

  scoreEl.textContent =
    score;

  bestEl.textContent =
    best;

  waveEl.textContent =
    wave;

  waveFooterEl.textContent =
    wave;

  speedTextEl.textContent =
    "SPEED " +
    Math.round(
      ball.speed
    );
}


/* =========================================================
   SCORE
========================================================= */

function addScore(amount) {

  score += amount;


  if (
    score > best
  ) {

    best = score;

    localStorage.setItem(
      "neonBreakerBest",
      best
    );

  }


  updateHUD();
}


/* =========================================================
   FLOATING TEXT
========================================================= */

function createFloatingText(
  x,
  y,
  text,
  color = "#ffffff",
  size = 22
) {

  floatingTexts.push({

    x,

    y,

    text,

    color,

    size,

    life: 0.8,

    maxLife: 0.8

  });

}


/* =========================================================
   NEXT WAVE
========================================================= */

function nextWave() {

  wave++;

  createBricks();

  resetPaddle();

  resetBall();

  statusEl.textContent =
    "WAVE " + wave;

  updateHUD();
}


/* =========================================================
   GAME OVER
========================================================= */

function gameOver() {

  state =
    STATE.GAME_OVER;

  finalScoreEl.textContent =
    score;

  gameOverScreen.classList.remove(
    "hidden"
  );

  statusEl.textContent =
    "GAME OVER";
}


/* =========================================================
   BRICK COLLISION
========================================================= */

function handleBrickCollision() {

  for (
    const brick of bricks
  ) {

    if (
      !brick.alive
    ) {
      continue;
    }


    if (
      ball.x + ball.r >
        brick.x &&

      ball.x - ball.r <
        brick.x +
          brick.width &&

      ball.y + ball.r >
        brick.y &&

      ball.y - ball.r <
        brick.y +
          brick.height
    ) {


      /*
        충돌 방향
      */

      if (
        ball.vy > 0 &&
        ball.y < brick.y
      ) {

        ball.y =
          brick.y -
          ball.r;

        ball.vy *= -1;

      } else if (
        ball.vy < 0 &&
        ball.y >
          brick.y +
            brick.height
      ) {

        ball.y =
          brick.y +
          brick.height +
          ball.r;

        ball.vy *= -1;

      } else if (
        ball.vx > 0 &&
        ball.x < brick.x
      ) {

        ball.x =
          brick.x -
          ball.r;

        ball.vx *= -1;

      } else {

        ball.x =
          brick.x +
          brick.width +
          ball.r;

        ball.vx *= -1;

      }


      destroyBrick(brick);

      break;

    }

  }

}


/* =========================================================
   DESTROY BRICK
========================================================= */

function destroyBrick(
  brick
) {

  if (
    !brick.alive
  ) {
    return;
  }


  /*
    BOMB
  */

  if (
    brick.type === "bomb"
  ) {

    triggerBomb(brick);

    return;
  }


  /*
    일반 / SPECIAL
  */

  brick.alive = false;


  addScore(25);


  createBrickParticles(

    brick.x +
      brick.width / 2,

    brick.y +
      brick.height / 2,

    getBrickColor(brick)

  );


  createFloatingText(

    brick.x +
      brick.width / 2,

    brick.y,

    "+25",

    "#ffffff",

    16

  );


  /*
    SPECIAL
  */

  if (
    brick.type === "special"
  ) {

    triggerSpecialExplosion(
      brick
    );

  }

}


/* =========================================================
   SPECIAL 3×3 EXPLOSION
========================================================= */

function triggerSpecialExplosion(
  source
) {

  const centerX =
    source.x +
    source.width / 2;

  const centerY =
    source.y +
    source.height / 2;


  /*
    폭발 범위는
    실제 격자 기준 3×3
  */

  const centerCol =
    Math.round(
      (
        source.x -
        BRICK_START_X
      ) /
      (
        BRICK_WIDTH +
        BRICK_GAP
      )
    );


  const centerRow =
    Math.round(
      (
        source.y -
        BRICK_START_Y
      ) /
      (
        BRICK_HEIGHT +
        BRICK_GAP
      )
    );


  /*
    화면에 보이는 폭발 효과
  */

  createExplosionEffect(

    centerX,

    centerY,

    145,

    "#ffe600",

    false

  );


  /*
    중앙 블럭 표시
  */

  source.exploding = true;

  source.explosionTimer = 0.18;


  let destroyed =
    0;


  /*
    3×3 영역
  */

  for (
    const brick of bricks
  ) {

    if (
      !brick.alive
    ) {
      continue;
    }


    const col =
      Math.round(
        (
          brick.x -
          BRICK_START_X
        ) /
        (
          BRICK_WIDTH +
          BRICK_GAP
        )
      );


    const row =
      Math.round(
        (
          brick.y -
          BRICK_START_Y
        ) /
        (
          BRICK_HEIGHT +
          BRICK_GAP
        )
      );


    const distanceX =
      Math.abs(
        col -
        centerCol
      );


    const distanceY =
      Math.abs(
        row -
        centerRow
      );


    /*
      3×3
      가로 ±1
      세로 ±1
    */

    if (
      distanceX <= 1 &&
      distanceY <= 1
    ) {

      if (
        brick === source
      ) {
        continue;
      }


      brick.alive =
        false;


      brick.exploding =
        true;

      brick.explosionTimer =
        0.28;


      destroyed++;


      addScore(25);


      createBrickParticles(

        brick.x +
          brick.width / 2,

        brick.y +
          brick.height / 2,

        "#ffe600"

      );

    }

  }


  /*
    SPECIAL 추가 보너스
  */

  const bonus =
    destroyed * 100;


  if (
    bonus > 0
  ) {

    addScore(
      bonus
    );

  }


  createFloatingText(

    centerX,

    centerY - 35,

    "3×3",

    "#ffe600",

    30

  );


  createFloatingText(

    centerX,

    centerY + 5,

    "+" +
      (destroyed * 125 + 100),

    "#ffffff",

    20

  );


  shake = 12;

}


/* =========================================================
   BOMB
========================================================= */

function triggerBomb(
  source
) {

  if (
    bombResetPending
  ) {
    return;
  }


  /*
    BOMB 자체 제거
  */

  source.alive =
    false;


  let destroyedCount =
    0;


  /*
    전체 블럭 제거
  */

  for (
    const brick of bricks
  ) {

    if (
      !brick.alive
    ) {
      continue;
    }


    brick.alive =
      false;


    brick.exploding =
      true;

    brick.explosionTimer =
      0.6;


    destroyedCount++;


    createBrickParticles(

      brick.x +
        brick.width / 2,

      brick.y +
        brick.height / 2,

      "#ff1744"

    );

  }


  /*
    전체 화면 폭발
  */

  createExplosionEffect(

    W / 2,

    H / 2,

    Math.max(W, H),

    "#ff1744",

    true

  );


  /*
    추가 충격파
  */

  createExplosionEffect(

    source.x +
      source.width / 2,

    source.y +
      source.height / 2,

    300,

    "#ffea00",

    false

  );


  /*
    점수
  */

  const bombBonus =
    1000;

  const brickBonus =
    destroyedCount * 25;


  score +=
    bombBonus +
    brickBonus;


  if (
    score > best
  ) {

    best =
      score;

    localStorage.setItem(
      "neonBreakerBest",
      best
    );

  }


  /*
    BOMB 글자
  */

  createFloatingText(

    W / 2,

    H / 2,

    "BOMB!!",

    "#ff1744",

    64

  );


  createFloatingText(

    W / 2,

    H / 2 + 70,

    "+" +
      (
        bombBonus +
        brickBonus
      ),

    "#ffffff",

    28

  );


  /*
    상태
  */

  bombResetPending =
    true;

  bombResetTimer =
    BOMB_RESET_DELAY;


  statusEl.textContent =
    "BOMB!!";


  /*
    공 정지
  */

  ball.vx = 0;

  ball.vy = 0;


  shake = 30;


  updateHUD();

}


/* =========================================================
   EXPLOSION EFFECT
========================================================= */

function createExplosionEffect(
  x,
  y,
  maxRadius,
  color,
  huge
) {

  explosionEffects.push({

    x,

    y,

    radius: 10,

    maxRadius,

    color,

    life:
      huge
        ? 0.8
        : 0.45,

    maxLife:
      huge
        ? 0.8
        : 0.45,

    huge,

    ringCount:
      huge
        ? 5
        : 2

  });

}


/* =========================================================
   UPDATE EXPLOSIONS
========================================================= */

function updateExplosionEffects(
  dt
) {

  for (
    let i =
      explosionEffects.length - 1;

    i >= 0;

    i--
  ) {

    const effect =
      explosionEffects[i];


    effect.life -=
      dt;


    const progress =
      1 -
      effect.life /
        effect.maxLife;


    /*
      빠르게 퍼짐
    */

    effect.radius =
      effect.maxRadius *
      (
        1 -
        Math.pow(
          1 - progress,
          3
        )
      );


    if (
      effect.life <= 0
    ) {

      explosionEffects.splice(
        i,
        1
      );

    }

  }

}


/* =========================================================
   DRAW EXPLOSIONS
========================================================= */

function drawExplosionEffects() {

  for (
    const effect of
      explosionEffects
  ) {

    const alpha =
      Math.max(
        0,
        effect.life /
          effect.maxLife
      );


    ctx.save();


    /*
      메인 원
    */

    ctx.globalAlpha =
      alpha * 0.16;

    ctx.fillStyle =
      effect.color;

    ctx.shadowBlur =
      effect.huge
        ? 80
        : 40;

    ctx.shadowColor =
      effect.color;


    ctx.beginPath();

    ctx.arc(

      effect.x,

      effect.y,

      effect.radius,

      0,

      Math.PI * 2

    );

    ctx.fill();


    /*
      바깥 충격파
    */

    ctx.globalAlpha =
      alpha;


    ctx.lineWidth =
      effect.huge
        ? 12
        : 6;


    ctx.strokeStyle =
      effect.color;


    ctx.shadowBlur =
      effect.huge
        ? 60
        : 30;


    ctx.beginPath();

    ctx.arc(

      effect.x,

      effect.y,

      effect.radius,

      0,

      Math.PI * 2

    );

    ctx.stroke();


    /*
      여러 겹의 충격파
    */

    for (
      let i = 1;
      i < effect.ringCount;
      i++
    ) {

      const ringProgress =
        Math.max(
          0,
          (
            effect.radius -
            i * 35
          ) /
          effect.maxRadius
        );


      if (
        ringProgress <= 0
      ) {
        continue;
      }


      ctx.globalAlpha =
        alpha *
        (
          1 -
          i /
            (
              effect.ringCount +
              1
            )
        );


      ctx.lineWidth =
        3;


      ctx.beginPath();

      ctx.arc(

        effect.x,

        effect.y,

        effect.radius -
          i * 35,

        0,

        Math.PI * 2

      );

      ctx.stroke();

    }


    /*
      중앙 빛
    */

    if (
      effect.radius <
      effect.maxRadius *
        0.45
    ) {

      ctx.globalAlpha =
        alpha;


      const gradient =
        ctx.createRadialGradient(

          effect.x,

          effect.y,

          0,

          effect.x,

          effect.y,

          effect.radius *
            0.4

        );


      gradient.addColorStop(
        0,
        "#ffffff"
      );

      gradient.addColorStop(
        0.2,
        effect.color
      );

      gradient.addColorStop(
        1,
        "transparent"
      );


      ctx.fillStyle =
        gradient;


      ctx.beginPath();

      ctx.arc(

        effect.x,

        effect.y,

        effect.radius *
          0.4,

        0,

        Math.PI * 2

      );

      ctx.fill();

    }


    ctx.restore();

  }

}


/* =========================================================
   RESTORE AFTER BOMB
========================================================= */

function restoreBricksAfterBomb() {

  createBricks();

  resetPaddle();

  resetBall();


  bombResetPending =
    false;

  bombResetTimer =
    0;


  statusEl.textContent =
    "PLAYING";


  updateHUD();

}


/* =========================================================
   UPDATE
========================================================= */

function update(dt) {

  if (
    state !==
    STATE.PLAYING
  ) {

    updateParticles(dt);

    updateExplosionEffects(dt);

    updateFloatingTexts(dt);

    return;
  }


  /*
    BOMB 연출 중
  */

  if (
    bombResetPending
  ) {

    bombResetTimer -=
      dt;


    updateParticles(dt);

    updateExplosionEffects(dt);

    updateFloatingTexts(dt);


    shake *=
      0.90;


    if (
      bombResetTimer <= 0
    ) {

      restoreBricksAfterBomb();

    }


    updateHUD();

    return;
  }


  /*
    공 이동
  */

  ball.x +=
    ball.vx *
    dt;

  ball.y +=
    ball.vy *
    dt;


  /*
    벽
  */

  if (
    ball.x -
      ball.r <=
    0
  ) {

    ball.x =
      ball.r;

    ball.vx *=
      -1;

  }


  if (
    ball.x +
      ball.r >=
    W
  ) {

    ball.x =
      W -
      ball.r;

    ball.vx *=
      -1;

  }


  if (
    ball.y -
      ball.r <=
    0
  ) {

    ball.y =
      ball.r;

    ball.vy *=
      -1;

  }


  /*
    패들
  */

  if (

    ball.vy > 0 &&

    ball.x +
      ball.r >=
      paddle.x &&

    ball.x -
      ball.r <=
      paddle.x +
        paddle.width &&

    ball.y +
      ball.r >=
      paddle.y &&

    ball.y -
      ball.r <=
      paddle.y +
        paddle.height

  ) {

    ball.y =
      paddle.y -
      ball.r;


    const hitPosition =

      (
        ball.x -
        (
          paddle.x +
          paddle.width / 2
        )
      ) /
      (
        paddle.width / 2
      );


    const maxAngle =
      Math.PI *
      0.42;


    const angle =
      -Math.PI / 2 +
      hitPosition *
        maxAngle;


    ball.speed =
      Math.min(

        Math.sqrt(

          ball.vx *
            ball.vx +

          ball.vy *
            ball.vy

        ) + 8,

        ball.maxSpeed

      );


    ball.vx =
      Math.cos(angle) *
      ball.speed;


    ball.vy =
      Math.sin(angle) *
      ball.speed;

  }


  /*
    블럭
  */

  handleBrickCollision();


  /*
    공 낙하
  */

  if (
    ball.y -
      ball.r >
    H
  ) {

    gameOver();

    return;
  }


  /*
    모든 블럭 파괴
  */

  if (

    !bombResetPending &&

    bricks.length > 0 &&

    bricks.every(
      brick =>
        !brick.alive
    )

  ) {

    nextWave();

  }


  /*
    효과
  */

  updateParticles(dt);

  updateExplosionEffects(dt);

  updateFloatingTexts(dt);


  shake *=
    0.88;


  updateHUD();

}


/* =========================================================
   PARTICLES
========================================================= */

function createBrickParticles(
  x,
  y,
  color
) {

  for (
    let i = 0;
    i < 12;
    i++
  ) {

    const angle =
      Math.random() *
      Math.PI *
      2;


    const speed =
      80 +
      Math.random() *
      180;


    particles.push({

      x,

      y,

      vx:
        Math.cos(angle) *
        speed,

      vy:
        Math.sin(angle) *
        speed,

      life:
        0.5 +
        Math.random() *
        0.3,

      maxLife:
        0.8,

      size:
        2 +
        Math.random() *
        4,

      color

    });

  }

}


/* =========================================================
   BOMB PARTICLES
========================================================= */

function createBombExplosionParticles() {

  const centerX =
    W / 2;

  const centerY =
    H / 2;


  for (
    let i = 0;
    i < 220;
    i++
  ) {

    const angle =
      Math.random() *
      Math.PI *
      2;


    const speed =
      100 +
      Math.random() *
      750;


    particles.push({

      x:
        centerX,

      y:
        centerY,

      vx:
        Math.cos(angle) *
        speed,

      vy:
        Math.sin(angle) *
        speed,

      life:
        0.5 +
        Math.random() *
        1.2,

      maxLife:
        1.7,

      size:
        2 +
        Math.random() *
        7,

      color:
        Math.random() > 0.5
          ? "#ff1744"
          : "#ffea00"

    });

  }

}


/* =========================================================
   UPDATE PARTICLES
========================================================= */

function updateParticles(dt) {

  for (
    let i =
      particles.length - 1;

    i >= 0;

    i--
  ) {

    const p =
      particles[i];


    p.x +=
      p.vx *
      dt;


    p.y +=
      p.vy *
      dt;


    p.vy +=
      300 *
      dt;


    p.life -=
      dt;


    if (
      p.life <= 0
    ) {

      particles.splice(
        i,
        1
      );

    }

  }

}


/* =========================================================
   FLOATING TEXT UPDATE
========================================================= */

function updateFloatingTexts(dt) {

  for (
    let i =
      floatingTexts.length - 1;

    i >= 0;

    i--
  ) {

    const text =
      floatingTexts[i];


    text.y -=
      35 *
      dt;


    text.life -=
      dt;


    if (
      text.life <= 0
    ) {

      floatingTexts.splice(
        i,
        1
      );

    }

  }

}


/* =========================================================
   DRAW
========================================================= */

function draw() {

  ctx.save();


  /*
    화면 흔들림
  */

  if (
    shake > 0.5
  ) {

    ctx.translate(

      (
        Math.random() -
        0.5
      ) *
      shake,

      (
        Math.random() -
        0.5
      ) *
      shake

    );

  }


  ctx.clearRect(
    0,
    0,
    W,
    H
  );


  drawBackground();

  drawBricks();

  drawPaddle();

  drawBall();

  drawParticles();

  drawExplosionEffects();

  drawFloatingTexts();


  ctx.restore();

}


/* =========================================================
   BACKGROUND
========================================================= */

function drawBackground() {

  const gradient =
    ctx.createRadialGradient(

      W / 2,

      H / 2,

      50,

      W / 2,

      H / 2,

      H

    );


  gradient.addColorStop(
    0,
    "#0b1830"
  );


  gradient.addColorStop(
    1,
    "#02040b"
  );


  ctx.fillStyle =
    gradient;


  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  /*
    GRID
  */

  ctx.strokeStyle =
    "rgba(0,255,255,0.035)";


  ctx.lineWidth =
    1;


  const gridSize =
    40;


  for (
    let x = 0;
    x <= W;
    x += gridSize
  ) {

    ctx.beginPath();

    ctx.moveTo(
      x,
      0
    );

    ctx.lineTo(
      x,
      H
    );

    ctx.stroke();

  }


  for (
    let y = 0;
    y <= H;
    y += gridSize
  ) {

    ctx.beginPath();

    ctx.moveTo(
      0,
      y
    );

    ctx.lineTo(
      W,
      y
    );

    ctx.stroke();

  }

}


/* =========================================================
   DRAW BRICKS
========================================================= */

function drawBricks() {

  for (
    const brick of bricks
  ) {

    if (
      !brick.alive
    ) {
      continue;
    }


    const color =
      getBrickColor(
        brick
      );


    ctx.save();


    /*
      SPECIAL은 더 강한 빛
    */

    if (
      brick.type ===
      "special"
    ) {

      ctx.shadowBlur =
        28;

    } else if (
      brick.type ===
      "bomb"
    ) {

      ctx.shadowBlur =
        30;

    } else {

      ctx.shadowBlur =
        12;

    }


    ctx.shadowColor =
      color;


    ctx.fillStyle =
      color;


    ctx.fillRect(

      brick.x,

      brick.y,

      brick.width,

      brick.height

    );


    /*
      하이라이트
    */

    ctx.fillStyle =
      "rgba(255,255,255,0.18)";


    ctx.fillRect(

      brick.x + 3,

      brick.y + 3,

      brick.width - 6,

      4

    );


    /*
      BOMB
    */

    if (
      brick.type ===
      "bomb"
    ) {

      ctx.textAlign =
        "center";

      ctx.textBaseline =
        "middle";


      ctx.font =
        "900 12px Arial";


      ctx.fillStyle =
        "#ffffff";


      ctx.shadowBlur =
        10;


      ctx.shadowColor =
        "#ff1744";


      ctx.fillText(

        "BOMB!!",

        brick.x +
          brick.width / 2,

        brick.y +
          brick.height / 2 +
          1

      );

    }


    /*
      SPECIAL
    */

    if (
      brick.type ===
      "special"
    ) {

      ctx.textAlign =
        "center";

      ctx.textBaseline =
        "middle";


      ctx.font =
        "900 10px Arial";


      ctx.fillStyle =
        "#111111";


      ctx.fillText(

        "3×3",

        brick.x +
          brick.width / 2,

        brick.y +
          brick.height / 2 +
          1

      );

    }


    ctx.restore();

  }

}


/* =========================================================
   COLOR
========================================================= */

function getBrickColor(
  brick
) {

  if (
    brick.type ===
    "bomb"
  ) {

    return "#ff1744";

  }


  if (
    brick.type ===
    "special"
  ) {

    return "#ffe600";

  }


  const colors = [

    "#00e5ff",

    "#00ff88",

    "#7c4dff",

    "#ff4081",

    "#40c4ff",

    "#69f0ae",

    "#b388ff"

  ];


  const row =
    Math.floor(

      (
        brick.y -
        BRICK_START_Y
      ) /

      (
        BRICK_HEIGHT +
        BRICK_GAP
      )

    );


  return colors[
    row %
    colors.length
  ];

}


/* =========================================================
   PADDLE
========================================================= */

function drawPaddle() {

  ctx.save();


  ctx.shadowBlur =
    25;

  ctx.shadowColor =
    "#00ffff";


  const gradient =
    ctx.createLinearGradient(

      paddle.x,

      paddle.y,

      paddle.x +
        paddle.width,

      paddle.y

    );


  gradient.addColorStop(
    0,
    "#00ffff"
  );


  gradient.addColorStop(
    0.5,
    "#ffffff"
  );


  gradient.addColorStop(
    1,
    "#00ffff"
  );


  ctx.fillStyle =
    gradient;


  ctx.fillRect(

    paddle.x,

    paddle.y,

    paddle.width,

    paddle.height

  );


  ctx.restore();

}


/* =========================================================
   BALL
========================================================= */

function drawBall() {

  ctx.save();


  ctx.shadowBlur =
    25;

  ctx.shadowColor =
    "#ffffff";


  const gradient =
    ctx.createRadialGradient(

      ball.x - 2,

      ball.y - 2,

      1,

      ball.x,

      ball.y,

      ball.r

    );


  gradient.addColorStop(
    0,
    "#ffffff"
  );


  gradient.addColorStop(
    0.5,
    "#cfffff"
  );


  gradient.addColorStop(
    1,
    "#00ffff"
  );


  ctx.fillStyle =
    gradient;


  ctx.beginPath();


  ctx.arc(

    ball.x,

    ball.y,

    ball.r,

    0,

    Math.PI * 2

  );


  ctx.fill();


  ctx.restore();

}


/* =========================================================
   PARTICLES DRAW
========================================================= */

function drawParticles() {

  for (
    const p of particles
  ) {

    const alpha =
      Math.max(

        0,

        p.life /
          p.maxLife

      );


    ctx.save();


    ctx.globalAlpha =
      alpha;


    ctx.fillStyle =
      p.color;


    ctx.shadowBlur =
      10;


    ctx.shadowColor =
      p.color;


    ctx.beginPath();


    ctx.arc(

      p.x,

      p.y,

      p.size,

      0,

      Math.PI * 2

    );


    ctx.fill();


    ctx.restore();

  }

}


/* =========================================================
   FLOATING TEXT DRAW
========================================================= */

function drawFloatingTexts() {

  for (
    const text of
      floatingTexts
  ) {

    const alpha =
      Math.max(

        0,

        text.life /
          text.maxLife

      );


    ctx.save();


    ctx.globalAlpha =
      alpha;


    ctx.textAlign =
      "center";


    ctx.textBaseline =
      "middle";


    ctx.font =
      "900 " +
      text.size +
      "px Arial";


    ctx.fillStyle =
      text.color;


    ctx.shadowBlur =
      15;


    ctx.shadowColor =
      text.color;


    ctx.fillText(

      text.text,

      text.x,

      text.y

    );


    ctx.restore();

  }

}


/* =========================================================
   MOUSE CONTROL
========================================================= */

function movePaddleToPointer(
  clientX
) {

  const rect =
    canvas.getBoundingClientRect();


  if (
    !rect.width
  ) {
    return;
  }


  const scaleX =
    canvas.width /
    rect.width;


  const canvasX =
    (
      clientX -
      rect.left
    ) *
    scaleX;


  paddle.x =
    canvasX -
    paddle.width / 2;


  paddle.x =
    Math.max(

      0,

      Math.min(

        W -
          paddle.width,

        paddle.x

      )

    );

}


canvas.addEventListener(

  "mousemove",

  function(event) {

    if (
      state ===
      STATE.PLAYING
    ) {

      movePaddleToPointer(
        event.clientX
      );

    }

  }

);


/* =========================================================
   TOUCH CONTROL
========================================================= */

canvas.addEventListener(

  "touchstart",

  function(event) {

    event.preventDefault();


    if (

      state ===
        STATE.PLAYING &&

      event.touches.length > 0

    ) {

      movePaddleToPointer(

        event.touches[0]
          .clientX

      );

    }

  },

  {
    passive: false
  }

);


canvas.addEventListener(

  "touchmove",

  function(event) {

    event.preventDefault();


    if (

      state ===
        STATE.PLAYING &&

      event.touches.length > 0

    ) {

      movePaddleToPointer(

        event.touches[0]
          .clientX

      );

    }

  },

  {
    passive: false
  }

);


canvas.addEventListener(

  "touchend",

  function(event) {

    event.preventDefault();

  },

  {
    passive: false
  }

);


canvas.addEventListener(

  "touchcancel",

  function(event) {

    event.preventDefault();

  },

  {
    passive: false
  }

);


/* =========================================================
   KEYBOARD
========================================================= */

const keys = {};


window.addEventListener(

  "keydown",

  function(event) {

    keys[
      event.key.toLowerCase()
    ] = true;


    if (

      [
        "arrowleft",
        "arrowright",
        "a",
        "d",
        " "
      ].includes(
        event.key.toLowerCase()
      )

    ) {

      event.preventDefault();

    }

  }

);


window.addEventListener(

  "keyup",

  function(event) {

    keys[
      event.key.toLowerCase()
    ] = false;

  }

);


/* =========================================================
   KEYBOARD UPDATE
========================================================= */

function updateKeyboard(dt) {

  if (
    state !==
    STATE.PLAYING
  ) {

    return;

  }


  let direction = 0;


  if (
    keys["arrowleft"] ||
    keys["a"]
  ) {

    direction -= 1;

  }


  if (
    keys["arrowright"] ||
    keys["d"]
  ) {

    direction += 1;

  }


  if (
    direction !== 0
  ) {

    paddle.x +=
      direction *
      paddle.speed *
      dt;


    paddle.x =
      Math.max(

        0,

        Math.min(

          W -
            paddle.width,

          paddle.x

        )

      );

  }

}


/* =========================================================
   BUTTONS
========================================================= */

startButton.addEventListener(

  "click",

  startGame

);


restartButton.addEventListener(

  "click",

  startGame

);


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop(
  timestamp
) {

  if (
    !lastTime
  ) {

    lastTime =
      timestamp;

  }


  let dt =
    (
      timestamp -
      lastTime
    ) / 1000;


  lastTime =
    timestamp;


  dt =
    Math.min(
      dt,
      0.033
    );


  updateKeyboard(dt);

  update(dt);

  draw();


  requestAnimationFrame(
    gameLoop
  );

}


/* =========================================================
   INITIAL
========================================================= */

bestEl.textContent =
  best;

scoreEl.textContent =
  0;

waveEl.textContent =
  1;

waveFooterEl.textContent =
  1;


requestAnimationFrame(
  gameLoop
);