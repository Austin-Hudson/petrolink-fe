document.addEventListener("DOMContentLoaded", function(){
  console.log("main.js is loaded");

  //Grab elements from .html pages
  let canvas = document.querySelector("#canvas");
  let pencilBtn = document.querySelector("#pencil-btn");
  let squareBtn = document.querySelector("#square-btn");
  let circleBtn = document.querySelector("#circle-btn");
  let triangleBtn = document.querySelector("#triangle-btn");
  let lineBtn = document.querySelector("#line-btn");

  //globals
  let ctx = canvas.getContext("2d"); //context to be able to do 2d drawing
  let toolClicked = "none";  //default have nothing clicked
  let toolSelected = false;
  let canvasOffset = $('#canvas').offset(); //get the offset of the canvas
  let socket = io.connect("http://localhost:3000");  //get the socket
  let squareWidth = squareHeight = 75;
  let circleRadius = 30;
  let triangleSide = 50;

  //various tools
  let pencilTool = new pencil();
  let squareTool = new square();
  let circleTool = new circle();
  let triangleTool = new triangle();
  let lineTool = new line();

  //add various tools to tool object
  let tools = {};
  tools.pencil = pencilTool;
  tools.square = squareTool;
  tools.circle = circleTool;
  tools.triangle = triangleTool;
  tools.line = lineTool;

  //listeners
  canvas.addEventListener("mousedown", canvasEvent, false);
  canvas.addEventListener("mousemove", canvasEvent, false);
  canvas.addEventListener("mouseup", canvasEvent, false);


  pencilBtn.addEventListener("click", function(event){
    toolToggle(event);
  });

  squareBtn.addEventListener("click", function(event){
    toolToggle(event);
  });

  circleBtn.addEventListener("click", function(event){
    toolToggle(event);
  });

  triangleBtn.addEventListener("click", function(event){
    toolToggle(event);
  });

  lineBtn.addEventListener("click", function(event){
    toolToggle(event);
  });

  function toolToggle(event){
    if(toolClicked !== event.target.value && !toolSelected){
      toolClicked = event.target.value
      toolSelected = true;
      event.target.style.backgroundColor = "#A1A1A1";
    }
    else if(toolClicked === event.target.value){
      toolClicked = "none";
      toolSelected = false;
      event.target.style.backgroundColor = "white";
    }
  }

  //objects - tools
  function line() {
    let tool = this;
    this.started = false;

    this.mousedown = function(event){
      tool.started = true;
      ctx.mouseWidth = 12;
      ctx.strokeStyle = "orange";
      ctx.beginPath();
      ctx.moveTo(event.x, event.y);
      socket.emit("draw-new-line", {line: "START"});
      socket.emit("draw-new-line", {line:[event.x, event.y]});
    }

    this.mouseup = function(event){
      if(tool.started){
        ctx.lineTo(event.x, event.y);
        ctx.stroke();
        tool.started = false;
        socket.emit("draw-new-line", {line:[event.x, event.y]});
        socket.emit("draw-new-line", {line: "END"});
      }
    }
  }

  function triangle() {
    let tool = this;
    this.started = false;

    this.mousedown = function(event){
      ctx.mouseWidth = 12;
      ctx.strokeStyle = "purple";
      ctx.beginPath();
      ctx.moveTo(event.x, event.y);
      ctx.lineTo(event.x - 50, event.y + 50);
      ctx.lineTo(event.x + 50, event.y + 50);
      ctx.closePath();
      ctx.stroke();
      socket.emit("draw-new-triangle", {triangle: [event.x, event.y]});
    }
  }

  function circle() {
    let tool = this;
    this.started = false;

    this.mousedown = function(event){
      ctx.mouseWidth = 12;
      ctx.strokeStyle = "blue";
      ctx.beginPath();
      ctx.arc(event.x, event.y, 30, 0, 2*Math.PI);
      ctx.stroke();
      socket.emit("draw-new-circle", {circle: [event.x, event.y]});
    }
  }

  function square() {
    let tool = this;
    this.started = false;

    this.mousedown = function(event){
      ctx.mouseWidth = 12;
      ctx.strokeStyle = "green";
      ctx.beginPath();
      ctx.strokeRect(event.x, event.y, squareWidth, squareHeight);
      socket.emit('draw-new-square', {square: [event.x, event.y]});
    }
  }

  function pencil(){

    let tool = this;
    this.started = false;

    this.mousedown = function(event){
      socket.emit('draw-new', {line: [event.x, event.y]});
      tool.started = true;
      ctx.mouseWidth = 12;
      ctx.strokeStyle = "red";
      ctx.beginPath();
      ctx.moveTo(event.x, event.y);
    }

    this.mousemove = function(event){
      if(tool.started){
        socket.emit('draw-new', {line: [event.x, event.y]});
        ctx.lineTo(event.x, event.y);
        ctx.stroke();
      }
    }

    this.mouseup = function(event){
      if(tool.started){
        socket.emit('draw-new', {line: "END"});
        tool.started = false;
      }
    }

  }

  function canvasEvent(event){

    let ev = {};
    if(navigator.userAgent.indexOf('Chrome')){
      // ev.x = event.clientX - canvasOffset.left;
      // ev.y = event.clientY - canvasOffset.top;
      ev.x = event.offsetX;
      ev.y = event.offsetY;
    }
    else {
      ev.x = event.layerX;
      ev.y = event.layerY;
    }

    if(toolClicked !== "none"){

      let toolSelected = tools[toolClicked];
      let func = toolSelected[event.type];

      if (func){
        func(ev);
      }
    }

  }

  //socket.io
  //user has connected
  socket.on("user_connected", function(data){
    // Edit the DOM
    let userPanel = document.querySelector(".user-status-panel");
    let p = document.createElement("p");
    let userStatus = document.createTextNode(data.message);
    p.classList.add("connected");
    p.appendChild(userStatus);
    userPanel.appendChild(p);
  });

  //user has disconnected
  socket.on("user-disconnect", function(data){
    //Edit the DOM
    let userPanel = document.querySelector(".user-status-panel");
    let p = document.createElement("p");
    let userStatus = document.createTextNode(data.message);
    p.classList.add("disconnected");
    p.appendChild(userStatus);
    userPanel.appendChild(p);
  });

  //client has drawn something
  socket.on('draw-new', function(data){
    ctx.mouseWidth = 12;
    ctx.strokeStyle = "red";

    if(data.line === "END"){
      ctx.beginPath();
    }
    else {
      ctx.lineTo(data.line[0], data.line[1]);
      ctx.stroke();
    }

  });

  //new client has join a session, update them with current state of canvas
  socket.on('draw-current-drawing', function(data){
    ctx.mouseWidth = 12;
    ctx.strokeStyle = "red";
    ctx.beginPath();
    //loop through array and drawn what has been drawn so far
    for(coord in data) {
      for(let i = 0; i < data[coord].length; i++){
        if(data[coord][i] === "END"){
          ctx.beginPath();
        }
        else {
          ctx.lineTo(data[coord][i][0], data[coord][i][1]);
          ctx.stroke();
        }
      }
    }
    ctx.closePath();
  });

  socket.on('draw-new-line', function(data){
    ctx.mouseWidth = 12;
    ctx.strokeStyle = "orange";

    if(data.line === "END" || data.line === "START"){
      ctx.beginPath();
    }
    else {
      ctx.lineTo(data.line[0], data.line[1]);
      ctx.stroke();
    }

    ctx.closePath();
  });

  socket.on('draw-current-line', function(data){
    ctx.mouseWidth = 12;
    ctx.strokeStyle = "orange";
    ctx.beginPath();
    //loop through array and drawn what has been drawn so far
    for(coord in data) {
      for(let i = 0; i < data[coord].length; i++){

        if(data[coord][i] === "END" || data[coord][i] === "START"){
          ctx.beginPath();
        }
        else {
          ctx.lineTo(data[coord][i][0], data[coord][i][1]);
          ctx.stroke();
        }
      }
    }
    ctx.closePath();
  });

  socket.on('draw-new-square', function(data){
    ctx.mouseWidth = 12;
    ctx.strokeStyle = "green";
    ctx.strokeRect(data.square[0], data.square[1], squareWidth, squareHeight);
    ctx.stroke();
    ctx.closePath();
  });

  socket.on('draw-current-square', function(data){
    ctx.mouseWidth = 12;
    ctx.strokeStyle = "green";
    ctx.beginPath();

    //loop through array and drawn what has been drawn so far
    // for(coord in data) {
      for(let i = 0; i < data.square.length; i++){
        ctx.strokeRect(data.square[i][0], data.square[i][1], squareWidth, squareHeight);
        ctx.stroke();
      }
    // }
    ctx.closePath();
  });

  socket.on('draw-new-circle', function(data){
    ctx.mouseWidth = 12;
    ctx.strokeStyle = "blue";
    ctx.beginPath();
    ctx.arc(data.circle[0], data.circle[1],circleRadius, 0, 2*Math.PI);
    ctx.stroke();
    ctx.closePath();
  });

  socket.on('draw-current-circle', function(data){
    ctx.mouseWidth = 12;
    ctx.strokeStyle = "blue";

    //loop through array and drawn what has been drawn so far
      for(let i = 0; i < data.circle.length; i++){
        ctx.beginPath();
        ctx.arc(data.circle[i][0], data.circle[i][1],circleRadius, 0, 2*Math.PI);
        ctx.stroke();
        ctx.closePath();
      }

  });

  socket.on('draw-new-triangle', function(data){
    ctx.mouseWidth = 12;
    ctx.strokeStyle = "purple";
    ctx.beginPath();
    ctx.moveTo(data.triangle[0], data.triangle[1]);
    ctx.lineTo(data.triangle[0] - triangleSide, data.triangle[1] + triangleSide);
    ctx.lineTo(data.triangle[0] + triangleSide, data.triangle[1] + triangleSide);
    ctx.closePath();
    ctx.stroke();
  });

  socket.on('draw-current-triangle', function(data){
    ctx.mouseWidth = 12;
    ctx.strokeStyle = "purple";

    //loop through array and drawn what has been drawn so far
      for(let i = 0; i < data.triangle.length; i++){
        ctx.beginPath();
        ctx.moveTo(data.triangle[i][0], data.triangle[i][1]);
        ctx.lineTo(data.triangle[i][0] - triangleSide, data.triangle[i][1] + triangleSide);
        ctx.lineTo(data.triangle[i][0] + triangleSide, data.triangle[i][1] + triangleSide);
        ctx.closePath();
        ctx.stroke();
      }
  });

});
