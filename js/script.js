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

let isSelecting = false;
let selectionStartX, selectionStartY;
let selectionRect = document.createElement('div');
selectionRect.id = 'selection-rect';
document.body.appendChild(selectionRect);

let selectedArea = null;
let isDraggingSelection = false;
let selectionOffsetX, selectionOffsetY;

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
    } else if (tool === 'select') {
        isSelecting = true;
        selectionStartX = e.offsetX;
        selectionStartY = e.offsetY;
        selectionRect.style.left = `${selectionStartX}px`;
        selectionRect.style.top = `${selectionStartY}px`;
        selectionRect.style.width = '0px';
        selectionRect.style.height = '0px';
        selectionRect.style.display = 'block';
    } else {
        drawing = true;
        startX = e.offsetX;
        startY = e.offsetY;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
    }
}

function draw(e) {
    if (tool === 'select' && isSelecting) {
        const x = e.offsetX;
        const y = e.offsetY;
        selectionRect.style.width = `${x - selectionStartX}px`;
        selectionRect.style.height = `${y - selectionStartY}px`;
    } else if (tool !== 'select' && drawing) {
        const x = e.offsetX;
        const y = e.offsetY;

        if (tool === 'eraser') {
            erase(x, y);
            return;
        }

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
}

function stopDrawing(e) {
    if (tool === 'select' && isSelecting) {
        isSelecting = false;
        const width = parseInt(selectionRect.style.width);
        const height = parseInt(selectionRect.style.height);
        if (width > 0 && height > 0) {
            selectedArea = {
                x: selectionStartX,
                y: selectionStartY,
                width: width,
                height: height,
                data: ctx.getImageData(selectionStartX, selectionStartY, width, height)
            };
            canvas.addEventListener('mousedown', startDraggingSelection);
        } else {
            selectionRect.style.display = 'none';
            selectedArea = null;
        }
    } else if (tool !== 'select' && drawing) {
        drawing = false;
        if (history.length >= maxHistory) {
            history.shift();
        }
        history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        redoStack = [];
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

function startDraggingSelection(e) {
    if (selectedArea && e.offsetX >= selectedArea.x && e.offsetX <= selectedArea.x + selectedArea.width &&
        e.offsetY >= selectedArea.y && e.offsetY <= selectedArea.y + selectedArea.height) {
        isDraggingSelection = true;
        selectionOffsetX = e.offsetX - selectedArea.x;
        selectionOffsetY = e.offsetY - selectedArea.y;
    }
}

function dragSelection(e) {
    if (isDraggingSelection) {
        selectedArea.x = e.offsetX - selectionOffsetX;
        selectedArea.y = e.offsetY - selectionOffsetY;
        selectionRect.style.left = `${selectedArea.x}px`;
        selectionRect.style.top = `${selectedArea.y}px`;
        redrawCanvas();
    }
}

function stopDraggingSelection() {
    isDraggingSelection = false;
}

function confirmSelection() {
    if (selectedArea) {
        ctx.putImageData(selectedArea.data, selectedArea.x, selectedArea.y);
        selectionRect.style.display = 'none';
        selectedArea = null;
        canvas.removeEventListener('mousedown', startDraggingSelection);
        history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        redoStack = [];
    }
}

function deleteSelection() {
    if (selectedArea) {
        selectionRect.style.display = 'none';
        selectedArea = null;
        canvas.removeEventListener('mousedown', startDraggingSelection);
        redrawCanvas();
        history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        redoStack = [];
    }
}

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(history[history.length - 1], 0, 0);
    if (selectedArea) {
        ctx.putImageData(selectedArea.data, selectedArea.x, selectedArea.y);
        selectionRect.style.left = `${selectedArea.x}px`;
        selectionRect.style.top = `${selectedArea.y}px`;
        selectionRect.style.width = `${selectedArea.width}px`;
        selectionRect.style.height = `${selectedArea.height}px`;
    }
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
            stopDraggingText();
            if (history.length >= maxHistory) {
                history.shift();
            }
            history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        }
    }
};

document.getElementById('select').onclick = () => {
    tool = 'select';
    canvas.style.cursor = 'crosshair';
};

canvas.addEventListener('dblclick', confirmSelection);

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
    }
    if (selectedArea && e.key === 'Enter') {
        confirmSelection();
    }
    if (selectedArea && e.key === 'Backspace') {
        deleteSelection();
    }
});

canvas.addEventListener('mousedown', startDraggingSelection);
document.addEventListener('mousemove', dragSelection);
document.addEventListener('mouseup', stopDraggingSelection);

history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
