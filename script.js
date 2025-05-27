const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let width, height;
function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}
resize();
window.addEventListener("resize", resize);

const velocityInput = document.getElementById("velocity");
const angleInput = document.getElementById("angle");
const dragInput = document.getElementById("drag");
const gravityInput = document.getElementById("gravity");
const showVelocityCheckbox = document.getElementById("showVelocity");

const velValue = document.getElementById("velValue");
const angleValue = document.getElementById("angleValue");
const dragValue = document.getElementById("dragValue");
const gravityValue = document.getElementById("gravityValue");

const runBtn = document.getElementById("runBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

const showVelocityGraphCheckbox = document.getElementById("showVelocity");
const showForcesGraphCheckbox = document.getElementById("showForces");

const velocityGraph = document.getElementById("velocityGraph");
const velocityGraphCtx = velocityGraph.getContext("2d");
const forcesGraph = document.getElementById("forcesGraph");
const forcesGraphCtx = forcesGraph.getContext("2d");

velocityGraph.width = 250;
velocityGraph.height = 100;
forcesGraph.width = 250;
forcesGraph.height = 100;

function updateDisplayValues() {
  velValue.textContent = velocityInput.value;
  angleValue.textContent = angleInput.value;
  dragValue.textContent = parseFloat(dragInput.value).toFixed(3);
  gravityValue.textContent = parseFloat(gravityInput.value).toFixed(1);
}
updateDisplayValues();

velocityInput.addEventListener("input", updateDisplayValues);
angleInput.addEventListener("input", updateDisplayValues);
dragInput.addEventListener("input", updateDisplayValues);
gravityInput.addEventListener("input", updateDisplayValues);
showVelocityCheckbox.addEventListener("change", () => {
  if (!simulation.running || simulation.paused) draw();
});
showForcesGraphCheckbox.addEventListener("change", () => {
  if (!simulation.running || simulation.paused) draw();
});

let simulation = {
  running: false,
  paused: false,
  time: 0,
  dt: 0.01,
  ball: {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 6,
    path: [],
  },
  scaleX: 1,
  scaleY: 1,
  maxX: 100,
  maxY: 50,
  xTickInterval: 5,
  yTickInterval: 5
};

function initSimulation() {
  simulation.time = 0;
  simulation.ball.x = 0;
  simulation.ball.y = 0;
  simulation.ball.path = [];

  const v0 = Math.min(parseFloat(velocityInput.value), 50);
  const angleDeg = parseFloat(angleInput.value);
  const angleRad = (angleDeg * Math.PI) / 180;
  simulation.ball.vx = v0 * Math.cos(angleRad);
  simulation.ball.vy = v0 * Math.sin(angleRad);

  simulation.drag = parseFloat(dragInput.value);
  simulation.g = Math.max(parseFloat(gravityInput.value), 1);

  let x = 0;
  let y = 0;
  let vx = simulation.ball.vx;
  let vy = simulation.ball.vy;
  const dt = simulation.dt;
  let maxX = 0;
  let maxY = 0;

  simulation.ball.path = [];
  
  while (y >= 0) {
    simulation.ball.path.push({ x, y, vx, vy });

    let v = Math.sqrt(vx * vx + vy * vy);
    let dragForceX = -simulation.drag * v * vx;
    let dragForceY = -simulation.drag * v * vy;

    vx += dragForceX * dt;
    vy += (-simulation.g + dragForceY) * dt;

    x += vx * dt;
    y += vy * dt;

    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (x > 10000 || maxY > 10000) break;
  }


  if (simulation.ball.path.length >= 2) {
    const last = simulation.ball.path[simulation.ball.path.length - 1];
    const secondLast = simulation.ball.path[simulation.ball.path.length - 2];
    const t = -secondLast.y / (last.y - secondLast.y);
    const zeroYx = secondLast.x + t * (last.x - secondLast.x);
    const zeroYvx = secondLast.vx + t * (last.vx - secondLast.vx);
    const zeroYvy = secondLast.vy + t * (last.vy - secondLast.vy);
    simulation.ball.path[simulation.ball.path.length - 1] = { x: zeroYx, y: 0, vx: zeroYvx, vy: zeroYvy };
    maxX = Math.max(maxX, zeroYx);
  }

  const padding = 0.1;
  simulation.maxX = Math.max(maxX * (1 + padding), 10);
  simulation.maxY = Math.max(maxY * (1 + padding), 5);

  const screenAspectRatio = (width - 60) / (height - 60);
  const trajectoryAspectRatio = simulation.maxX / simulation.maxY;

  if (trajectoryAspectRatio > screenAspectRatio * 2) {
    simulation.maxY = simulation.maxX / (screenAspectRatio * 1.5);
  } else if (trajectoryAspectRatio < screenAspectRatio * 0.5) {
    simulation.maxX = simulation.maxY * screenAspectRatio * 1.5;
  }

  simulation.xTickInterval = calculateTickInterval(simulation.maxX / 20);
  simulation.yTickInterval = calculateTickInterval(simulation.maxY / 10);

  simulation.scaleX = (width - 60) / simulation.maxX;
  simulation.scaleY = (height - 60) / simulation.maxY;

  simulation.ball.x = 0;
  simulation.ball.y = 0;
  simulation.ball.vx = simulation.ball.path.length > 1 ? simulation.ball.path[1].vx : 0;
  simulation.ball.vy = simulation.ball.path.length > 1 ? simulation.ball.path[1].vy : 0;
}

function calculateTickInterval(rawInterval) {
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)));
  const normalized = rawInterval / magnitude;
  let interval;
  if (normalized <= 1) interval = magnitude;
  else if (normalized <= 2) interval = 2 * magnitude;
  else if (normalized <= 5) interval = 5 * magnitude;
  else interval = 10 * magnitude;
  return Math.max(1, Math.round(interval));
}

