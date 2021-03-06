
var currentAlbum = null;
var currentlyPlayingSongNumber = null;
var currentSongFromAlbum = null;
var currentSoundFile = null;
var currentVolume = 40;

var createSongRow = function(songNumber, songName, songLength) {
  var template =
    '<tr class="album-view-song-item">'
    + ' <td class="song-item-number" data-song-number="' + songNumber + '">' + songNumber + '</td>'
    + ' <td class="song-item-title">' + songName + '</td>'
    + ' <td class="song-item-duration">' + filterTimeCode(songLength) + '<td>'
    + '</tr>'
    ;

  var $row = $(template);
  $row.find('.song-item-number').click(clickHandler);
  $row.hover(onHover, offHover);
  return $row;
};

var setSong = function(songNumber) {
  if (currentSoundFile) {
    currentSoundFile.stop();
  }
  currentlyPlayingSongNumber = parseInt(songNumber);
  currentSongFromAlbum = currentAlbum.songs[songNumber - 1];
  currentSoundFile = new buzz.sound(currentSongFromAlbum.audioUrl, {
    formats: [ 'mp3' ],
    preload: true
  });

  setVolume(currentVolume);
};

var setVolume = function(volume) {
  if (currentSoundFile) {
    currentSoundFile.setVolume(volume);
  }
};

var getSongNumberCell = function(number) {
  return $('.song-item-number[data-song-number="' + number + '"]');
};

var clickHandler = function() {
  var songNumber = parseInt($(this).attr('data-song-number'));
  if (currentlyPlayingSongNumber !== null) {
    var currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);
    currentlyPlayingCell.html(currentlyPlayingSongNumber);
  }

  if (currentlyPlayingSongNumber !== songNumber) {
      $(this).html(pauseButtonTemplate);
      setSong(songNumber);
      currentSoundFile.play();
      updatePlayerBarSong();
      updateSeekBarWhileSongPlays();
      var $volumeFill = $('.volume .fill');
      var $volumeThumb = $('.volume .thumb');
      $volumeFill.width(currentVolume + '%');
      $volumeThumb.css = ({left: currentVolume + '%'});

  } else if (currentlyPlayingSongNumber === songNumber) {
      $(this).html(playButtonTemplate);
      $('.main-controls .play-pause').html(playerBarPlayButton);

      if (currentSoundFile.isPaused()) {
        currentSoundFile.play();
        updateSeekBarWhileSongPlays();
        $(this).html(pauseButtonTemplate);
        $('.main-controls .play-pause').html(playerBarPauseButton);
      } else if (currentSoundFile.isPaused() === false) {
        currentSoundFile.pause();
        $(this).html(playButtonTemplate);
        $('.main-controls .play-pause').html(playerBarPlayButton);
      }
    // currentlyPlayingSongNumber = null;
    // currentSongFromAlbum = null;
  }
};

var onHover = function(event) {
  var songNumberCell = $(this).find('.song-item-number');
  var songNumber = parseInt(songNumberCell.attr('data-song-number'));
  if (songNumber !== currentlyPlayingSongNumber) {
    songNumberCell.html(playButtonTemplate);
  }
};

var offHover = function(event){
  var songNumberCell = $(this).find('.song-item-number');
  var songNumber = parseInt(songNumberCell.attr('data-song-number'));
  if (songNumber !== currentlyPlayingSongNumber) {
    songNumberCell.html(songNumber);
    // console.log("songNumber type is " + typeof songNumber + "\n and currentlyPlayingSongNumber type is " + typeof currentlyPlayingSongNumber);
  }
};

var setCurrentAlbum = function(album) {
    currentAlbum = album;
    var $albumTitle = $('.album-view-title');
    var $albumArtist = $('.album-view-artist');
    var $albumReleaseInfo = $('.album-view-release-info');
    var $albumImage = $('.album-cover-art');
    var $albumSongList = $('.album-view-song-list');

    $albumTitle.text(album.title);
    $albumArtist.text(album.artist);
    $albumReleaseInfo.text(album.year + ' ' + album.label);
    $albumImage.attr('src', album.albumArtUrl);

    $albumSongList.empty();

    for (var i = 0; i < album.songs.length; i++) {
        var $newRow = createSongRow(i + 1, album.songs[i].title, album.songs[i].duration);
        $albumSongList.append($newRow);
    }
};


var trackIndex = function(album, song) {
  return album.songs.indexOf(song);
};

var seek = function(time) {
  if (currentSoundFile) {
    currentSoundFile.setTime(time);
  }
};

var setupSeekBars = function() {
  var $seekBars = $('.player-bar .seek-bar');
  $seekBars.click(function(event) {
    var offsetX = event.pageX - $(this).offset().left;
    var barWidth = $(this).width();
    var seekBarFillRatio = offsetX / barWidth;
      if ($(this).parent().attr('class') == 'seek-control') {
        seek(seekBarFillRatio * currentSoundFile.getDuration());
      } else {
        setVolume(seekBarFillRatio * 100);
      }
    updateSeekPercentage($(this), seekBarFillRatio);
  });

  $seekBars.find('.thumb').mousedown(function(event) {
    var $seekBar = $(this).parent();

    $(document).bind('mousemove.thumb', function(event) {
      var offsetX = event.pageX - $seekBar.offset().left;
      var barWidth = $seekBar.width();
      var seekBarFillRatio = offsetX / barWidth;
      if ($seekBar.parent().attr('class') == 'seek-control'){
        seek(seekBarFillRatio * currentSoundFile.getDuration());
      } else {
        setVolume(seekBarFillRatio);
      }

      updateSeekPercentage($seekBar, seekBarFillRatio);
    });
    $(document).bind('mouseup.thumb', function() {
      $(document).unbind('mousemove.thumb');
      $(document).unbind('mouseup.thumb');
    });
  });
};

