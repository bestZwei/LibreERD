const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth - 20;
canvas.height = window.innerHeight - 100;

let drawing = false;
let tool = 'rectangle';
let startX, startY;
let history = [];
let redoStack = [];

function startDrawing(e) {
    drawing = true;
    startX = e.offsetX;
    startY = e.offsetY;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
}

function draw(e) {
    if (!drawing) return;
    const x = e.offsetX;
    const y = e.offsetY;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(history[history.length - 1], 0, 0);

    switch (tool) {
        case 'rectangle':
            ctx.strokeRect(startX, startY, x - startX, y - startY);
            break;
        case 'rounded-rectangle':
            drawRoundedRect(startX, startY, x - startX, y - startY, 20);
            break;
        case 'ellipse':
            drawEllipse(startX, startY, x - startX, y - startY);
            break;
        case 'diamond':
            drawDiamond(startX, startY, x - startX, y - startY);
            break;
        case 'freeform':
            ctx.lineTo(x, y);
            ctx.stroke();
            break;
        case 'line':
            ctx.lineTo(x, y);
            ctx.stroke();
            break;
        case 'arrow':
            drawArrow(startX, startY, x, y);
            break;
        case 'eraser':
            ctx.clearRect(x - 5, y - 5, 10, 10);
            break;
    }
}

function stopDrawing() {
    if (!drawing) return;
    drawing = false;
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    redoStack = [];
}

function drawRoundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.stroke();
}

function drawEllipse(x, y, width, height) {
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height / 2, Math.abs(width / 2), Math.abs(height / 2), 0, 0, 2 * Math.PI);
    ctx.stroke();
}

function drawDiamond(x, y, width, height) {
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width, y + height / 2);
    ctx.lineTo(x + width / 2, y + height);
    ctx.lineTo(x, y + height / 2);
    ctx.closePath();
    ctx.stroke();
}

function drawArrow(fromX, fromY, toX, toY) {
    const headlen = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

document.getElementById('rectangle').onclick = () => tool = 'rectangle';
document.getElementById('rounded-rectangle').onclick = () => tool = 'rounded-rectangle';
document.getElementById('ellipse').onclick = () => tool = 'ellipse';
document.getElementById('diamond').onclick = () => tool = 'diamond';
document.getElementById('freeform').onclick = () => tool = 'freeform';
document.getElementById('text').onclick = () => {
    const text = prompt('Enter text:');
    if (text) {
        ctx.font = '20px Arial';
        ctx.fillText(text, startX, startY);
        history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }
};
document.getElementById('line').onclick = () => tool = 'line';
document.getElementById('arrow').onclick = () => tool = 'arrow';
document.getElementById('eraser').onclick = () => tool = 'eraser';
document.getElementById('undo').onclick = () => {
    if (history.length > 1) {
        redoStack.push(history.pop());
        ctx.putImageData(history[history.length - 1], 0, 0);
    }
};
document.getElementById('redo').onclick = () => {
    if (redoStack.length > 0) {
        history.push(redoStack.pop());
        ctx.putImageData(history[history.length - 1], 0, 0);
    }
};
document.getElementById('export').onclick = () => {
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = canvas.toDataURL();
    link.click();
};

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
