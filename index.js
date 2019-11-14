const canvas = document.querySelector('#draw-canvas');
const ctx = canvas.getContext('2d');

const brushCanvas = document.querySelector('#brush-canvas');
const brushCtx = brushCanvas.getContext('2d');

brushCanvas.width = 50;
brushCanvas.height = 50;

let isDrawing = false;
let brushSize = 6;
let isEraser = false;

let brushPos;

let brushColor = '#FFF';
const colorOptions = ['#FFFFFF', '#CEFF00', '#00FF11', '#FF00E6', '#FF0000', '#00F6FF'];

let graphicTabletModeEnabled = false;

function resizeCanvas() {
    const bufferCanvas = document.createElement('canvas');
    bufferCtx = bufferCanvas.getContext('2d');

    bufferCanvas.width = canvas.width;
    bufferCanvas.height = canvas.height;

    bufferCtx.drawImage(canvas, 0, 0);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(bufferCanvas, 0, 0);
    bufferCanvas.remove();
}

window.addEventListener('resize', resizeCanvas, false);

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

document.addEventListener('keydown', e => {
    if (e.shiftKey) isDrawing = true;

    switch (e.key) {
        case 'p':
            brushSize += 3;
            break;
        case 'm':
            brushSize = Math.max(3, brushSize - 3);
            break;
        case 'e':
            isEraser = !isEraser;
            break;
        case 's':
            const imageData = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');

            const anchor = document.createElement('a');
            anchor.setAttribute('download', 'sketch.png');
            anchor.setAttribute('href', imageData);
            anchor.click();

            break;
        case 'c':
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            break;
        case 'g':
            graphicTabletModeEnabled = !graphicTabletModeEnabled;
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
    isDrawing = false;

    brushPos = undefined;
}, false);

function drawBrush(x, y) {
    ctx.fillStyle = isEraser ? '#000' : brushColor;
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
}

document.addEventListener('mousemove', e => {
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
                    ((gPosDiff ? i : dy / dx * i) || 0) * direction[1] + brushPos[1]
                );
            }
        } else {
            drawBrush(e.pageX, e.pageY);
        }
        
        brushPos = [e.pageX, e.pageY];
    }
});

let lineStart = [0, 0];
canvas.addEventListener('mousedown', e => {
    if (graphicTabletModeEnabled) {
        isDrawing = true;
    } else {
        const x = e.clientX;
        const y = e.clientY;

        ctx.beginPath();
        ctx.moveTo(x, y);

        lineStart = [x, y];
    }
});

canvas.addEventListener('mouseup', e => {
    if (graphicTabletModeEnabled) {
        isDrawing = false;
        brushPos = undefined;
    } else {
        ctx.lineTo(e.clientX, e.clientY);
        ctx.closePath();

        ctx.lineWidth = brushSize;
        ctx.strokeStyle = brushColor;
        ctx.stroke();
    }
});
