const board = document.querySelector("#board");
let width;
let height;
const difficulty = [0.08, 0.16, 0.32, 0.64];
let mode = 1;
let max_bombs = Math.round(difficulty[mode] * width * height);
let remaining_flags = max_bombs; // Flags
let bombs = [];
let boxes = [];
let cronometroIniciado = false; // Variable de control
let intervaloCronometro; // Variable para almacenar el intervalo del cronómetro
let revealed_boxes = 0;
/* ------------------------- MUSICA DE FONDO ----------------------*/
const background_music = document.getElementById("background_music")
background_music.volume = .2;
background_music.loop = true;
background_music.play();
 /*  ----------------------------- REASIGNAR VARIABLES -------------------------------------------*/
window.onload = function () {
    start();
}
function select_size(size){
    play('sounds/noquestion.mp3', 1);
    width = size;
    height = size;
    document.documentElement.style.setProperty('--NColumnas', size);
    document.documentElement.style.setProperty('--NFilas', size);
    to_diff_menu();
}
function to_diff_menu() {
    // Ocultar el elemento actual
    var elementoACambiar = document.getElementById("menu1");
    elementoACambiar.style.display = "none";
    // Mostrar el nuevo elemento
    var elementoNuevo = document.getElementById("menu2");
    elementoNuevo.style.display = "grid";
    // Agregar la clase de animación al nuevo elemento para que aparezca con una animación de fade-in
    elementoNuevo.classList.add("slideIn");
}
function select_difficulty(selected_mode){
    play('sounds/noquestion.mp3', 1);
    mode = selected_mode; // Establecer el modo de dificultad
    max_bombs = Math.round(difficulty[mode] * width * height); // Actualizar el número máximo de bombas
    remaining_flags = max_bombs; // Restablecer el contador de banderas restantes
    updateFlagCounter(); // Actualizar el contador de banderas en la interfaz
    to_game_menu();
}
function to_game_menu() {
    // Ocultar el elemento actual
    var elementoACambiar = document.getElementById("menu2");
    elementoACambiar.style.display = "none";
    // Mostrar el nuevo elemento
    var elementoNuevo = document.getElementById("menu3");
    elementoNuevo.style.display = "grid";
    // Agregar la clase de animación al nuevo elemento para que aparezca con una animación de fade-in
    elementoNuevo.classList.add("slideIn");
    start();
}

play('sounds/noquestion.mp3', 1);
function reset() {
    location.reload(); // Recargar la página
}

