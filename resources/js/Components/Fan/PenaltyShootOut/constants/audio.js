/**
 * @module constants/audio
 * Map logical sound ids → asset paths (place files under public/sounds/penalty/).
 */

export const SOUND_IDS = Object.freeze({
    crowd: 'crowd',
    kick: 'kick',
    goal: 'goal',
    save: 'save',
    whistle: 'whistle',
    net: 'net',
    crossbar: 'crossbar',
    post: 'post',
    steps: 'steps',
    ambient: 'ambient',
    uiClick: 'uiClick',
    countdown: 'countdown',
    celebration: 'celebration',
    replayMusic: 'replayMusic',
});

export const SOUND_URLS = Object.freeze({
    [SOUND_IDS.crowd]: '/sounds/penalty/crowd.mp3',
    [SOUND_IDS.kick]: '/sounds/penalty/kick.mp3',
    [SOUND_IDS.goal]: '/sounds/penalty/goal.mp3',
    [SOUND_IDS.save]: '/sounds/penalty/save.mp3',
    [SOUND_IDS.whistle]: '/sounds/penalty/whistle.mp3',
    [SOUND_IDS.net]: '/sounds/penalty/net.mp3',
    [SOUND_IDS.crossbar]: '/sounds/penalty/crossbar.mp3',
    [SOUND_IDS.post]: '/sounds/penalty/post.mp3',
    [SOUND_IDS.steps]: '/sounds/penalty/steps.mp3',
    [SOUND_IDS.ambient]: '/sounds/penalty/ambient.mp3',
    [SOUND_IDS.uiClick]: '/sounds/penalty/ui-click.mp3',
    [SOUND_IDS.countdown]: '/sounds/penalty/countdown.mp3',
    [SOUND_IDS.celebration]: '/sounds/penalty/celebration.mp3',
    [SOUND_IDS.replayMusic]: '/sounds/penalty/replay.mp3',
});

export const AUDIO_CHANNELS = Object.freeze({
    sfx: 'sfx',
    music: 'music',
    ambient: 'ambient',
    ui: 'ui',
});
