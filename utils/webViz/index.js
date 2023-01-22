let transition_colors = [];
let loop_colors = [];
let active_colors = [];

let idx = 0;
let interval;
var socket = io(`http://${location.hostname}:5000`);
socket.on("beat", async (msg) => {
    console.log("transition", idx, active_colors.length);
    
    transition_colors = msg.transition;
    loop_colors = msg.colors;
    active_colors = transition_colors

    if (interval) clearInterval(interval);
    interval = setInterval(() => {
        document.body.style.backgroundColor = active_colors[idx];
        idx++;
        if (idx >= active_colors.length) {
            if (active_colors != loop_colors) {
                active_colors = loop_colors
                console.log("loop");
            }
            idx = 0;
        }
    }, 33);
});
const sleep = async (time) => {
    await new Promise((resolve) => setTimeout(resolve, time));
};
