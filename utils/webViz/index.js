var socket = io(`http://${location.hostname}:5000`);
socket.on("beat", async (msg) => {
    document.body
        .querySelector("#timings")
        .appendChild(document.createElement("p")).textContent =
        Date.now() - msg.time;
    document.body.querySelector("#id").textContent = socket.id;
    document.body.querySelector("#text").textContent = JSON.stringify(
        msg.transition
    );
    document.body.style.backgroundColor = msg.transition[0];
    // for await (let color of msg.transition) {
    //     // await sleep(16 / msg.transition.length);
    //     document.body.style.backgroundColor = color;

    // }
});
const sleep = async (time) => {
    await new Promise((resolve) => setTimeout(resolve, time));
};
