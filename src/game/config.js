import MenuScene from './scenes/MenuScene'
import MainScene from './scenes/MainScene'

const config = {
    type: Phaser.AUTO,
    width: 700,
    height: 900,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: [MenuScene, MainScene],
}

export default config
