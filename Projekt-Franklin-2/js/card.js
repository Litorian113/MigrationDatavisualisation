// Wait until the entire window (including the globe) has fully loaded
window.addEventListener('load', function () {
    console.log('Window loaded, initializing event listeners');

    // Function to close the info card and stop the audio
    function closeInfoCard(cardId, audioPlayer, isPlaying) {
        document.getElementById(cardId).style.display = 'none';
        
        // Stop and reset the audio if it is playing
        if (!audioPlayer.paused) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0; // Reset the audio to the start
            isPlaying = false; // Reset the state
        }
        return isPlaying; // Return updated state
    }

    // Function to handle audio play/pause
    function handleAudio(audioPlayer, isPlaying) {
        if (!isPlaying) {
            audioPlayer.play();
            isPlaying = true;
        } else {
            audioPlayer.pause();
            isPlaying = false;
        }
        return isPlaying;
    }

    // Initialize for InfoCard 1
    let isPlaying1 = false;
    const closeBtn1 = document.getElementById('closeBtn');
    const audioBtn1 = document.getElementById('audioBtn');
    const audioPlayer1 = document.getElementById('audioPlayer');

    closeBtn1.addEventListener('click', function () {
        isPlaying1 = closeInfoCard('infoCard', audioPlayer1, isPlaying1);
    });

    audioBtn1.addEventListener('click', function (event) {
        event.stopPropagation();
        isPlaying1 = handleAudio(audioPlayer1, isPlaying1);
    });

    // Initialize for InfoCard 2
    let isPlaying2 = false;
    const closeBtn2 = document.getElementById('closeBtn2');
    const audioBtn2 = document.getElementById('audioBtn2');
    const audioPlayer2 = document.getElementById('audioPlayer2');

    closeBtn2.addEventListener('click', function () {
        isPlaying2 = closeInfoCard('infoCard2', audioPlayer2, isPlaying2);
    });

    audioBtn2.addEventListener('click', function (event) {
        event.stopPropagation();
        isPlaying2 = handleAudio(audioPlayer2, isPlaying2);
    });

    // // Initialize for InfoCard 3
    // let isPlaying3 = false;
    // const closeBtn3 = document.getElementById('closeBtn3');
    // const audioBtn3 = document.getElementById('audioBtn3');
    // const audioPlayer3 = document.getElementById('audioPlayer3');

    // closeBtn3.addEventListener('click', function () {
    //     isPlaying3 = closeInfoCard('infoCard3', audioPlayer3, isPlaying3);
    // });

    // audioBtn3.addEventListener('click', function (event) {
    //     event.stopPropagation();
    //     isPlaying3 = handleAudio(audioPlayer3, isPlaying3);
    // });

    // // Initialize for InfoCard 4
    // let isPlaying4 = false;
    // const closeBtn4 = document.getElementById('closeBtn4');
    // const audioBtn4 = document.getElementById('audioBtn4');
    // const audioPlayer4 = document.getElementById('audioPlayer4');

    // closeBtn4.addEventListener('click', function () {
    //     isPlaying4 = closeInfoCard('infoCard4', audioPlayer4, isPlaying4);
    // });

    // audioBtn4.addEventListener('click', function (event) {
    //     event.stopPropagation();
    //     isPlaying4 = handleAudio(audioPlayer4, isPlaying4);
    // });

    // // Initialize for InfoCard 5
    // let isPlaying5 = false;
    // const closeBtn5 = document.getElementById('closeBtn5');
    // const audioBtn5 = document.getElementById('audioBtn5');
    // const audioPlayer5 = document.getElementById('audioPlayer5');

    // closeBtn5.addEventListener('click', function () {
    //     isPlaying5 = closeInfoCard('infoCard5', audioPlayer5, isPlaying5);
    // });

    // audioBtn5.addEventListener('click', function (event) {
    //     event.stopPropagation();
    //     isPlaying5 = handleAudio(audioPlayer5, isPlaying5);
    // });

    // // Initialize for InfoCard 6
    // let isPlaying6 = false;
    // const closeBtn6 = document.getElementById('closeBtn6');
    // const audioBtn6 = document.getElementById('audioBtn6');
    // const audioPlayer6 = document.getElementById('audioPlayer6');

    // closeBtn6.addEventListener('click', function () {
    //     isPlaying6 = closeInfoCard('infoCard6', audioPlayer6, isPlaying6);
    // });

    // audioBtn6.addEventListener('click', function (event) {
    //     event.stopPropagation();
    //     isPlaying6 = handleAudio(audioPlayer6, isPlaying6);
    // });

    // // Initialize for InfoCard 7
    // let isPlaying7 = false;
    // const closeBtn7 = document.getElementById('closeBtn7');
    // const audioBtn7 = document.getElementById('audioBtn7');
    // const audioPlayer7 = document.getElementById('audioPlayer7');

    // closeBtn7.addEventListener('click', function () {
    //     isPlaying7 = closeInfoCard('infoCard7', audioPlayer7, isPlaying7);
    // });

    // audioBtn7.addEventListener('click', function (event) {
    //     event.stopPropagation();
    //     isPlaying7 = handleAudio(audioPlayer7, isPlaying7);
    // });

    // // Initialize for InfoCard 8
    // let isPlaying8 = false;
    // const closeBtn8 = document.getElementById('closeBtn8');
    // const audioBtn8 = document.getElementById('audioBtn8');
    // const audioPlayer8 = document.getElementById('audioPlayer8');

    // closeBtn8.addEventListener('click', function () {
    //     isPlaying8 = closeInfoCard('infoCard8', audioPlayer8, isPlaying8);
    // });

    // audioBtn8.addEventListener('click', function (event) {
    //     event.stopPropagation();
    //     isPlaying8 = handleAudio(audioPlayer8, isPlaying8);
    // });

    // // Initialize for InfoCard 9
    // let isPlaying9 = false;
    // const closeBtn9 = document.getElementById('closeBtn9');
    // const audioBtn9 = document.getElementById('audioBtn9');
    // const audioPlayer9 = document.getElementById('audioPlayer9');

    // closeBtn9.addEventListener('click', function () {
    //     isPlaying9 = closeInfoCard('infoCard9', audioPlayer9, isPlaying9);
    // });

    // audioBtn9.addEventListener('click', function (event) {
    //     event.stopPropagation();
    //     isPlaying9 = handleAudio(audioPlayer9, isPlaying9);
    // });

    // // Initialize for InfoCard 10
    // let isPlaying10 = false;
    // const closeBtn10 = document.getElementById('closeBtn10');
    // const audioBtn10 = document.getElementById('audioBtn10');
    // const audioPlayer10 = document.getElementById('audioPlayer10');

    // closeBtn10.addEventListener('click', function () {
    //     isPlaying10 = closeInfoCard('infoCard10', audioPlayer10, isPlaying10);
    // });

    // audioBtn10.addEventListener('click', function (event) {
    //     event.stopPropagation();
    //     isPlaying10 = handleAudio(audioPlayer10, isPlaying10);
    // });

    // // Initialize for InfoCard 11
    // let isPlaying11 = false;
    // const closeBtn11 = document.getElementById('closeBtn11');
    // const audioBtn11 = document.getElementById('audioBtn11');
    // const audioPlayer11 = document.getElementById('audioPlayer11');

    // closeBtn11.addEventListener('click', function () {
    //     isPlaying11 = closeInfoCard('infoCard11', audioPlayer11, isPlaying11);
    // });

    // audioBtn11.addEventListener('click', function (event) {
    //     event.stopPropagation();
    //     isPlaying11 = handleAudio(audioPlayer11, isPlaying11);
    // });
});
