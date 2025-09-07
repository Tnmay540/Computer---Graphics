var gl;
var color;
var matrixStack = [];
var mMatrix = mat4.create();
var uMMatrixLocation;

var aPositionLocation;
var uColorLoc;

var animation;
var t = 0;
var scale = 1.0;
let translationX = 0.0;
let translationX2 = 0.0;
const translationSpeed = 0.001;
const translationRange = 0.7;
const translationRange2 = 0.8;
let direction = 1;
let direction2 = 1;
let rotationAngle = 0.0;
const rotationSpeed = 0.01;
const numSegments = 100;
const angleIncrement = (Math.PI * 2) / numSegments;

var mode = 's';

const vertexShaderCode = `#version 300 es
in vec2 aPosition;
uniform mat4 uMMatrix;

void main() {
    gl_Position = uMMatrix*vec4(aPosition,0.0,1.0);
    gl_PointSize = 5.0;
}`;

const fragShaderCode = `#version 300 es
precision mediump float;
out vec4 fragColor;
uniform vec4 color;

void main() {
    fragColor = color;
}`;

function pushMatrix(stack, m) {
    var copy = mat4.create(m);
    stack.push(copy);
}

function popMatrix(stack) {
    if (stack.length > 0) return stack.pop();
    else console.log("stack has no matrix to pop!");
}

function degToRad(degrees) {
    return (degrees * Math.PI) / 180;
}

function vertexShaderSetup(vertexShaderCode) {
    shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(shader, vertexShaderCode);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function fragmentShaderSetup(fragShaderCode) {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, fragShaderCode);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function initShaders() {
    shaderProgram = gl.createProgram();
    var vertexShader = vertexShaderSetup(vertexShaderCode);
    var fragmentShader = fragmentShaderSetup(fragShaderCode);
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log(gl.getShaderInfoLog(vertexShader));
        console.log(gl.getShaderInfoLog(fragmentShader));
    }
    gl.useProgram(shaderProgram);

    return shaderProgram;
}

function initGL(canvas) {
    try {
        gl = canvas.getContext("webgl2"); 
        gl.viewportWidth = canvas.width; 
        gl.viewportHeight = canvas.height; 
    } catch (e) {}
    if (!gl) {
        alert("WebGL initialization failed");
    }
}

function initSquareBuffer() {
    const sqVertices = new Float32Array([
        0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
    ]);
    sqVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sqVertices, gl.STATIC_DRAW);
    sqVertexPositionBuffer.itemSize = 2;
    sqVertexPositionBuffer.numItems = 4;
    const sqIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);
    sqVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sqIndices, gl.STATIC_DRAW);
    sqVertexIndexBuffer.itemsize = 1;
    sqVertexIndexBuffer.numItems = 6;
}

function drawSquare(color, mMatrix) {
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
    gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
    gl.vertexAttribPointer(aPositionLocation, sqVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);
    gl.uniform4fv(uColorLoc, color);
    if (mode === 's') {
        gl.drawElements(gl.TRIANGLES, sqVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'w') {
        gl.drawElements(gl.LINE_LOOP, sqVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'p') {
        gl.drawElements(gl.POINTS, sqVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }    
}
function initTriangleBuffer() {
    const triangleVertices = new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]);
    triangleBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
    triangleBuf.itemSize = 2;
    triangleBuf.numItems = 3;
    const triangleIndices = new Uint16Array([0, 1, 2]);
    triangleIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleIndices, gl.STATIC_DRAW);
    triangleIndexBuf.itemsize = 1;
    triangleIndexBuf.numItems = 3;
}

