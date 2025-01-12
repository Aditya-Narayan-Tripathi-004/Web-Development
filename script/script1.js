// Initialize global variables
var folder = "devotional";
var prevfolder=folder;
var currentfolder;
var currentsong;
var previoussong;
var songs;
var list;
var currenttime = null;
var isDraggingSeek = false;
var isDraggingVolume = false;
var isMuted = false;
var previousVolume = 1; // Default volume to 100%
var isshuffle = false;
var isrepeat = 0;
var currindex;
var stack = [];
var pointer = -1;
var folderlist = []

// Helper function to convert seconds to minute:second format
function secondstominutesecond(seconds) {
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = Math.floor(seconds % 60);
    if (remainingSeconds < 10) {
        remainingSeconds = '0' + remainingSeconds;
    }
    return minutes + ":" + remainingSeconds;
}
//function to fetch folders
async function getcards() {
    console.log("i am here");
    let response = await fetch(`${window.location.origin}/songs/`);
    let text = await response.text(); 
    let div = document.createElement("div");
    div.innerHTML = text;
    console.log(div.innerHTML);
    console.log("this ends here **************")
    div.querySelectorAll("tr").forEach((e) => {
        console.log(e.querySelector("td a"))
        if(e.querySelector("td a")){
            // if( e.querySelector("td a").href!=`${window.location.origin}/`){
        console.log("is this here =====>",`${window.location.origin}/songs${e.querySelector("td a").href.split(`${window.location.origin}`)[1]}`);
            folderlist.push(`${window.location.origin}/songs${e.querySelector("td a").href.split(`${window.location.origin}`)[1]}`);
            // }
        }
    });
    // folderlist.shift();
    console.log("why not this",folderlist);
    await folderlist.forEach(async element => {
        let response = await fetch(`${element}/info.json`);
        let text = await response.json();
        let folderName = element.split("/songs/")[1].replaceAll("/","");
        console.log(folderName);
        document.querySelector(".allplaylist").innerHTML += `<div class="card" data-folder="${folderName}">
                            <div class="coverimage">
                                <img src="${element}/cover.jpg" alt="coverimage" class="cover" style="object-fit: fill;">
                                <img src="${window.location.origin}/images/play_button.svg" alt="play" class="play_button">
                            </div>
                            <div class="coverheading">
                                ${text.title}
                                </div>
                                <p class="innercontent">
                                ${text.description}
                            </p>
                        </div>`;
    });
    setTimeout(() => {
        document.querySelectorAll(".card").forEach(e => {
            e.addEventListener("click", async () => {
                if (currentsong) {
                    await pauseCurrentSong(list[currindex]);
                }
                prevfolder = folder;
                folder = e.dataset.folder;
                initializePlayer(folder);
            });
            coverplay(e);
        });
    }, 1000);
}

async function coverplay(element) {
    element.querySelector(".play_button").addEventListener("click", async (eclicked) => {
        console.log('i am the cover play', eclicked)
        eclicked.stopPropagation()
        prevfolder=folder
            folder = eclicked.currentTarget.parentElement.parentElement.dataset.folder
            await initializePlayer(folder);
        if (!currentsong) {
            console.log('evedrytime  ............')
            
            currindex = Math.floor(Math.random() * songs.length);
            currentsong = new Audio(songs[currindex]);
            stack.push(currentsong);
            pointer++;
        }

        for (const iterator of list) {
            if (iterator.querySelector(".songlink").innerHTML === currentsong.src) {
                currentElement = iterator;
                await handlePlayButtonClick(iterator);
                break;
            }
        }
        // console.log(element.querySelector(".play_button").src=="pause.svg","not this time")
        
        // if (element.querySelector(".play_button").src=="pause.svg") {
        //     console.log("this is first pause cover");
        //     element.querySelector(".play_button").addEventListener("click", async () => {
        //         console.log("this is pause cover");
        //         await pauseCurrentSong(currentElement);
        //         await coverplay(currentfolder);
        //     });
        // }
    })
}
// Function to fetch songs
async function getsongs(folder) {
    let response = await fetch(`${window.location.origin}/songs/${folder}/`);
    let text = await response.text();
    let div = document.createElement("div");
    div.innerHTML = text;

    let anchor = div.getElementsByTagName("a");
    songs = [];
    for (const iterator of anchor) {
        if (iterator.href.endsWith(".mp3")) {
            songs.push(`${window.location.origin}/songs/${folder}${iterator.href.split(`${window.location.origin}`)[1]}`);
        }
    }
    populateSongList(songs, folder);
    return songs;
}

