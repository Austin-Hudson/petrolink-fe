document.addEventListener("DOMContentLoaded", function(){
  console.log("main.js is loaded");

  //Grab elements from .html pages
  let canvas = document.querySelector("#canvas");
  let pencilBtn = document.querySelector("#pencil-btn");

  //globals
  let ctx = canvas.getContext("2d"); //context to be able to do 2d drawing
  let toolClicked = "none";  //default have nothing clicked
  let canvasOffset = $('#canvas').offset(); //get the offset of the canvas
  let socket = io.connect("http://localhost:3000");  //get the socket

  //various tools
  let pencilTool = new pencil();

  //add various tools to tool object
  let tools = {};
  tools.pencil = pencilTool;

  //listeners
  canvas.addEventListener("mousedown", canvasEvent, false);
  canvas.addEventListener("mousemove", canvasEvent, false);
  canvas.addEventListener("mouseup", canvasEvent, false);

  pencilBtn.addEventListener("click", function(event){
    pencilToggle();
  });



  function pencilToggle(){
    if(toolClicked !== "pencil"){
      toolClicked = "pencil"
      pencilBtn.style.backgroundColor = "#A1A1A1";
    }
    else if(toolClicked === "pencil"){
      toolClicked = "none";
      pencilBtn.style.backgroundColor = "white";
    }
  }

  function pencil(){

    let tool = this;
    this.started = false;

    this.mousedown = function(event){
      tool.started = true;
      ctx.mouseWidth = 12;
      ctx.strokeStyle = "red";
      ctx.beginPath();
      ctx.moveTo(event.x, event.y);
    }

    this.mousemove = function(event){
      if(tool.started){
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
  socket.on("user_connected", function(data){
    // Edit the DOM
    let userPanel = document.querySelector(".user-status-panel");
    let p = document.createElement("p");
    let userStatus = document.createTextNode(data.message);
    p.classList.add("connected");
    p.appendChild(userStatus);
    userPanel.appendChild(p);
  });

  socket.on("user-disconnect", function(data){
    let userPanel = document.querySelector(".user-status-panel");
    let p = document.createElement("p");
    let userStatus = document.createTextNode(data.message);
    p.classList.add("disconnected");
    p.appendChild(userStatus);
    userPanel.appendChild(p);
  });

});