function drawTriangle(color, mMatrix) {
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
    gl.vertexAttribPointer(aPositionLocation, triangleBuf.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);
    gl.uniform4fv(uColorLoc, color);
    if (mode === 's') {
        gl.drawElements(gl.TRIANGLES, triangleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'w') {
        gl.drawElements(gl.LINE_LOOP, triangleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'p') {
        gl.drawElements(gl.POINTS, triangleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
}
function initCircleBuffer() {
    const positions = [0, 0]; 
    for (let i = 0; i < numSegments; i++) {
      const angle = angleIncrement * i;
      const x = Math.cos(angle);
      const y = Math.sin(angle);
      positions.push(x, y);
    }

    const circleVertices = new Float32Array(positions);
    circleBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
    gl.bufferData(gl.ARRAY_BUFFER, circleVertices, gl.STATIC_DRAW);
    circleBuf.itemSize = 2;
    circleBuf.numItems = numSegments + 1;
    const indices = [0, 1, numSegments];
    for (let i = 0; i < numSegments; i++) {
      indices.push(0, i, i + 1);
    }
    const circleIndices = new Uint16Array(indices);
    circleIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, circleIndices, gl.STATIC_DRAW);
    circleIndexBuf.itemsize = 1;
    circleIndexBuf.numItems = indices.length;
}

function drawCircle(color, mMatrix) {
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
    gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
    gl.vertexAttribPointer(aPositionLocation, circleBuf.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
    gl.uniform4fv(uColorLoc, color);
    if (mode === 's') {
        gl.drawElements(gl.TRIANGLES, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'w') {
        gl.drawElements(gl.LINE_LOOP, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'p') {
        gl.drawElements(gl.POINTS, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
}
function initRayBuffer() {
    const positions = [0, 0];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2) * i / 8;
      const x = Math.cos(angle);
      const y = Math.sin(angle);
      positions.push(x, y);
    }
    const rayVertices = new Float32Array(positions);
    rayBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rayBuf);
    gl.bufferData(gl.ARRAY_BUFFER, rayVertices, gl.STATIC_DRAW);
    rayBuf.itemSize = 2;
    rayBuf.numItems = 9;
    const indices = [];
    for (let i = 0; i < 8; i++) {
      indices.push(0, i+1);
    }
    const rayIndices = new Uint16Array(indices);
    rayIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rayIndexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, rayIndices, gl.STATIC_DRAW);
    rayIndexBuf.itemsize = 1;
    rayIndexBuf.numItems = indices.length;
}

function drawRays(color, mMatrix) {
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
    gl.bindBuffer(gl.ARRAY_BUFFER, rayBuf);
    gl.vertexAttribPointer(aPositionLocation, rayBuf.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rayIndexBuf);
    gl.uniform4fv(uColorLoc, color);
    if (mode === 'p') {
        gl.drawElements(gl.POINTS, rayIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else {
        gl.drawElements(gl.LINE_STRIP, rayIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
}
function initFanBladesBuffer() {
    const positions = [0, 0];
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2) * i / 16;
      const x = Math.cos(angle);
      const y = Math.sin(angle);
      positions.push(x, y);
    }
    const bladeVertices = new Float32Array(positions);
    bladeBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bladeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, bladeVertices, gl.STATIC_DRAW);
    bladeBuf.itemSize = 2;
    bladeBuf.numItems = 9;
    const indices = [];
    for (let i = 1; i < 16; i=i+4) {
      indices.push(0, i, i+1);
    }
    const bladeIndices = new Uint16Array(indices);
    bladeIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bladeIndexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bladeIndices, gl.STATIC_DRAW);
    bladeIndexBuf.itemsize = 1;
    bladeIndexBuf.numItems = indices.length;
}

function drawFanBlades(color, mMatrix) {
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
    gl.bindBuffer(gl.ARRAY_BUFFER, bladeBuf);
    gl.vertexAttribPointer(aPositionLocation, bladeBuf.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bladeIndexBuf);
    gl.uniform4fv(uColorLoc, color);
    if (mode === 's') {
        gl.drawElements(gl.TRIANGLE_FAN, bladeIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'w') {
        gl.drawElements(gl.LINE_LOOP, bladeIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'p') {
        gl.drawElements(gl.POINTS, bladeIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
}

function drawSky() {
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1];
    mMatrix = mat4.translate(mMatrix, [0.0, 0.6, 0]);
    mMatrix = mat4.scale(mMatrix, [3.0, 1.2, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

function drawSun(rotationAngle) {
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [1, 1,1, 1];
    mMatrix = mat4.translate(mMatrix, [-0.7, 0.84, 0]);
    mMatrix = mat4.scale(mMatrix, [0.1, 0.1, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.7, 0.84, 0]);
    mMatrix = mat4.scale(mMatrix, [0.15, 0.15, 1.0]);
    mMatrix = mat4.rotate(mMatrix, rotationAngle, [0, 0, 1]);
    drawRays(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

function drawCloud() {
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0.6, 0.6, 0.6, 1.0];
    mMatrix = mat4.translate(mMatrix, [-0.8, 0.55, 0]);
    mMatrix = mat4.scale(mMatrix, [0.25, 0.13, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    color = [1.0, 1.0, 1.0, 1.0];
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.55, 0.52, 0]);
    mMatrix = mat4.scale(mMatrix, [0.2, 0.09, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    color = [0.7, 0.7, 0.7, 1.0];
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.3, 0.52, 0]);
    mMatrix = mat4.scale(mMatrix, [0.1, 0.05, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

function drawStar(center_x, center_y, baseSize, twinkleScale = 1.0) {
    let size = baseSize * twinkleScale;
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [1.0, 1.0, 1.0, 1.0]; 
    mMatrix = mat4.translate(mMatrix, [center_x, center_y, 0]);
    mMatrix = mat4.scale(mMatrix, [size * 0.4, size * 0.4, 1.0]); 
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    for (let i = 0; i < 4; i++) {
        mat4.identity(mMatrix);
        pushMatrix(matrixStack, mMatrix);
        mMatrix = mat4.translate(mMatrix, [center_x, center_y, 0]);
        mMatrix = mat4.rotate(mMatrix, i * Math.PI / 2, [0, 0, 1]); 
        mMatrix = mat4.translate(mMatrix, [0, size * 0.4, 0]);
        mMatrix = mat4.scale(mMatrix, [size * 0.5, size, 1.0]);   
        drawTriangle(color, mMatrix);
        mMatrix = popMatrix(matrixStack);
    }
}
function drawMountain(t_x1, t_y1, s_x, s_y, t_x2 = 0, t_y2 = 0, single = false) {
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0.482,0.369,0.275, 1.0];
    if (single) color = [0.569,0.475,0.341, 1.0];

    mMatrix = mat4.translate(mMatrix, [t_x1, t_y1, 0]);
    mMatrix = mat4.scale(mMatrix, [s_x, s_y, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    if (!single) {
        pushMatrix(matrixStack, mMatrix);
        color = [0.569,0.475,0.341, 1.0];
        mMatrix = mat4.translate(mMatrix, [t_x2, t_y2, 0]);
        mMatrix = mat4.rotate(mMatrix, 6.5, [0, 0, 1]);
        mMatrix = mat4.scale(mMatrix, [s_x, s_y, 1.0]);
        drawTriangle(color, mMatrix);
        mMatrix = popMatrix(matrixStack);
    }
}

function drawGround() {
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0.000,0.878,0.455, 0.7];
    mMatrix = mat4.translate(mMatrix, [0.0, -0.6, 0]);
    mMatrix = mat4.scale(mMatrix, [3.0, 1.2, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}
function drawLines(move = false, x = 0, y = 0) {
    mat4.identity(mMatrix);
    if (move) {
        mMatrix = mat4.translate(mMatrix, [x, y, 0]);
    }
    pushMatrix(matrixStack, mMatrix);
    color = [0.9, 0.9, 0.9, 0.8];
    mMatrix = mat4.translate(mMatrix, [-0.7, -0.19, 0]);
    mMatrix = mat4.rotate(mMatrix, 4.71, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.003, 0.4, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}
function drawRiver() {
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0.8, 0.8];
    mMatrix = mat4.translate(mMatrix, [0.0, -0.17, 0]);
    mMatrix = mat4.scale(mMatrix, [3.0, 0.25, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    drawLines();
    drawLines(true, 0.85, 0.1);
    drawLines(true, 1.5, -0.06);
}

function drawRoad() {
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0.357,0.659,0.180, 0.9];
    mMatrix = mat4.translate(mMatrix, [0.6, -0.8, 0]);
    mMatrix = mat4.rotate(mMatrix, 7.2, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [1.6, 2, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}
function drawTrees(move = false, t_x = 0, t_y= 0, s_x = 0, s_y = 0) {
    mat4.identity(mMatrix);
    if (move) {
        mMatrix = mat4.translate(mMatrix, [t_x, t_y, 0]);
        mMatrix = mat4.scale(mMatrix, [s_x, s_y, 0]);
    }
    pushMatrix(matrixStack, mMatrix);
    color = [0.455,0.267,0.263, 1.0];
    mMatrix = mat4.translate(mMatrix, [0.55, 0.14, 0]);
    mMatrix = mat4.scale(mMatrix, [0.04, 0.33, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [0.000,0.553,0.267, 0.9];
    mMatrix = mat4.translate(mMatrix, [0.55, 0.45, 0]);
    mMatrix = mat4.scale(mMatrix, [0.35, 0.3, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [0.259,0.663,0.267, 0.9];
    mMatrix = mat4.translate(mMatrix, [0.55, 0.5, 0]);
    mMatrix = mat4.scale(mMatrix, [0.375, 0.3, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [0.357,0.769,0.263, 0.9];
    mMatrix = mat4.translate(mMatrix, [0.55, 0.55, 0]);
    mMatrix = mat4.scale(mMatrix, [0.4, 0.3, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}
function drawBoat1(translationX) {
    mat4.identity(mMatrix);
    mMatrix = mat4.translate(mMatrix, [translationX, 0., 0]);
    pushMatrix(matrixStack, mMatrix);
    color = [0.83, 0.83, 0.83, 1];
    mMatrix = mat4.translate(mMatrix, [0, -0.15, 0]);
    mMatrix = mat4.scale(mMatrix, [0.18, 0.06, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.09, -0.15, 0]);
    mMatrix = mat4.rotate(mMatrix, -3.15, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.1, 0.06, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.09, -0.15, 0]);
    mMatrix = mat4.rotate(mMatrix, -3.15, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.1, 0.06, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1.0];
    mMatrix = mat4.translate(mMatrix, [0.01, 0.006, 0]);
    mMatrix = mat4.scale(mMatrix, [0.01, 0.25, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1.0];
    mMatrix = mat4.translate(mMatrix, [-0.03, -0.01, 0]);
    mMatrix = mat4.rotate(mMatrix, 5.9, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.005, 0.23, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [1, 0, 0, 0.9];
    mMatrix = mat4.translate(mMatrix, [0.115, 0.006, 0]);
    mMatrix = mat4.rotate(mMatrix, 4.72, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.2, 0.2, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

function drawBoat2(translationX) {
    let boatPosition = [0.0, 0.0]; 
    let boatScale    = [0.5, 0.5];  
    let boatRotation = 0.0;          
    mat4.identity(mMatrix);
    mMatrix = mat4.translate(mMatrix, [translationX + boatPosition[0], boatPosition[1], 0]);
    mMatrix = mat4.rotate(mMatrix, boatRotation, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [boatScale[0], boatScale[1], 1]);
    pushMatrix(matrixStack, mMatrix);
    color = [0.83, 0.83, 0.83, 1];
    mMatrix = mat4.translate(mMatrix, [0, -0.15, 0]);
    mMatrix = mat4.scale(mMatrix, [0.18, 0.06, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.09, -0.15, 0]);
    mMatrix = mat4.rotate(mMatrix, -3.15, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.1, 0.06, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [0.09, -0.15, 0]);
    mMatrix = mat4.rotate(mMatrix, -3.15, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.1, 0.06, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1.0];
    mMatrix = mat4.translate(mMatrix, [0.01, 0.006, 0]);
    mMatrix = mat4.scale(mMatrix, [0.01, 0.25, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1.0];
    mMatrix = mat4.translate(mMatrix, [-0.03, -0.01, 0]);
    mMatrix = mat4.rotate(mMatrix, 5.9, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.005, 0.23, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [0.459,0.177,0.584, 0.9];
    mMatrix = mat4.translate(mMatrix, [0.115, 0.006, 0]);
    mMatrix = mat4.rotate(mMatrix, 4.72, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.2, 0.2, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

function drawFan(rotationAngle, move = false, t_x = 0,t_y = 0, fanScale = [1.0, 1.0]) {
    mat4.identity(mMatrix);

    if (move) {
        mMatrix = mat4.translate(mMatrix, [t_x, t_y, 0]);
    }
    mMatrix = mat4.scale(mMatrix, [fanScale[0], fanScale[1], 1]);
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1.0];
    mMatrix = mat4.translate(mMatrix, [0.7, -0.25, 0]);
    mMatrix = mat4.scale(mMatrix, [0.03, 0.55, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [0.8, 0.75, 0, 1];
    mMatrix = mat4.translate(mMatrix, [0.7, 0.06, 0]);
    mMatrix = mat4.scale(mMatrix, [0.2, 0.2, 1.0]);
    mMatrix = mat4.rotate(mMatrix, rotationAngle, [0, 0, 1]);
    drawFanBlades(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1];
    mMatrix = mat4.translate(mMatrix, [0.7, 0.053, 0]);
    mMatrix = mat4.scale(mMatrix, [0.03, 0.03, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}


function drawBush(move=false, t_x=0, t_y=0, s=0) {
    mat4.identity(mMatrix);
    if (move) {
        mMatrix = mat4.translate(mMatrix, [t_x, t_y, 0]);
        mMatrix = mat4.scale(mMatrix, [s, s, 0]);
    }
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0.7, 0, 0.9];
    mMatrix = mat4.translate(mMatrix, [-1, -0.55, 0]);
    mMatrix = mat4.scale(mMatrix, [0.075, 0.055, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0.4, 0, 0.9];
    mMatrix = mat4.translate(mMatrix, [-0.72, -0.55, 0]);
    mMatrix = mat4.scale(mMatrix, [0.07, 0.05, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0.51, 0, 0.9]
    mMatrix = mat4.translate(mMatrix, [-0.86, -0.53, 0]);
    mMatrix = mat4.scale(mMatrix, [0.13, 0.09, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

function drawHouse() {
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0.9, 0, 0, 1];
    mMatrix = mat4.translate(mMatrix, [-0.55, -0.3, 0]);
    mMatrix = mat4.scale(mMatrix, [0.4, 0.2, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.75, -0.3, 0]);
    mMatrix = mat4.rotate(mMatrix, 6.285, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.25, 0.2, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.35, -0.3, 0]);
    mMatrix = mat4.rotate(mMatrix, 6.285, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.25, 0.2, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [0.83, 0.83, 0.83, 1];
    mMatrix = mat4.translate(mMatrix, [-0.55, -0.525, 0]);
    mMatrix = mat4.scale(mMatrix, [0.5, 0.25, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [0.85, 0.7, 0, 0.9];
    mMatrix = mat4.translate(mMatrix, [-0.7, -0.47, 0]);
    mMatrix = mat4.scale(mMatrix, [0.08, 0.08, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.4, -0.47, 0]);
    mMatrix = mat4.scale(mMatrix, [0.08, 0.08, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.55, -0.56, 0]);
    mMatrix = mat4.scale(mMatrix, [0.08, 0.18, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}


function drawWheel(move = false, t_x = 0) {
    mat4.identity(mMatrix);
    if (move) {
        mMatrix = mat4.translate(mMatrix, [t_x, 0, 0]);
    }
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1];
    mMatrix = mat4.translate(mMatrix, [-0.63, -0.87, 0]);
    mMatrix = mat4.scale(mMatrix, [0.04, 0.04, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    color = [0.51, 0.51, 0.51, 1];
    mMatrix = mat4.translate(mMatrix, [-0.63, -0.87, 0]);
    mMatrix = mat4.scale(mMatrix, [0.03, 0.03, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

function drawCar() {
    mat4.identity(mMatrix);
    color = [0.000, 0.000, 0.502, 0.65];
    pushMatrix(matrixStack, mMatrix);
    mmMatrix = mat4.translate(mMatrix, [-0.5, -0.74, 0]);
    mMatrix = mat4.scale(mMatrix, [0.17, 0.1, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    color = [0.8, 0.8, 0.8, 1];
    mMatrix = mat4.translate(mMatrix, [-0.5, -0.72, 0]);
    mMatrix = mat4.scale(mMatrix, [0.17, 0.1, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    drawWheel();
    drawWheel(true, 0.27);
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0.000, 0.455, 0.878, 0.65];
    mMatrix = mat4.translate(mMatrix, [-0.5, -0.8, 0]);
    mMatrix = mat4.scale(mMatrix, [0.39, 0.1, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.305, -0.8, 0]);
    mMatrix = mat4.rotate(mMatrix, 6.285, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.14, 0.1, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.695, -0.8, 0]);
    mMatrix = mat4.rotate(mMatrix, 6.285, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [0.14, 0.1, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}
function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clearColor(0.95, 0.95, 0.95, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (animation) {
        window.cancelAnimationFrame(animation);
    }
    
    function animate() {
        rotationAngle += rotationSpeed;
         t += 0.05;
        scale = 0.8 + 0.2 * Math.sin(t); 
        translationX += translationSpeed * direction;
        translationX2 += translationSpeed * direction2 ;
        if (Math.abs(translationX) > translationRange) {
            direction *= -1;
        }
        if (Math.abs(translationX2) > translationRange2) {
            direction2 *= -1;
        }
        drawSky();
        drawSun(rotationAngle);
        drawCloud();
        drawStar(-0.05, 0.55, 0.02, scale);
        drawStar(0.5, 0.95, 0.02, scale);
        drawStar(-0.15, 0.75, 0.04, scale);
        drawStar(-0.01, 0.65, 0.03, scale);
        drawStar(0.38, 0.8, 0.05, scale);
        drawMountain(-0.6, 0.09, 1.2, 0.4, -0.555, 0.095);
        drawMountain(-0.076, 0.09, 1.8, 0.55, -0.014, 0.096);
        drawMountain(0.7, 0.12, 1.0, 0.3, -0.545, -0.005, true);
        drawGround();
        drawRoad();
        drawRiver();
        drawTrees(true, 0.35, 0, 0.85, 0.85)
        drawTrees();
        drawTrees(true, -0.2, 0, 0.8, 0.8)
        drawBoat2(translationX2);
        drawBoat1(translationX);
        drawFan(rotationAngle, true, 0,0, [0.7, 0.7]);
        drawFan(rotationAngle,false, 0,0, [1.0, 1.0]);
        drawBush();
        drawBush(true, 0.8, 0, 1.02);
        drawBush(true, 1.48, -0.13, 1.6);
        drawBush(true, 2.15, 0.25, 1.3);

        drawHouse();
        drawCar();

 
        animation = window.requestAnimationFrame(animate);
    }
    animate();
}

function webGLStart() {
    var canvas = document.getElementById("scenery");
    initGL(canvas);
    shaderProgram = initShaders()
    const aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");

    uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");
    gl.enableVertexAttribArray(aPositionLocation);

    uColorLoc = gl.getUniformLocation(shaderProgram, "color");

    initSquareBuffer();
    initTriangleBuffer();
    initCircleBuffer();
    initRayBuffer();
    initFanBladesBuffer();

    drawScene();
}


function changeView(m) {
    mode = m;
    drawScene();
}