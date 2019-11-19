const canvas = document.querySelector('#draw-canvas');
const ctx = canvas.getContext('2d');

const brushCanvas = document.querySelector('#brush-canvas');
const brushCtx = brushCanvas.getContext('2d');

brushCanvas.width = 50;
brushCanvas.height = 50;

let isDrawing = false;
let brushSize = 4;
let pressureWeight = 1;
let isEraser = false;
let isWritingBrush = false;

let brushPos;

let brushColor = '#FFF';
const colorOptions = ['#FFFFFF', '#CEFF00', '#00FF11', '#FF00E6', '#FF0000', '#00F6FF'];

let graphicTabletModeEnabled = false;

let snapshots = [];
let currentSnapshot = -1;

let maxSnapshots = 50;

let canvasHeight = window.innerHeight;
let canvasWidth = window.innerWidth;

function resizeCanvas() {
    const bufferCanvas = document.createElement('canvas');
    bufferCtx = bufferCanvas.getContext('2d');

    bufferCanvas.width = canvas.width;
    bufferCanvas.height = canvas.height;

    bufferCtx.drawImage(canvas, 0, 0);

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(bufferCanvas, 0, 0);
    bufferCanvas.remove();
}

window.addEventListener('resize', () => {
    resizeCanvas(
        Math.max(window.innerWidth, canvasWidth),
        Math.max(window.innerHeight, canvasHeight)
    );
}, false);

window.addEventListener('scroll', () => {
    canvasWidth += Math.max(0, window.innerWidth + window.scrollX - canvasWidth);
    canvasHeight += Math.max(0, window.innerHeight + window.scrollY - canvasHeight);

    resizeCanvas();
}, false);

resizeCanvas();

function drawBrushPreview() {
    const bcWidth = brushCanvas.width;
    const bcHeight = brushCanvas.height;

    brushCtx.clearRect(0, 0, bcWidth, bcHeight);

    brushCtx.beginPath();
    brushCtx.arc(bcWidth / 2, bcHeight / 2, brushSize, 0, 2 * Math.PI);
    brushCtx.closePath();

    if (isEraser) {
        brushCtx.strokeStyle = isEraser ? brushColor : '#000';
        brushCtx.stroke();
    } else {
        brushCtx.fillStyle = isEraser ? '#000' : brushColor;
        brushCtx.fill();
    }
}
drawBrushPreview();

function makeSnapshot() {
    const bufferCanvas = document.createElement('canvas');
    bufferCtx = bufferCanvas.getContext('2d');

    bufferCanvas.width = canvas.width;
    bufferCanvas.height = canvas.height;

    bufferCtx.drawImage(canvas, 0, 0);

    snapshots.splice(currentSnapshot + 1, snapshots.length, bufferCanvas);

    if (currentSnapshot + 1 > maxSnapshots) {
        snapshots.shift();
    }

    currentSnapshot = Math.min(currentSnapshot + 1, maxSnapshots);
}
makeSnapshot();

function moveToRelativeSnapshot(dS) {
    let relativeSnap = currentSnapshot + dS;
    if (relativeSnap < snapshots.length && relativeSnap >= 0) {
        currentSnapshot += dS;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(snapshots[currentSnapshot], 0, 0);
    }
}

document.addEventListener('keydown', e => {
    if (e.shiftKey) isDrawing = true;

    switch (e.key) {
        case 'p':
            brushSize += 2;
            break;
        case 'm':
            brushSize = Math.max(2, brushSize - 2);
            break;
        case '[':
            pressureWeight -= 1;
            break;
        case ']':
            pressureWeight = Math.max(0, pressureWeight + 1);
            break;
        case 'e':
            isEraser = !isEraser;
            break;
        case 's':
            const imageData = canvas.toDataURL('image/jpeg').replace('image/jpeg', 'image/octet-stream');

            const anchor = document.createElement('a');
            anchor.setAttribute('download', 'sketch.jpg');
            anchor.setAttribute('href', imageData);
            anchor.click();

            break;
        case 'c':
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            break;
        case 'g':
            graphicTabletModeEnabled = !graphicTabletModeEnabled;
            break;
        case 'w':
            isWritingBrush = !isWritingBrush;
            break;
        case 'u':
            moveToRelativeSnapshot(-1);
            break;
        case 'r':
            moveToRelativeSnapshot(1);
            break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
            brushColor = colorOptions[(e.key | 0) - 1];
            break;
    }

    drawBrushPreview();
}, false);

document.addEventListener('keyup', () => {
    if (isDrawing) {
        makeSnapshot();
    }

    isDrawing = false;
    brushPos = undefined;
}, false);

function drawBrush(x, y, adjustedBrushSize) {
    ctx.fillStyle = isEraser ? '#000' : brushColor;

    ctx.beginPath();
    if (isWritingBrush) {
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + adjustedBrushSize);
        ctx.lineTo(x + adjustedBrushSize, y);
        ctx.lineTo(x + adjustedBrushSize, y - adjustedBrushSize);
    } else {
        ctx.arc(x, y, adjustedBrushSize, 0, 2 * Math.PI);
    }
    ctx.closePath();
    ctx.fill();
}

document.addEventListener('pointermove', e => {
    if (isDrawing) {
        if (brushPos) {
            const dx = Math.abs(e.pageX - brushPos[0]);
            const dy = Math.abs(e.pageY - brushPos[1]);

            const gPosDiff = dx > dy ? 0 : 1;

            const direction = [
                Math.min(e.pageX - brushPos[0], 0) ? -1 : 1,
                Math.min(e.pageY - brushPos[1], 0) ? -1 : 1,
            ];

            for (let i = 0; i < [dx, dy][gPosDiff]; i++) {
                drawBrush(
                    ((gPosDiff ? dx / dy * i : i) || 0) * direction[0] + brushPos[0],
                    ((gPosDiff ? i : dy / dx * i) || 0) * direction[1] + brushPos[1],
                    brushSize + Math.pow(brushSize * e.pressure, 1 + pressureWeight)
                );
            }
        } else {
            drawBrush(
                e.pageX,
                e.pageY,
                brushSize + Math.pow(brushSize * e.pressure, 1 + pressureWeight)
            );
        }
        
        brushPos = [e.pageX, e.pageY];
    }
});

canvas.addEventListener('mousedown', e => {
    if (graphicTabletModeEnabled) {
        isDrawing = true;
    } else {
        const x = e.pageX;
        const y = e.pageY;

        ctx.beginPath();
        ctx.moveTo(x, y);
    }
});

canvas.addEventListener('mouseup', e => {
    if (graphicTabletModeEnabled) {
        isDrawing = false;
        brushPos = undefined;
    } else {
        ctx.lineTo(e.pageX, e.pageY);
        ctx.closePath();

        ctx.lineWidth = brushSize;
        ctx.strokeStyle = brushColor;
        ctx.stroke();

    }
    makeSnapshot();
});
