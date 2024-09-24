const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth - 20;
canvas.height = window.innerHeight - 100;

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
let selection = null;
let isDraggingSelection = false;

function startDrawing(e) {
    if (tool === 'text') {
        textInput.style.display = 'block';
        textInput.style.left = `${e.offsetX + canvas.offsetLeft}px`;
        textInput.style.top = `${e.offsetY + canvas.offsetTop}px`;
        textInput.style.fontSize = `${fontSize}px`;
        textInput.style.width = 'auto';
        textInput.style.height = 'auto';
        textInput.value = '';
        textInput.focus();
        adjustTextInputSize();
        return;
    }
    if (tool === 'select') {
        drawing = true;
        startX = e.offsetX;
        startY = e.offsetY;
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

    if (tool === 'select') {
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(startX, startY, x - startX, y - startY);
        ctx.setLineDash([]);
        return;
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

function stopDrawing(e) {
    if (!drawing) return;
    drawing = false;
    if (tool === 'select') {
        const x = e.offsetX;
        const y = e.offsetY;
        selection = {
            x: Math.min(startX, x),
            y: Math.min(startY, y),
            width: Math.abs(x - startX),
            height: Math.abs(y - startY),
            imageData: ctx.getImageData(Math.min(startX, x), Math.min(startY, y), Math.abs(x - startX), Math.abs(y - startY))
        };
        ctx.clearRect(selection.x, selection.y, selection.width, selection.height);
        ctx.putImageData(history[history.length - 1], 0, 0);
        return;
    }
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
document.getElementById('select').onclick = () => tool = 'select';

textInput.oninput = adjustTextInputSize;

textInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
        if (e.ctrlKey) {
            textInput.value += '\n';
            adjustTextInputSize();
        } else {
            const lines = textInput.value.split('\n');
            const x = parseInt(textInput.style.left) - canvas.offsetLeft;
            let y = parseInt(textInput.style.top) - canvas.offsetTop + fontSize;
            ctx.font = `${fontSize}px Arial`;
            ctx.fillStyle = currentColor;
            lines.forEach(line => {
                ctx.fillText(line, x, y);
                y += fontSize;
            });
            textInput.style.display = 'none';
            textInput.value = '';
            stopDraggingText(); // 重置拖动状态
            if (history.length >= maxHistory) {
                history.shift();
            }
            history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        }
    }
};

canvas.addEventListener('mousedown', (e) => {
    if (tool === 'select' && selection && isInsideSelection(e.offsetX, e.offsetY)) {
        isDraggingSelection = true;
        offsetX = e.offsetX - selection.x;
        offsetY = e.offsetY - selection.y;
    } else {
        startDrawing(e);
    }
});

canvas.addEventListener('mousemove', throttle((e) => {
    if (isDraggingSelection) {
        moveSelection(e.offsetX - offsetX, e.offsetY - offsetY);
    } else {
        draw(e);
    }
}, 10));

canvas.addEventListener('mouseup', (e) => {
    if (isDraggingSelection) {
        isDraggingSelection = false;
    } else {
        stopDrawing(e);
    }
});

canvas.addEventListener('mouseout', (e) => {
    if (isDraggingSelection) {
        isDraggingSelection = false;
    } else {
        stopDrawing(e);
    }
});

canvas.addEventListener('dblclick', () => {
    if (selection) {
        finalizeSelection();
    }
});

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
    } else if (e.key === 's') {
        tool = 'select';
    } else if (e.key === 'Enter' && selection) {
        finalizeSelection();
    } else if (e.key === 'Backspace' && selection) {
        deleteSelection();
    }
});

function isInsideSelection(x, y) {
    return selection && x >= selection.x && x <= selection.x + selection.width && y >= selection.y && y <= selection.y + selection.height;
}

function moveSelection(x, y) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(history[history.length - 1], 0, 0);
    ctx.putImageData(selection.imageData, x, y);
    selection.x = x;
    selection.y = y;
}

function finalizeSelection() {
    ctx.putImageData(selection.imageData, selection.x, selection.y);
    selection = null;
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

function deleteSelection() {
    ctx.clearRect(selection.x, selection.y, selection.width, selection.height);
    selection = null;
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

textInput.addEventListener('mousedown', startDraggingText);
document.addEventListener('mousemove', dragText);
document.addEventListener('mouseup', stopDraggingText);

history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
