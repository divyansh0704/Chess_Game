const express = require("express");
const socket = require("socket.io");
const http = require("http");
const {Chess} = require("chess.js");
const ejs = require("ejs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let player = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index",{title:"Chess Game"});
});

io.on("connection",(socket)=>{
    // console.log("connected");
    if(!player.white){
        player.white = socket.id;
        socket.emit("playerRole","w");
    }
    else if(!player.black){
        player.black = socket.id;
        socket.emit("playerRole","b");
    }
    else{
        socket.emit("spectatorRole");
    }
    socket.on("disconnect",()=>{
        if(player.white === socket.id){
            delete player.white;
        }
        else if(player.black === socket.id){
            delete player.black;
        }

    })

    socket.on("move",(move)=>{
        try{
            if(chess.turn() === 'w' && player.white !== socket.id){
                return;
            }
            if(chess.turn() === 'b' && player.black !== socket.id){
                return;
            }

            const result =chess.move(move);
            if(result){
                currentPlayer = chess.turn();
                io.emit("move",move);
                io.emit("boardState",chess.fen());
            }else{
                console.log("invalid move",move);
                socket.emit("invalid move",move)

            }


        }catch(err){
            console.log(err);
            socket.emit("some error occured",move)

        }
    })

    
})
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