/*  -----------------------------  START   -------------------------------------------*/
function start(){
    generate_board(width,height);
    generate_bombs();
// funcion on click de cada celda y dentro de ella funcion recursiva de revelar
    for (let row_index = 0; row_index < height; row_index++){
        for (let col_index = 0; col_index < width; col_index++){
            //boton principal
            boxes[row_index][col_index].onclick = () => {
                // Si es la primera vez y el cronómetro no ha sido iniciado
                if (!cronometroIniciado) {
                    intervaloCronometro = iniciarCronometro();
                    cronometroIniciado = true; // Marcar que el cronómetro ha sido iniciado
                }
                if(!boxes[row_index][col_index].dataStatus === "tapat" && boxes[row_index][col_index].dataCover === "blank") return;
                if (boxes[row_index][col_index].dataBomb === "bomb") {
                    reveal_bomb(boxes[row_index][col_index])
                    play('sounds/mine.mp3', .2); // Sonido
                    detenerCronometro(intervaloCronometro);
                    showGameOver();
                    endGame("gameover");
                    setTimeout(() => {
                        outGameOver();
                    } , 6000);
                    reveal_bombs();
                    remove_wrong_flags();
                    return;
                }
                play('sounds/destapat.mp3', 1);
                click(boxes[row_index][col_index]);
                if (revealed_boxes === width * height - bombs.length && bombs_flagged()){
                    detenerCronometro(intervaloCronometro);
                    showWin();
                    setTimeout(() => {
                        endGame("win")
                        outWin();
                    } , 6000);
                }
            };
            //boton derecho
            boxes[row_index][col_index].oncontextmenu = (e) => {
                e.preventDefault();
                if (boxes[row_index][col_index].dataStatus !== "tapat") return;
                switch (boxes[row_index][col_index].dataCover){
                    case "blank":
                        if (remaining_flags === 0) return;  // Verificar que haya banderas restantes // Decrementar contador de banderas restantes
                        change_svg(boxes[row_index][col_index], "img/flag.svg");
                        play('sounds/flag.mp3', .6);
                        boxes[row_index][col_index].dataCover = "flag";
                        remaining_flags--;
                        break;
                    case "flag":
                        change_svg(boxes[row_index][col_index], "img/qMark.svg");
                        play('sounds/qMark.mp3', .5);
                        boxes[row_index][col_index].dataCover = "qMark";
                        remaining_flags++; // Incrementa el contador de banderas al quitar la bandera
                        break;
                    case "qMark":
                        boxes[row_index][col_index].innerHTML = "";
                        play('sounds/noquestion.mp3', 1);
                        boxes[row_index][col_index].dataCover = "blank";
                }
                updateFlagCounter(); // Actualiza el contador de banderas en la interfaz
                if (revealed_boxes === width * height - bombs.length && bombs_flagged()){
                    detenerCronometro(intervaloCronometro);
                    showWin();
                    endGame("win")
                }
            };
        }
    }
}
// ------------------------------ GENERACION DEL TABLERO ------------------------------
function generate_board(width, height){
    for (let row_index = 0; row_index < height; row_index++){
        let row = [];
        for (let col_index = 0; col_index < width; col_index++){
            const box = document.createElement("div");
            box.dataRow = row_index.toString();
            box.dataCol = col_index.toString();
            box.dataBomb = "no";
            box.dataNumber = "0";
            box.dataStatus = "tapat";
            box.dataCover = "blank";
            board.appendChild(box);
            row.push(box)
        }
        boxes.push(row);
    }
    remaining_flags = max_bombs; // Inicializa el contador de banderas con el número de bombas
    updateFlagCounter(); // Actualiza el contador de banderas en la interfaz
}
// ------------------------------ GENERACION DE BOMBAS ------------------------------
function generate_bombs(){
    let bomb_count = 0;
    while (bomb_count < max_bombs){
        let random_row = getRandomInt(height);
        let random_col = getRandomInt(width);
        if (boxes[random_row][random_col].dataBomb === "bomb") continue; // aqui
        boxes[random_row][random_col].dataBomb = "bomb";
        bombs.push(boxes[random_row][random_col]);
        bomb_count++;
        update_neighbours(boxes[random_row][random_col], increase_number);
    }
}
function getRandomInt(max) {
    return Math.round(Math.random() * (max - 1));
}
function update_neighbours(box, method){ //si existe esta celda, ejecuta el método increase_number
    let r = parseInt(box.dataRow);
    let c = parseInt(box.dataCol);

    if (r - 1 >= 0){ // upper boxes
        if (c - 1 >= 0) method(boxes[r-1][c-1]); // left
        method(boxes[r-1][c]); // center
        if (c + 1 < width) method(boxes[r-1][c+1]); //right
    }

    if (c - 1 >= 0) method(boxes[r][c-1]); // left
    if (c + 1 < width) method(boxes[r][c+1]); // right

    if (r + 1 < height){ // lower boxes
        if (c - 1 >= 0) method(boxes[r+1][c-1]); // left
        method(boxes[r+1][c]); // center
        if (c + 1 < width) method(boxes[r+1][c+1]); // right
    }
}
function updateFlagCounter() {
    const flagCounter = document.getElementById("contador-banderas");
    flagCounter.textContent = remaining_flags;
}
function increase_number(box){
    box.dataNumber = String.fromCharCode(box.dataNumber.charCodeAt(0) + 1);
}
// ------------------------------ CLICKAR UNA CELDA ------------------------------
function click(box){
    if(!(box.dataStatus === "tapat" && box.dataCover === "blank")) return; //no deja interactuar con las casillas destapadas
    revealed_boxes++;
    box.style.backgroundImage = "none";
    box.style.backgroundColor = "bisque";
    box.dataStatus = "destapat";
    if(box.dataNumber === "0")
    {
        update_neighbours(box, click);
    }
    else
    {
        const colors = ["dodgerblue","green","red","purple","orange","yellowgreen","pink","peru"]
        box.innerText = box.dataNumber;
        box.style.color = colors[parseInt(box.dataNumber) - 1];
    }
}
function iniciarCronometro()
{
    var segundos = 0;
    var minutos = 0;
    var displaySegundos = document.getElementById("segundos");
    var displayMinutos = document.getElementById("minutos");

    return setInterval(function()// Devolvemos el ID del intervalo para detenerlo si es necesario
    {
        segundos++;
        if (segundos / 60 === 1) {
            segundos = 0;
            minutos++;
        }
        displaySegundos.textContent = segundos < 10 ? "0" + segundos : segundos;
        displayMinutos.textContent = minutos < 10 ? "0" + minutos : minutos;
    }, 1000);
}
// Función para detener el cronómetro
function detenerCronometro(intervalo)
{
    clearInterval(intervalo);
}
function reveal_bomb(bomb){
    if (bomb.dataStatus !== "tapat") return;
    bomb.style.backgroundImage = "none";
    bomb.dataStatus = "destapat";
    bomb.style.backgroundColor = "#3bc6d9";
    change_svg(bomb, "img/Trigo.svg");
}
function reveal_bombs(){
    if (max_bombs < 16)
    {
        for (let index = 0; index < bombs.length; index++){
            setTimeout(() => {
                reveal_bomb(bombs[index]);
                play('sounds/mine.mp3', .2); // Sonido
            } , 270 * (index + 1));
        }
        return;
    }
    play('sounds/mine.mp3', .4); // Sonido
    for (let index = 0; index < bombs.length; index++){
        reveal_bomb(bombs[index]);
    }
}
function remove_wrong_flags(){
    let counter = 0;
    for (let row = 0; row < height; row++){
        for (let col = 0; col < width; col++){
            if (boxes[row][col].dataBomb === "bomb" || boxes[row][col].dataCover === "blank") continue;
            setTimeout(() => {
                change_svg(boxes[row][col], "img/cross.svg");
            } , 100 * (++counter));
        }
    }
    play('sounds/cross.mp3', .2);
}
function showGameOver()
{
    background_music.pause();
    play("sounds/GameOver.mp3", 1);
    const mensajeGameOver = document.getElementById("gameover-message");
    mensajeGameOver.style.display = "block";
    mensajeGameOver.classList.add("gameover-message");
}
function showWin()
{
    background_music.pause();
    let victory_fanfare = new Audio('sounds/victory.mp3')
    victory_fanfare.volume = .6;
    victory_fanfare.play();
    for(let i = 0; i < 7; i++){
        setTimeout(() =>victory_fanfare.volume = .6 - i / 10, 4000 + 100 * i);
    }
    // aparece la ventana de win
    const mensajeGameOver = document.getElementById("win-message");
    mensajeGameOver.style.display = "block";
    mensajeGameOver.classList.add("win-message");
}
function endGame(classList)
{
    // Desactiva la interacción con el juego durante la animación de game over
    const juegoElemento = document.getElementById("board");
    juegoElemento.classList.add(classList);
}
function outGameOver()
{
    const byeGameOver = document.getElementById("gameover-message");
    byeGameOver.style.display = "none";
}

function outWin()
{
    const byeWin = document.getElementById("win-message");
    byeWin.style.display = "none";
}
function bombs_flagged(){
    for (let index = 0; index < bombs.length; index++){
        if (bombs[index].dataCover !== "flag") return false;
    }
    return true;
}
function change_svg(box, src){
    box.innerHTML = "";
    let svg = document.createElement("img")
    svg.src = src;
    box.appendChild(svg);
}
function play(src, volume){
    let Sound = new Audio(src);
    Sound.volume = volume;
    Sound.play(); // Sonido
}