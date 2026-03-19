window.State = {
    W: 360, H: 640,
    GRAVITY: 0.5,
    JUMP_FORCE: -9,
    PIPE_WIDTH: 60,
    PIPE_GAP: 155,
    PIPE_SPEED: 2.8,
    PIPE_INTERVAL: 90,
    BIRD_X: 80,
    BIRD_SIZE: 26,
    GROUND_H: 80,
  
    STATES: { MENU: 0, PLAYING: 1, DEAD: 2 },
  
    current: 0,       // current STATE
    frame: 0,
    score: 0,
    highScore: Number(localStorage.getItem('flappy_hs') || 0),
    newBest: false,
    flashTimer: 0,
    milestoneTimer: 0,
    milestoneText: '',
    shakeX: 0,
    shakeY: 0,
    shakePower: 0,
  
    bird: null,
    pipes: [],
  
    triggerShake(power) {
      this.shakePower = power;
    },
  
    updateShake() {
      if (this.shakePower > 0.1) {
        this.shakeX = (Math.random() - 0.5) * this.shakePower;
        this.shakeY = (Math.random() - 0.5) * this.shakePower;
        this.shakePower *= 0.8;
      } else {
        this.shakeX = 0; this.shakeY = 0; this.shakePower = 0;
      }
    },
  
    reset() {
      this.score = 0;
      this.frame = 0;
      this.flashTimer = 0;
      this.newBest = false;
      this.milestoneTimer = 0;
      this.shakePower = 0;
      this.pipes = [];
    },
  };