// Function to populate song list in the DOM
function populateSongList(songs, folder) {
    let songlist = document.querySelector(".section").firstElementChild;
    songlist.innerHTML = ""
    for (const iterator of songs) {
        console.log("her",folder,iterator,`${iterator.split(`/${folder}/`)[1]}`)
        songlist.innerHTML += `<li>
                    <img src="images/music.svg" alt="music" height="100%" class="invert">
                    <p>${iterator.split(`/${folder}/`)[1].replaceAll("%20", " ").split(".mp3")[0]}</p>
                    <span class="songlink" style="display:none">${iterator}</span>
                    <img src="images/play_button.svg" alt="" srcset="" height="100%" width="20em" class="invert end playme">
                    </li>`;
        console.log(iterator);
    }
}

// Helper function to replace icon
function replaceIcon(element, newIconHTML) {
    if (element) {
        element.outerHTML = newIconHTML;
    }
}

// Function to handle play button click
async function handlePlayButtonClick(element) {
    // li = element.parentElement;

    // Pause all other songs
    document.querySelectorAll(".card").forEach(async (e) => {
        if (e.dataset.folder=== folder) {
            currentfolder = e;
            await console.log('this is the current ', currentfolder)
            
        }
    })
    await pauseAllOtherSongs(element);

    // Stop the current song if it's playing
    if (currentsong && !currentsong.paused) {
        await pauseCurrentSong(element);


    }

    // Play current song
    await playCurrentSong(element);

    // Update icons and add event listeners
    await updateIconsForPlayingSong(element);
    await addPauseEventListener(element);
    await addHoverEventListeners(element);
    


    document.querySelector(".leftplay .album img").src = `${currentsong.src.split(`/${folder}/`)[0] + (`/${folder}/`)}cover.jpg`
    console.log('=============================', `${currentsong.src.split(`/${folder}/`)[0] + (`/${folder}/`)}cover.jpg`)

    document.querySelector(".playbar .text .p").innerHTML = `${currentsong.src.split(`/${folder}/`)[1].replaceAll("%20", " ").split(".mp3")[0]}`;
    // document.querySelector(".playbar .text marquee").innerHTML = `${currentsong.src.split(`/${folder}/`)[1].replaceAll("%20", " ").split(".mp3")[0]}`;
    document.querySelector(".wholebottom .duration").innerHTML = secondstominutesecond(currentsong.duration);
}

// Function to pause all other songs
async function pauseAllOtherSongs(element) {
    for (const iterator of list) {
        if ((iterator.querySelector(".pause")) && !(iterator.isSameNode(element))) {
            if (previoussong) {
                previoussong.pause();
                replaceIcon(iterator.querySelector(".pause"), '<img src="images/play_button.svg" alt="" srcset="" height="100%" width="20em" class="invert end playme">');
                iterator.querySelector(".equiliser").remove();
                replaceIcon(document.querySelector(".playbar").getElementsByClassName("pause")[0], '<img src="images/play_button.svg" class="playme" height="50%" alt="play">');
                replaceIcon(currentfolder.querySelector(".play_button"), '<img src="images/play_button.svg" alt="play" style=" " class="play_button">');
                await addEventListenerToSong(iterator);
                
                currenttime = 0;
            }
        }
    }
}

async function playCurrentSong(element) {
    for (let i = 0; i < songs.length; i++) {
        if (list[i] == element) {
            currindex = i;
            break;
        }
    }

    currentsong = new Audio(element.querySelector(".songlink").innerHTML);
    // stack.push(currentsong)

    // Set the volume to previousVolume or 1.0 (100%) if previousVolume is not set
    currentsong.volume = previousVolume || 1.0;

    if (currenttime) {
        currentsong.currentTime = currenttime;
    }

    console.log(currentsong);
    previoussong = currentsong;
    await currentsong.play();
    playbar();
}