var setCurrentTimeInPlayerBar = function(currentTime) {
  var $currTime = $('.current-time');
  $currTime.text(currentTime);
};

var setTotalTimeInPlayerBar = function(totalTime) {
  var $totTime = $('.total-time');
  $totTime.text(totalTime);
};

var filterTimeCode = function(timeInSeconds) {
  var $timeSeconds = parseFloat(timeInSeconds);
  var $timeMinutes = Math.floor($timeSeconds / 60);
  var $remainingSeconds = "0" + Math.floor(timeInSeconds % 60);
  return $timeMinutes + ":" + $remainingSeconds.substr(-2);
};


var updateSeekBarWhileSongPlays = function() {
  if (currentSoundFile) {
    currentSoundFile.bind('timeupdate', function(event) {
      var seekBarFillRatio = this.getTime() / this.getDuration();
      var $seekBar = $('.seek-control .seek-bar');

      updateSeekPercentage($seekBar, seekBarFillRatio);
      setCurrentTimeInPlayerBar(filterTimeCode(this.getTime()));
      setTotalTimeInPlayerBar(filterTimeCode(this.getDuration()));
    });
  }
};

var updateSeekPercentage = function($seekBar, seekBarFillRatio) {
  var offsetXPercent = seekBarFillRatio * 100;

  offsetXPercent = Math.max(0, offsetXPercent);
  offsetXPercent = Math.min(100, offsetXPercent);
  // convert percentage to string
  var percentageString = offsetXPercent + "%";
  $seekBar.find('.fill').width(percentageString);
  $seekBar.find('.thumb').css({left: percentageString});
};



var nextSong = function() {
  var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);
  currentSongIndex++;

  if (currentSongIndex >= currentAlbum.songs.length) {
    currentSongIndex = 0;
  }
  // save the last song number before changing it
  var lastSongNumber = currentlyPlayingSongNumber;

  // set a new current song
  setSong(currentSongIndex + 1);
  currentSoundFile.play()
  updateSeekBarWhileSongPlays();

  // update the player bar information
  updatePlayerBarSong();

  var $nextSongNumberCell = $('.song-item-number[data-song-number="' + currentlyPlayingSongNumber + '"]');
  var $lastSongNumberCell = $('.song-item-number[data-song-number="' + lastSongNumber + '"]');

  $nextSongNumberCell.html(pauseButtonTemplate);
  $lastSongNumberCell.html(lastSongNumber);
};

var previousSong = function() {
  var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);
  currentSongIndex--;

  if (currentSongIndex < 0) {
    currentSongIndex = currentAlbum.songs.length - 1;
  }
  // save the last song number before changing it
  var lastSongNumber = currentlyPlayingSongNumber;

  // set a new current song
  setSong(currentSongIndex + 1);
  currentSoundFile.play();
  updateSeekBarWhileSongPlays();

  // update the player bar information
  updatePlayerBarSong();
  $('main-controls .play-pause').html(playerBarPauseButton);

  var $nextSongNumberCell = $('.song-item-number[data-song-number="' + currentlyPlayingSongNumber + '"]');
  var $lastSongNumberCell = $('.song-item-number[data-song-number="' + lastSongNumber + '"]');

  $nextSongNumberCell.html(pauseButtonTemplate);
  $lastSongNumberCell.html(lastSongNumber);
};

var playButtonTemplate = '<a class="album-song-button"><span class="ion-play"></span></a>';
var pauseButtonTemplate = '<a class="album-song-button"><span class="ion-pause"></span></a>';
var playerBarPlayButton = '<span class="ion-play"></span>';
var playerBarPauseButton = '<span class="ion-pause"><pan>';

var updatePlayerBarSong = function() {
  $('.currently-playing .song-name').text(currentSongFromAlbum.title);
  $('.currently-playing .artist-name').text(currentAlbum.artist);
  $('.currently-playing .artist-song-mobile').text(currentSongFromAlbum.title + " - " + currentAlbum.artist);
  // $('.main-controls .play-pause').html(playerBarPauseButton);
};

var togglePlayFromPlayerBar = function() {
  if (currentSoundFile.isPaused()) {
    $('.main-controls .play-pause').html(playerBarPauseButton);
    $('.song-item-number[data-song-number="' + currentlyPlayingSongNumber + '"]').html(pauseButtonTemplate);
    currentSoundFile.play();

  } else {
    $('.main-controls .play-pause').html(playerBarPlayButton);
    $('.song-item-number[data-song-number="' + currentlyPlayingSongNumber + '"]').html(playButtonTemplate);
    currentSoundFile.pause();
  }
};

var $previousButton = $('.main-controls .previous');
var $nextButton = $('.main-controls .next');
var $playerBarToggle = $('.main-controls .play-pause');

$(document).ready(function() {
    setCurrentAlbum(albumCables);
    setupSeekBars();
    $previousButton.click(previousSong);
    $nextButton.click(nextSong);
    $playerBarToggle.click(togglePlayFromPlayerBar);
});
