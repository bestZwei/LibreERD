const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const canvasContainer = document.getElementById('canvas-container');
const resizeHandle = document.getElementById('resize-handle');
canvas.width = window.innerWidth - 40;
canvas.height = window.innerHeight - 140;

let drawing = false;
let tool = 'rectangle';
let startX, startY;
let history = [];
let redoStack = [];
let eraserSize = 10;
let fontSize = 20;
let currentColor = '#000000';
const textInput = document.getElementById('text-input');
let isDraggingText = false;
let offsetX, offsetY;
const maxHistory = 50;
let isDashed = false;
let isResizing = false;
let lastX, lastY;
const minWidth = 100;
const minHeight = 100;

function startDrawing(e) {
    if (tool === 'text') {
        textInput.style.display = 'block';
        textInput.style.left = `${e.clientX}px`;
        textInput.style.top = `${e.clientY}px`;
        textInput.style.fontSize = `${fontSize}px`;
        textInput.style.width = 'auto';
        textInput.style.height = 'auto';
        textInput.value = '';
        textInput.focus();
        adjustTextInputSize();
        return;
    }
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

    if (tool === 'eraser') {
        erase(x, y);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(history[history.length - 1], 0, 0);

    if (isDashed) {
        ctx.setLineDash([5, 5]);
    } else {
        ctx.setLineDash([]);
    }

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
        case 'triangle':
            drawTriangle(startX, startY, x - startX, y - startY);
            break;
        case 'pentagon':
            drawPentagon(startX, startY, x - startX, y - startY);
            break;
        case 'freeform':
            ctx.lineTo(x, y);
            ctx.stroke();
            break;
        case 'line':
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(x, y);
            ctx.stroke();
            break;
        case 'arrow':
            drawArrow(startX, startY, x, y);
            break;
    }
}

function erase(x, y) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, eraserSize / 2, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.restore();
}

function stopDrawing() {
    if (!drawing) return;
    drawing = false;
    if (history.length >= maxHistory) {
        history.shift();
    }
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

function drawTriangle(x, y, width, height) {
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();
    ctx.stroke();
}

function drawPentagon(x, y, width, height) {
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radius = Math.min(width, height) / 2;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (Math.PI / 2) + (i * 2 * Math.PI / 5);
        const px = centerX + radius * Math.cos(angle);
        const py = centerY - radius * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
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

function startDraggingText(e) {
    if (tool === 'text' && textInput.style.display === 'block') {
        isDraggingText = true;
        offsetX = e.clientX - parseInt(textInput.style.left);
        offsetY = e.clientY - parseInt(textInput.style.top);
    }
}

function dragText(e) {
    if (isDraggingText) {
        textInput.style.left = `${e.clientX - offsetX}px`;
        textInput.style.top = `${e.clientY - offsetY}px`;
    }
}

function stopDraggingText() {
    isDraggingText = false;
}

function adjustTextInputSize() {
    textInput.style.height = 'auto';
    textInput.style.width = 'auto';
    textInput.style.height = textInput.scrollHeight + 'px';
    textInput.style.width = textInput.scrollWidth + 'px';
}

function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function(...args) {
        const context = this;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function() {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}

function startResizing(e) {
    isResizing = true;
    lastX = e.clientX;
    lastY = e.clientY;
}

function resizeCanvas(e) {
    if (!isResizing) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const newWidth = canvas.width + dx;
    const newHeight = canvas.height + dy;

    if (newWidth >= minWidth && newHeight >= minHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        canvasContainer.style.width = `${canvas.width}px`;
        canvasContainer.style.height = `${canvas.height}px`;
        lastX = e.clientX;
        lastY = e.clientY;
        ctx.putImageData(history[history.length - 1], 0, 0);
    }
}

function stopResizing() {
    isResizing = false;
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    history = [];
    redoStack = [];
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

document.getElementById('shape-select').onchange = (e) => tool = e.target.value;
document.getElementById('freeform').onclick = () => tool = 'freeform';
document.getElementById('text').onclick = () => tool = 'text';
document.getElementById('font-size').onchange = (e) => fontSize = parseInt(e.target.value);
document.getElementById('line').onclick = () => tool = 'line';
document.getElementById('arrow').onclick = () => tool = 'arrow';
document.getElementById('eraser').onclick = () => {
    tool = 'eraser';
    canvas.style.cursor = 'crosshair';
};
document.getElementById('eraser-size').onchange = (e) => eraserSize = parseInt(e.target.value);
document.getElementById('color-picker').onchange = (e) => {
    currentColor = e.target.value;
    ctx.strokeStyle = currentColor;
    ctx.fillStyle = currentColor;
};
document.getElementById('dashed-line').onchange = (e) => isDashed = e.target.checked;
document.getElementById('clear').onclick = clearCanvas;
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
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');

    if (document.getElementById('background-color').checked) {
        exportCtx.fillStyle = 'white';
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }

    exportCtx.drawImage(canvas, 0, 0);
    link.href = exportCanvas.toDataURL();
    link.click();
};

textInput.oninput = adjustTextInputSize;

textInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
        const x = parseInt(textInput.style.left) - canvasContainer.offsetLeft;
        const y = parseInt(textInput.style.top) - canvasContainer.offsetTop;
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = currentColor;
        ctx.fillText(textInput.value, x, y + fontSize);
        textInput.style.display = 'none';
        textInput.value = '';
        stopDraggingText();
        if (history.length >= maxHistory) {
            history.shift();
        }
        history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }
};

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', throttle(draw, 10));
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

textInput.addEventListener('mousedown', startDraggingText);
document.addEventListener('mousemove', dragText);
document.addEventListener('mouseup', stopDraggingText);

resizeHandle.addEventListener('mousedown', startResizing);
document.addEventListener('mousemove', resizeCanvas);
document.addEventListener('mouseup', stopResizing);

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') {
        document.getElementById('undo').click();
    } else if (e.ctrlKey && e.key === 'y') {
        document.getElementById('redo').click();
    } else if (e.key === 'f') {
        tool = 'freeform';
    } else if (e.key === 't') {
        tool = 'text';
    } else if (e.key === 'l') {
        tool = 'line';
    } else if (e.key === 'a') {
        tool = 'arrow';
    } else if (e.key === 'e') {
        tool = 'eraser';
    }
});

history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