// Function to update icons for the playing song
async function updateIconsForPlayingSong(element) {
    replaceIcon(element.querySelector(".playme"), '<img src="https://open.spotifycdn.com/cdn/images/equaliser-animated-green.f5eb96f2.gif" height="50%" width="20em" class="invert end equiliser"> <img src="images/pause.svg" alt="" srcset="" height="100%" width="20em" class="invert end pause" style="display:none">');
    replaceIcon(document.querySelector(".playbar").getElementsByClassName("playme")[0], '<img src="images/pause.svg" class="pause" height="50%" alt="play">');
    console.log("is currentfolder ",currentfolder)
    replaceIcon(currentfolder.querySelector(".play_button"), '<img src="images/pause.svg" alt="play" style="opacity:100%;transform: translateY(0vh);" class="play_button">');
    let playbarPauseButton = document.querySelector(".playbar .pause");
    if (playbarPauseButton) {
        playbarPauseButton.addEventListener("click", async () => {
            console.log("this is pause");
            await pauseCurrentSong(element);
            await coverplay(currentfolder)
            await playbar();
        });
    }
}

// Function to add pause event listener
async function addPauseEventListener(element) {
    element.querySelector(".pause").addEventListener("click", async () => {
        await pauseCurrentSong(element);
        // await coverplay(currentfolder)
    });
}

// Function to pause the current song
async function pauseCurrentSong(element) {
    console.log(currentsong.currentTime);
    await currentsong.pause();
    replaceIcon(element.querySelector(".pause"), '<img src="images/play_button.svg" alt="" srcset="" height="100%" width="20em" class="invert end playme">');
    if(element.querySelector(".equiliser")){
    element.querySelector(".equiliser").remove();

    }
    replaceIcon(currentfolder.querySelector(".play_button"), '<img src="images/play_button.svg" alt="play" style=" " class="play_button">');
    replaceIcon(document.querySelector(".playbar").getElementsByClassName("pause")[0], '<img src="images/play_button.svg" class="playme" height="50%" alt="play">');
    await addEventListenerToSong(element);
    await coverplay(currentfolder)

}

// Function to add hover event listeners
async function addHoverEventListeners(element) {
    element.addEventListener("mouseenter", () => {
        if (element.querySelector(".bottom .pause")) {
            element.querySelector(".pause").style.display = "block";
            element.querySelector(".equiliser").style.display = "none";
        }
    });

    element.addEventListener("mouseleave", () => {
        if (element.querySelector(".bottom .pause")) {
            element.querySelector(".pause").style.display = "none";
            element.querySelector(".equiliser").style.display = "block";
        }
    });
}

// Function to initialize playbar
async function playbar() {
    if (document.querySelector(".playbar .playme")) {
        document.querySelector(".playbar .playme").addEventListener("click", async () => {
            await playFromPlaybar();
        });
    }
}

// Function to play from playbar
async function playFromPlaybar() {
    let currentElement;
    if (!currentsong) {
        currindex = Math.floor(Math.random() * songs.length);
        currentsong = new Audio(songs[currindex]);
        stack.push(currentsong);
        pointer++;
    }

    for (const iterator of list) {
        if (iterator.querySelector(".songlink").innerHTML === currentsong.src) {
            currentElement = iterator;
            await handlePlayButtonClick(iterator);
            break;
        }
    }
    let playbarPauseButton = document.querySelector(".playbar .pause");
    if (playbarPauseButton) {
        playbarPauseButton.addEventListener("click", async () => {
            console.log("this is pause");
            await pauseCurrentSong(currentElement);
            await playbar();
        });
    }
}

