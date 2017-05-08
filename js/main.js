import * as Util from './util.js';

$(() => {
let backgrounds = [
    'linear-gradient(0deg, #191414, #F0401C)',
    'linear-gradient(0deg, #191414, #1C51C7)',
    'linear-gradient(0deg, #191414, #619406)',
    'linear-gradient(0deg, #191414, #F01F59)'
  ];
  Util.shuffle(backgrounds);
  $('body').css('background', backgrounds[0]);

 $('#guest-login-button').click(() => {
   $('#login').hide();
   $('#loggedin').show();
 });

 $('#start-button').click(handleStartClick);

});

let userPlaylists;
let duration = 0;
let level;
let songs;
let questions;
let currentQuestion;
let answers;
let numRight = 0;

const handleStartClick = () => {
  $('#start-button').remove();
  //get userPlaylists if user signed in
  if (sessionStorage.accessToken){
    console.log('non-guest');
    $.ajax({
      url: 'https://api.spotify.com/v1/me/playlists',
      headers: {
        'Authorization': 'Bearer ' + sessionStorage.accessToken
      }
    }).then((response)=>{
      userPlaylists = Util.playlistMapping(response);
      console.log(userPlaylists);
      // sessionStorage.setItem('userPlaylists', JSON.stringify(Util.playlistMapping(response)));
    });
  }
  $('.body').append(difficultySettings());
  $('.settings').show('slow');
  $(".difficulty").click(handleDifficultyClick);
};


const difficultySettings = () => {
  return (
    `<div class="settings hidden">
      <h3>difficulty</h3>
      <div class="settings-difficulty">
        ${Util.divMapper("difficulty button", ["Pedestrian", "Mediocre", "Tough", "Insane", "Masochistic" ])}
      </div>
    </div>`);
};

const addPlaylistSettings = () => {
  $('.body').append(`<h3 class="label">Choose a playlist:<h3><div class="playlists"></div>`);
  if (userPlaylists){
    $('.playlists').append(Util.playlistMapper("user-playlist",userPlaylists));
    $('.user-playlist').click(handleUserPlaylistClick);
  }
  $('.playlists').append(Util.defaultPlaylists());
  $('.default-playlist').click(handleDefaultPlaylistClick);
};



const handleDifficultyClick = (e) => {
  level = e.currentTarget.textContent;
  duration = Util.durationMapping(level);
  $(e.currentTarget).parent().parent().remove();
  addPlaylistSettings();
};

const handleUserPlaylistClick = (e) => {
  $.ajax({
    url: e.currentTarget.attributes.url.value,
    headers: {
      'Authorization': 'Bearer ' + sessionStorage.accessToken
    }
  }).then((response)=>{
    songs = Util.validSongs(response.items);
    handlePlaylistSelection();
  });
};

const handleDefaultPlaylistClick = (e) => {
  songs = Util.playlistToSongsMapping(e.currentTarget.attributes.name.value);
  handlePlaylistSelection();
};

const handlePlaylistSelection = () => {
  $('.label').fadeOut(300, function(){ $(this).remove();});
  $('.playlists').fadeOut(300, function(){ $(this).remove();});
  Util.shuffle(songs);
  questions = songs.slice(0,10);
  currentQuestion = questions.shift();
  $('.body').append("<div id='myProgress'><div id='myBar'></div></div>");
  showQuestion(currentQuestion);
};

const showQuestion = (question) => {
  var buttonAudio = $(`<div class="button-audio">
    <div id="play"><i class="fa fa-play fa-3x play-icon" aria-hidden="true"></i></div>
    <audio id="audio" src=${question.url}/>
  </div>`);
  $('.body').append(buttonAudio);
  answers = getOtherAnswers(question);
  buttonAudio.click(play);
  var audio = document.getElementById("audio");
  $(audio).on("timeupdate", () => {
    if (audio.currentTime > duration){
      audio.pause();
      audio.remove();
    }
  });
};

const getOtherAnswers = (question) => {
  let holder = [question.name];
  Util.shuffle(songs);
  let i = 0;
  while(holder.length < 4){
    if (songs[i].name !== question.name){
      holder.push(songs[i].name);
    }
    i++;
  }
  return Util.shuffle(holder);
};

const htmlAnswers = (answrs) => {
  return (
    `<div class="button answer">${answrs[0]}</div>
    <div class="button answer">${answrs[1]}</div>
    <div class="button answer">${answrs[2]}</div>
    <div class="button answer">${answrs[3]}</div>`
  );
};

const handleAnswerClick = (e) => {
  var audio = document.getElementById("audio");
  if (audio){
    audio.pause();
    audio.remove();
  }
  $('.answer').remove();
  if (e.currentTarget.textContent === currentQuestion.name){
    numRight += 1;
    $('#myBar').animate({ width: "+=10%" }, 500 );
    console.log(numRight);
  }
  if (questions.length > 0){
    currentQuestion = questions.shift();
    showQuestion(currentQuestion);
  }else{
    $('.body').append(`<h3>${numRight}/10 right!</h3>`);
    console.log(numRight);
  }
};

// $("#play").click(play());
// $( "#play" ).on("click", () => {
//   play();
// });

const play = () => {
  var audio = document.getElementById("audio");
  audio.play();
  $( "#play" ).remove();
  $('.body').append(htmlAnswers(answers));
  $('.answer').on('click', (e) => handleAnswerClick(e));
};