function drawAxes() {
  ctx.save();
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 1;
  ctx.font = "12px Arial";
  ctx.fillStyle = "#222";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  ctx.beginPath();
  ctx.moveTo(30, height - 30);
  ctx.lineTo(width - 30, height - 30);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(30, height - 30);
  ctx.lineTo(30, 30);
  ctx.stroke();

  const maxX = simulation.maxX;
  const maxY = simulation.maxY;
  const xTickInterval = simulation.xTickInterval;
  const yTickInterval = simulation.yTickInterval;
  const majorTickLength = 10;

  for (let x = 0; x <= maxX; x += xTickInterval) {
    const px = 30 + x * simulation.scaleX;
    if (px > width - 30) break;
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#666";
    ctx.moveTo(px, height - 30);
    ctx.lineTo(px, height - 30 - majorTickLength);
    ctx.stroke();
    ctx.fillText(Math.round(x).toString(), px, height - 30 + 4);
  }

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let y = 0; y <= maxY; y += yTickInterval) {
    const py = height - 30 - y * simulation.scaleY;
    if (py < 30) break;
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#666";
    ctx.moveTo(30, py);
    ctx.lineTo(30 + majorTickLength, py);
    ctx.stroke();
    ctx.fillText(Math.round(y).toString(), 25, py);
  }

  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  drawAxes();

  ctx.save();
  ctx.strokeStyle = "#0077cc";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 15]);

  ctx.beginPath();
  simulation.ball.path.forEach((point, idx) => {
    const px = 30 + point.x * simulation.scaleX;
    const py = height - 30 - point.y * simulation.scaleY;
    if (idx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.restore();

  const ballPx = 30 + simulation.ball.x * simulation.scaleX;
  const ballPy = height - 30 - simulation.ball.y * simulation.scaleY;

  ctx.fillStyle = "#0077cc";
  ctx.beginPath();
  ctx.arc(ballPx, ballPy, simulation.ball.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "14px Arial";
  ctx.fillStyle = "#222";
  ctx.textAlign = "left";
  ctx.fillText(`x: ${simulation.ball.x.toFixed(2)} m`, ballPx + 10, ballPy - 20);
  ctx.fillText(`y: ${simulation.ball.y.toFixed(2)} m`, ballPx + 10, ballPy - 5);

  if (showVelocityCheckbox.checked && simulation.ball.y > 0 && simulation.ball.path[step]) {
    const velocity = simulation.ball.path[step];
    const speed = Math.sqrt(velocity.vx ** 2 + velocity.vy ** 2);

    if (speed > 0.0001) {
      const scaleFactor = 2;

      const vx = velocity.vx * scaleFactor;
      const vy = velocity.vy * scaleFactor;

      ctx.beginPath();
      ctx.moveTo(ballPx, ballPy);
      ctx.lineTo(ballPx + vx, ballPy - vy); 
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.stroke();

      const angle = Math.atan2(-vy, vx);
      const arrowLength = 6;
      const arrowAngle = Math.PI / 6;

      ctx.beginPath();
      ctx.moveTo(ballPx + vx, ballPy - vy);
      ctx.lineTo(
        ballPx + vx - arrowLength * Math.cos(angle - arrowAngle),
        ballPy - vy - arrowLength * Math.sin(angle - arrowAngle)
      );
      ctx.lineTo(
        ballPx + vx - arrowLength * Math.cos(angle + arrowAngle),
        ballPy - vy - arrowLength * Math.sin(angle + arrowAngle)
      );
      ctx.lineTo(ballPx + vx, ballPy - vy);
      ctx.fillStyle = "red";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(ballPx, ballPy);
      ctx.lineTo(ballPx + vx, ballPy);
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(ballPx + vx, ballPy);
      ctx.lineTo(
        ballPx + vx - arrowLength * Math.cos(0 - arrowAngle),
        ballPy - arrowLength * Math.sin(0 - arrowAngle)
      );
      ctx.lineTo(
        ballPx + vx - arrowLength * Math.cos(0 + arrowAngle),
        ballPy - arrowLength * Math.sin(0 + arrowAngle)
      );
      ctx.lineTo(ballPx + vx, ballPy);
      ctx.fillStyle = "blue";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(ballPx, ballPy);
      ctx.lineTo(ballPx, ballPy - vy);
      ctx.strokeStyle = "green";
      ctx.lineWidth = 2;
      ctx.stroke();

      const vyDir = vy >= 0 ? -1 : 1;
      const vyAngle = vyDir === -1 ? -Math.PI / 2 : Math.PI / 2;

      ctx.beginPath();
      ctx.moveTo(ballPx, ballPy - vy);
      ctx.lineTo(
        ballPx - arrowLength * Math.cos(vyAngle - arrowAngle),
        ballPy - vy - arrowLength * Math.sin(vyAngle - arrowAngle)
      );
      ctx.lineTo(
        ballPx - arrowLength * Math.cos(vyAngle + arrowAngle),
        ballPy - vy - arrowLength * Math.sin(vyAngle + arrowAngle)
      );
      ctx.lineTo(ballPx, ballPy - vy);
      ctx.fillStyle = "green";
      ctx.fill();

    }
  }

  const showForcesCheckbox = document.getElementById("showForces");
  if (showForcesCheckbox?.checked && simulation.ball.y > 0 && simulation.ball.path[step]) {
    const point = simulation.ball.path[step];
    const v = Math.sqrt(point.vx ** 2 + point.vy ** 2);
    const dragMag = simulation.drag * v;
    const dragX = -dragMag * point.vx;
    const dragY = -dragMag * point.vy;
    const gravityY = -simulation.g;

    const netX = dragX;
    const netY = dragY + gravityY;

    const scaleForce = 4;
    const drawVector = (dx, dy, color) => {
      const endX = ballPx + dx * scaleForce;
      const endY = ballPy - dy * scaleForce;

      ctx.beginPath();
      ctx.moveTo(ballPx, ballPy);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      const angle = Math.atan2(-dy, dx);
      const arrowLength = 6;
      const arrowAngle = Math.PI / 6;

      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowLength * Math.cos(angle - arrowAngle),
        endY - arrowLength * Math.sin(angle - arrowAngle)
      );
      ctx.lineTo(
        endX - arrowLength * Math.cos(angle + arrowAngle),
        endY - arrowLength * Math.sin(angle + arrowAngle)
      );
      ctx.lineTo(endX, endY);
      ctx.fillStyle = color;
      ctx.fill();
    };

    drawVector(dragX, dragY, "orange");
    drawVector(0, gravityY, "brown");
    drawVector(netX, netY, "purple");
  }

  if (showVelocityGraphCheckbox.checked) {
    velocityGraph.style.display = "block";
    drawVelocityGraph();
  } else {
    velocityGraph.style.display = "none";
  }

  if (showForcesGraphCheckbox.checked) {
    forcesGraph.style.display = "block";
    drawForcesGraph();
  } else {
    forcesGraph.style.display = "none";
  }

}

function drawVelocityGraph() {
  velocityGraphCtx.clearRect(0, 0, velocityGraph.width, velocityGraph.height);

  const midY = velocityGraph.height / 2;
  const maxY = 50;

  velocityGraphCtx.strokeStyle = "#aaa";
  velocityGraphCtx.beginPath();
  velocityGraphCtx.moveTo(0, midY);
  velocityGraphCtx.lineTo(velocityGraph.width, midY);
  velocityGraphCtx.stroke();

  velocityGraphCtx.fillStyle = "#222";
  velocityGraphCtx.font = "10px Arial";
  velocityGraphCtx.textAlign = "right";
  velocityGraphCtx.fillText(`+${maxY} m/s`, velocityGraph.width - 2, 10);
  velocityGraphCtx.fillText(`0`, velocityGraph.width - 2, midY + 10);
  velocityGraphCtx.fillText(`-${maxY} m/s`, velocityGraph.width - 2, velocityGraph.height - 2);

  const path = simulation.ball.path;

  velocityGraphCtx.strokeStyle = "red";
  velocityGraphCtx.beginPath();
  for (let i = 0; i < step; i++) {
    const p = path[i];
    const speed = Math.sqrt(p.vx ** 2 + p.vy ** 2);
    const x = (i / path.length) * velocityGraph.width;
    const y = midY - (speed / maxY) * midY;
    if (i === 0) velocityGraphCtx.moveTo(x, y);
    else velocityGraphCtx.lineTo(x, y);
  }
  velocityGraphCtx.stroke();

  velocityGraphCtx.strokeStyle = "green";
  velocityGraphCtx.beginPath();
  for (let i = 0; i < step; i++) {
    const vy = path[i].vy;
    const x = (i / path.length) * velocityGraph.width;
    const y = midY - (vy / maxY) * midY;
    if (i === 0) velocityGraphCtx.moveTo(x, y);
    else velocityGraphCtx.lineTo(x, y);
  }
  velocityGraphCtx.stroke();

  velocityGraphCtx.strokeStyle = "blue";
  velocityGraphCtx.beginPath();
  for (let i = 0; i < step; i++) {
    const vx = path[i].vx;
    const x = (i / path.length) * velocityGraph.width;
    const y = midY - (vx / maxY) * midY;
    if (i === 0) velocityGraphCtx.moveTo(x, y);
    else velocityGraphCtx.lineTo(x, y);
  }
  velocityGraphCtx.stroke();
}

function drawForcesGraph() {
  forcesGraphCtx.clearRect(0, 0, forcesGraph.width, forcesGraph.height);

  const path = simulation.ball.path;
  let maxAbsForce = 0;

  for (let i = 0; i < step; i++) {
    const p = path[i];
    const v = Math.sqrt(p.vx ** 2 + p.vy ** 2);

    const dragMag = simulation.drag * v * v;

    const dragX = -simulation.drag * v * p.vx;
    const dragY = -simulation.drag * v * p.vy;

    const gravityX = 0;
    const gravityY = -simulation.g;

    const netX = dragX + gravityX;
    const netY = dragY + gravityY;
    const netMag = Math.sqrt(netX ** 2 + netY ** 2);

    maxAbsForce = Math.max(maxAbsForce, dragMag, simulation.g, netMag);
  }

  maxAbsForce = Math.ceil(maxAbsForce / 5) * 5;
  const scale = forcesGraph.height / maxAbsForce;

  // Axis labels
  forcesGraphCtx.fillStyle = "#222";
  forcesGraphCtx.font = "10px Arial";
  forcesGraphCtx.textAlign = "right";
  forcesGraphCtx.fillText(`${maxAbsForce} N`, forcesGraph.width - 2, 10);
  forcesGraphCtx.fillText(`0`, forcesGraph.width - 2, forcesGraph.height - 2);

  // Drag Force Magnitude (Orange)
  forcesGraphCtx.strokeStyle = "orange";
  forcesGraphCtx.beginPath();
  for (let i = 0; i < step; i++) {
    const p = path[i];
    const v = Math.sqrt(p.vx ** 2 + p.vy ** 2);
    const dragMag = simulation.drag * v * v;
    const x = (i / path.length) * forcesGraph.width;
    const y = forcesGraph.height - dragMag * scale;
    if (i === 0) forcesGraphCtx.moveTo(x, y);
    else forcesGraphCtx.lineTo(x, y);
  }
  forcesGraphCtx.stroke();

  // Gravity Force Magnitude (Brown) — constant
  const gravityMag = simulation.g;
  forcesGraphCtx.strokeStyle = "brown";
  forcesGraphCtx.beginPath();
  for (let i = 0; i < step; i++) {
    const x = (i / path.length) * forcesGraph.width;
    const y = forcesGraph.height - gravityMag * scale;
    if (i === 0) forcesGraphCtx.moveTo(x, y);
    else forcesGraphCtx.lineTo(x, y);
  }
  forcesGraphCtx.stroke();

  // Net Force Magnitude (Purple)
  forcesGraphCtx.strokeStyle = "purple";
  forcesGraphCtx.beginPath();
  for (let i = 0; i < step; i++) {
    const p = path[i];
    const v = Math.sqrt(p.vx ** 2 + p.vy ** 2);

    const dragX = -simulation.drag * v * p.vx;
    const dragY = -simulation.drag * v * p.vy;

    const gravityX = 0;
    const gravityY = -simulation.g;

    const netX = dragX + gravityX;
    const netY = dragY + gravityY;
    const netMag = Math.sqrt(netX ** 2 + netY ** 2);

    const x = (i / path.length) * forcesGraph.width;
    const y = forcesGraph.height - netMag * scale;
    if (i === 0) forcesGraphCtx.moveTo(x, y);
    else forcesGraphCtx.lineTo(x, y);
  }
  forcesGraphCtx.stroke();
}

let animationId;
let step = 0;

function animate() {
  if (!simulation.running || simulation.paused) return;

  if (step >= simulation.ball.path.length) {
    simulation.running = false;
    step = simulation.ball.path.length - 1;
    simulation.ball.x = simulation.ball.path[step].x;
    simulation.ball.y = simulation.ball.path[step].y;
    draw();
    return;
  }

  simulation.ball.x = simulation.ball.path[step].x;
  simulation.ball.y = simulation.ball.path[step].y;
  simulation.ball.vx = simulation.ball.path[step].vx;
  simulation.ball.vy = simulation.ball.path[step].vy;
  draw();

  step++;
  animationId = requestAnimationFrame(animate);
}

function reset() {
  cancelAnimationFrame(animationId);
  simulation.running = false;
  simulation.paused = false;
  step = 0;
  simulation.ball.x = 0;
  simulation.ball.y = 0;
  draw();
}

runBtn.addEventListener("click", () => {
  cancelAnimationFrame(animationId);
  const currentMaxX = simulation.maxX;
  const currentMaxY = simulation.maxY;
  initSimulation();
  simulation.maxX = currentMaxX;
  simulation.maxY = currentMaxY;
  simulation.scaleX = (width - 60) / simulation.maxX;
  simulation.scaleY = (height - 60) / simulation.maxY;
  simulation.xTickInterval = calculateTickInterval(simulation.maxX / 20);
  simulation.yTickInterval = calculateTickInterval(simulation.maxY / 10);
  simulation.running = true;
  simulation.paused = false;
  step = 0;
  animate();
});

pauseBtn.addEventListener("click", () => {
  simulation.paused = !simulation.paused;
  if (!simulation.paused && simulation.running) {
    animate();
  }
});

resetBtn.addEventListener("click", () => {
  reset();
});

const zoomInBtn = document.getElementById("zoomIn");
const zoomOutBtn = document.getElementById("zoomOut");

zoomInBtn.addEventListener("click", () => {
  zoom(1.2);
});

zoomOutBtn.addEventListener("click", () => {
  zoom(0.8);
});

function zoom(factor) {
  const newMaxX = simulation.maxX / factor;
  const newMaxY = simulation.maxY / factor;
  if (newMaxX < 5 || newMaxX > 1000 || newMaxY < 2 || newMaxY > 500) return;
  simulation.maxX = newMaxX;
  simulation.maxY = newMaxY;
  simulation.scaleX = (width - 60) / simulation.maxX;
  simulation.scaleY = (height - 60) / simulation.maxY;
  simulation.xTickInterval = calculateTickInterval(simulation.maxX / 20);
  simulation.yTickInterval = calculateTickInterval(simulation.maxY / 10);
  draw();
}

window.addEventListener("resize", () => {
  resize();
  if (simulation.ball.path.length > 0) {
    simulation.scaleX = (width - 60) / simulation.maxX;
    simulation.scaleY = (height - 60) / simulation.maxY;
    draw();
  }
});

initSimulation();
reset();