// Function to add event listener to song
async function addEventListenerToSong(element) {
    element.querySelector(".playme").addEventListener("click", async () => {
        if (currentsong && currentsong.src != (element.querySelector(".songlink").innerHTML)) {
            pointer++;
            stack.push(new Audio(element.querySelector(".songlink").innerHTML))
        }
        else if (!currentsong) {
            pointer++;
            stack.push(new Audio(element.querySelector(".songlink").innerHTML))
        }
        await handlePlayButtonClick(element);
    });
}
async function cardsevent() {

}
// Initialize the player
async function initializePlayer(folder) {
    // Stop current song if playing
    if (currentsong && prevfolder!=folder) {
        currentsong.pause();
        currentsong = null;
        previoussong = null;
        currenttime = 0;
        stack = []
        pointer = -1
        songs = []
        list = []
        replaceIcon(currentfolder.querySelector(".play_button"), '<img src="images/play_button.svg" alt="play" style=" " class="play_button">');
    }

    if ((document.querySelector(".allplaylist").children).length === 0) {
        await getcards();
    }
    songs = await getsongs(folder);
    list = document.querySelector(".bottom").getElementsByTagName("li");
    for (let i = 0; i < songs.length; i += 1) {
        const element = list[i];
        await addEventListenerToSong(element);
    }
    await playbar();
    setupMuteButton();
}

initializePlayer(folder);


// Add event listeners for dragging the seek bar
document.querySelector(".bottomplay").addEventListener("mousedown", (e) => {
    isDraggingSeek = true;
    updateSeekBar(e);
});

document.addEventListener("mousemove", (e) => {
    if (isDraggingSeek) {
        updateSeekBar(e);
    }
});

document.addEventListener("mouseup", () => {
    isDraggingSeek = false;
});

function updateSeekBar(e) {
    const offsetX = e.clientX - document.querySelector(".bottomplay").getBoundingClientRect().left;
    const percentage = (offsetX / document.querySelector(".bottomplay").getBoundingClientRect().width) * 100;
    if (currentsong) {
        currenttime = (currentsong.duration * percentage) / 100;
        currentsong.currentTime = currenttime;
    }
}

// Add event listeners for dragging the volume bar
document.querySelector(".volume").addEventListener("mousedown", (e) => {
    isDraggingVolume = true;
    updateVolumeBar(e);
});

document.addEventListener("mousemove", (e) => {
    if (isDraggingVolume) {
        updateVolumeBar(e);
    }
});

document.addEventListener("mouseup", () => {
    isDraggingVolume = false;
});

function updateVolumeBar(e) {
    const volumeContainer = document.querySelector(".volume");
    const volumeBar = document.querySelector(".volume .volumebar");
    const rect = volumeContainer.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = (offsetX / rect.width) * 100;

    if (currentsong) {
        if (percentage <= 1) {
            currentsong.volume = 0;
            volumeBar.style.width = "0%";
            previousVolume = 0; // Store muted state
            document.querySelector(".rightplay img").src = "images/mute.svg";
            isMuted = true;
        } else if (percentage >= 100) {
            currentsong.volume = 1;
            volumeBar.style.width = "100%";
            previousVolume = 1.0; // Store full volume state
            document.querySelector(".rightplay img").src = "images/volume.svg";
            isMuted = false;
        } else {
            currentsong.volume = percentage / 100;
            volumeBar.style.width = percentage + "%";
            previousVolume = currentsong.volume; // Store current volume state
            document.querySelector(".rightplay img").src = "images/volume.svg";
            isMuted = false;
        }
    }
}

function setupMuteButton() {
    const muteButton = document.querySelector(".rightplay img");
    const volumeBar = document.querySelector(".volume .volumebar");

    muteButton.addEventListener("click", () => {
        if (isMuted) {
            // Unmute
            muteButton.src = "images/volume.svg";
            volumeBar.style.width = (previousVolume * 100) + "%";
            if (currentsong) {
                currentsong.volume = previousVolume;
            }
            isMuted = false;
        } else {
            // Mute
            muteButton.src = "images/mute.svg";
            previousVolume = currentsong.volume; // Store current volume state before muting
            currentsong.volume = 0;
            volumeBar.style.width = "0%";
            isMuted = true;
        }
    });
}

document.querySelector(".volume").addEventListener("mouseenter", (e) => {
    document.querySelector(".rightplay img").style.filter = "invert(100%) sepia(0%) saturate(0%) hue-rotate(5deg) brightness(102%) contrast(102%)";
});

