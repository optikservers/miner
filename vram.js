// testing stuff, ignore

//const sjs = require("shelljs")
//sjs.exec('pwsh "vram.ps1"').stdout;

(async () => {
    const sysinfo = require("systeminformation");
    var graphics = await sysinfo.graphics();

    if (graphics.controllers == "") {
        console.log("works");
    }
    console.log(graphics.controllers);
    console.log(graphics.controllers[0].vram);
    console.log(graphics.controllers[1].vram);
})();