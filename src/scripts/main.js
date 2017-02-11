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
  tools.lineTool = lineTool;

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

  function line() {
    let tool = this;
    this.started = false;
  }

  function triangle() {
    let tool = this;
    this.started = false;
  }

  function circle() {
    let tool = this;
    this.started = false;
  }

  function square() {
    let tool = this;
    this.started = false;
  }

  function pencil(){

    let tool = this;
    this.started = false;

    this.mousedown = function(event){
      socket.emit('draw', {line: [event.x, event.y]});
      tool.started = true;
      ctx.mouseWidth = 12;
      ctx.strokeStyle = "red";
      ctx.beginPath();
      ctx.moveTo(event.x, event.y);
    }

    this.mousemove = function(event){
      if(tool.started){
        socket.emit('draw', {line: [event.x, event.y]});
        ctx.lineTo(event.x, event.y);
        ctx.stroke();
      }
    }

    this.mouseup = function(event){
      if(tool.started){
        //tool.mousemove(event);
        tool.started = false;
      }
    }

  }

  function canvasEvent(event){

    let ev = {};
    ev.x = event.clientX - canvasOffset.left;
    ev.y = event.clientY - canvasOffset.top;

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



});