document.querySelector(".volume").addEventListener("mouseleave", (e) => {
    document.querySelector(".rightplay img").style.filter = "invert(84%) sepia(0%) saturate(1737%) hue-rotate(138deg) brightness(84%) contrast(76%)";
});

document.querySelector(".rightplay img").addEventListener("mouseenter", (e) => {
    document.querySelector(".rightplay img").style.filter = "invert(100%) sepia(0%) saturate(0%) hue-rotate(5deg) brightness(102%) contrast(102%)";
});

document.querySelector(".rightplay img").addEventListener("mouseleave", (e) => {
    document.querySelector(".rightplay img").style.filter = "invert(84%) sepia(0%) saturate(1737%) hue-rotate(138deg) brightness(84%) contrast(76%)";
});

document.querySelector(".topplay .shuffle").addEventListener("click", () => {
    isshuffle = !isshuffle;
    if (isshuffle) {
        document.querySelector(".topplay .shuffle").classList.remove("grayall");
        document.querySelector(".topplay .shuffle").classList.add("green");
    } else {
        document.querySelector(".topplay .shuffle").classList.remove("green");
        document.querySelector(".topplay .shuffle").classList.add("grayall");
    }
});

document.querySelector(".topplay .repeat").addEventListener("click", () => {
    if (isrepeat == 0) {
        document.querySelector(".topplay .repeat").classList.remove("grayall")
        document.querySelector(".topplay .repeat").classList.add("green")
        isrepeat = 1;
    }
    else if (isrepeat == 1) {
        document.querySelector(".topplay .repeat").src = "images/repeat2.svg"
        isrepeat = 2;
    }
    else {
        document.querySelector(".topplay .repeat").src = "images/repeat1.svg"
        document.querySelector(".topplay .repeat").classList.remove("green")
        document.querySelector(".topplay .repeat").classList.add("grayall")
        isrepeat = 0;
    }
});

document.querySelector(".topplay .next").addEventListener("click", () => {
    if (currentsong) {
        if (isrepeat == 2) {
            document.querySelector(".topplay .repeat").src = "repeat1.svg";
            isrepeat = 1;
        }
        if (pointer < stack.length - 1) {

            pointer++;
            previoussong = currentsong;
            currentsong = stack[pointer];
            for (const iterator of list) {
                // console.log(iterator.querySelector(".songlink").innerHTML)

                if (iterator.querySelector(".songlink").innerHTML == currentsong.src) {

                    handlePlayButtonClick(iterator);
                }
            }
        }
        else {
            if (isshuffle) {
                previoussong = currentsong;
                do {

                    currindex = Math.floor(Math.random() * songs.length);
                } while (!(stack.includes(currentsong)));
                currentsong = new Audio(songs[currindex]);
            }
            else {
                previoussong = currentsong;
                if (currindex == songs.length - 1) {
                    currindex = 0;
                } else {
                    currindex += 1;
                }
                currentsong = new Audio(songs[currindex]);
                pointer++;
                stack.push(currentsong)
            }
            // visited++;
            // if(visited==songs.length){
            //     stack.splice(0,stack.length)
            //     pointer=-1;
            //     visited=0;
            //     currentsong=null;
            //     }
            handlePlayButtonClick(list[currindex]);
        }
    }
});

