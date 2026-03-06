import Phaser from 'phaser'

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene')
    }
    preload() {
        this.load.image('logo', 'logo.png');
        this.load.image('startkopce', 'start-kopce.png');
        this.load.image('menupozadina', 'menupozadina.jpg');
    }
    create() {

        this.bg = this.add.tileSprite(350, 450, 700, 900, 'menupozadina')
            .setScale(1)
            .setTint(0x888888);
        const { width, height } = this.scale

        // this.add.text(width/2, height/2 - 100, 'Orbit Rebellion', {
        //     fontSize: '50px',
        //     color: '#00ffff'
        // }).setOrigin(0.5)
        // Gradient текст со светкава боја
        let logo = this.add.image(width/2, height/2.5 - 100, 'logo')
            .setOrigin(0.5)   // центрирање
            .setScale(0.8);

        // const startBtn = this.add.text(width/2, height/2 + 50, 'START GAME', {
        //     fontSize: '32px',
        //     backgroundColor: '#00c853',
        //     padding: { x: 30, y: 15 }
        // })
        //     .setOrigin(0.5)
        //     .setInteractive({ useHandCursor: true })
        //
        // startBtn.on('pointerdown', () => {
        //     this.cameras.main.fadeOut(300)
        //
        //     this.time.delayedCall(300, () => {
        //         this.scene.start('MainScene')
        //     })
        // })

// 2. create
        const startBtn = this.add.image(width/2, height/2 + 50, 'startkopce').setScale(0.7)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

// 3. hover ефект (опционално)
        startBtn.on('pointerover', () => {
            startBtn.setScale(0.75); // малку зголемување при hover
        });

        startBtn.on('pointerout', () => {
            startBtn.setScale(0.7);
        });

// 4. click event
        startBtn.on('pointerdown', () => {
            startBtn.setScale(0.65); // малку „press“ ефект
            this.cameras.main.fadeOut(300);

            this.time.delayedCall(300, () => {
                this.scene.start('MainScene');
            });
        });

    }
}