document.querySelector(".topplay .previous").addEventListener("click", () => {
    // pauseCurrentSong(list[currindex])
    if (currentsong) {
        if (currentsong.currentTime >= 3 || (pointer == 0)) {
            currentsong.currentTime = 0;
        }
        else {
            previoussong = currentsong;
            pointer--;

            currentsong = stack[pointer];
            if (isrepeat == 2) {
                document.querySelector(".topplay .repeat").src = "repeat1.svg";
                isrepeat = 1;
            }
            for (const iterator of list) {
                // console.log(iterator.querySelector(".songlink").innerHTML)

                if (iterator.querySelector(".songlink").innerHTML == currentsong.src) {

                    handlePlayButtonClick(iterator);
                }
            }

        }
    }
});
function changeSong() {
    if (isrepeat == 2) {
        currentsong.currentTime = 0;
        currentsong.play()
    }
    else {
        if (isshuffle) {
            // do {
            currindex = Math.floor(Math.random() * songs.length);
            // } while (!(stack.includes(currentsong)));
            currentsong = new Audio(songs[currindex]);
        }
        else {
            previoussong = currentsong;
            if (currindex == songs.length - 1) {
                currindex = 0;
            } else {
                currindex += 1;
            }
            currentsong = new Audio(songs[currindex]);
            pointer++;
            stack.push(currentsong);
        }
        handlePlayButtonClick(list[currindex]);
    }
}
setInterval(() => {
    if (currentsong) {
        document.querySelector(".playbar .bottomplay .seekbar").style.width = (currentsong.currentTime / currentsong.duration) * 100 + "%";
        currenttime = currentsong.currentTime;
        document.querySelector(".wholebottom .current").innerHTML = secondstominutesecond(currentsong.currentTime);
        if (currentsong.currentTime == currentsong.duration) {
            changeSong()
        }
    }
}, 10);
document.addEventListener("DOMContentLoaded", () => {
    const fullscreenToggle = document.getElementById('fullscreen-toggle');
    const playerContainer = document.querySelector('.playbar');

    fullscreenToggle.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            playerContainer.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            fullscreenToggle.src = 'images/normalscreen.svg';
            document.querySelector('.playbar').style = "background: linear-gradient(0.45turn,#07aace, #4180bc,#5d57a3,rgb(98, 54, 149)); align-items: end; padding-bottom: 10em";
            document.querySelector('.playbar .fulllogo').style = "display: block";
            playerContainer.querySelector(".leftplay").style = "position: absolute; left: 7em; bottom: 14em; width: 100%; align-items: end";
            playerContainer.querySelector(".leftplay marquee").style = "display: none";
            playerContainer.querySelector(".leftplay .p").style = "font-size: x-large;";
            playerContainer.querySelector(".leftplay .album").style = "height: 100px; width: 100px;animation: resize 2s ease-in 1;";
            playerContainer.querySelector(".rightplay").style = "position: absolute; right: 1em; bottom: -15em;";
            playerContainer.querySelector(".middleplay").style.width = "100%";
            playerContainer.querySelector(".middleplay .topplay").style = "position: absolute; bottom: -3em";
            playerContainer.querySelector(".bottomplay").style.width = "90%";
            playerContainer.querySelector(".wholebottom").style= "display:flex;";
            playerContainer.querySelector(".shuffle").style= "display:flex;";
            playerContainer.querySelector(".repeat").style= "display:flex;";
            playerContainer.querySelector(".next").style= "display:flex;";
            playerContainer.querySelector(".previous").style= "display:flex;";
            playerContainer.querySelector(".current").style.width = "5%";
            playerContainer.querySelector(".duration").style.width = "5%";
            document.body.classList.add('fullscreen');
        }
        else {
            fullscreenToggle.src = 'images/fullscreen.svg';
            document.querySelector('.playbar').style = "";
            document.querySelector('.playbar .fulllogo').style = "";
            playerContainer.querySelector(".leftplay").style = "";
            playerContainer.querySelector(".leftplay marquee").style = "";
            playerContainer.querySelector(".leftplay .p").style = "";
            playerContainer.querySelector(".leftplay .album").style = "";
            playerContainer.querySelector(".rightplay").style = "";
            playerContainer.querySelector(".middleplay").style.width = "";
            playerContainer.querySelector(".middleplay .topplay").style = "";
            playerContainer.querySelector(".bottomplay").style.width = "";
            playerContainer.querySelector(".current").style.width = "";
            playerContainer.querySelector(".duration").style.width = "";
            document.body.classList.remove('fullscreen');
        }
    });
});
document.querySelector(".menu").addEventListener("click", () => {
    console.log('this is the menu')
    document.querySelector(".left").style = "display:flex; transform:translateX(0px);;opacity:1"
})
document.querySelector(".cross").addEventListener("click", () => {
    console.log('this is the menu')
    document.querySelector(".left").style = " "
})