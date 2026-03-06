import Phaser from 'phaser'

export default class FinalBoss extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'finalBoss')

        scene.add.existing(this)
        scene.physics.add.existing(this)

        this.scene = scene

        this.moveTime = 0;

        this.setScale(0.8)
        this.setCollideWorldBounds(true)

        this.maxHealth = 2000
        this.health = this.maxHealth

        this.speed = 100
        this.moveRange = 200
        this.startX = x


        this.isFinalBoss = true

        this.body.setImmovable(true)

        // boss bullets group
        this.bossBullets = scene.physics.add.group()

        // shooting timer
        this.shootEvent = scene.time.addEvent({
            delay: 3500,
            loop: true,
            callback: this.shoot,
            callbackScope: this,
            startAt: 0
        })

        // big health bar
        this.healthBar = scene.add.graphics()
        this.updateHealthBar()

        this.moveRangeY = 50;

        // Почетна Y позиција е над екранот
        this.startY = -200;
        this.isEntering = true;
        this.y = this.startY;


        this.isPhaseTwo = false;
        this.spiralAngle = 0; // за специјалниот напад во втора фаза
    }

    update() {
        if (!this.active || this.isDying) return;

        // Го зголемуваме времето за синус движењето
        this.moveTime += this.scene.game.loop.delta;

        // 1. Движење ЛЕВО-ДЕСНО преку Velocity (за да нема телепортирање)
        // Користиме Cosine за брзината за да добиеме Sine по позиција
        const speedX = Math.cos(this.moveTime / 1000) * this.speed;
        this.body.setVelocityX(speedX);

        // 2. Логика за ВЛЕГУВАЊЕ и вертикално движење
        if (this.isEntering) {
            this.body.setVelocityY(150); // Паѓа надолу со константна брзина

            if (this.y >= 150) {
                this.isEntering = false;
                this.startY = 150;
                this.body.setVelocityY(0); // Стопирај го паѓањето
            }
        } else {
            // Вертикално синусно движење откако ќе влезе
            // Наместо this.y =, користиме поместување на брзината
            const speedY = Math.cos(this.moveTime / 1500) * 40;
            this.body.setVelocityY(speedY);
        }

        this.updateHealthBar();

        // Чистење на куршуми
        this.bossBullets.children.iterate(bullet => {
            if (bullet && bullet.y > this.scene.scale.height + 50) {
                bullet.destroy();
            }
        });
    }

    shoot() {
        if (!this.active || this.isEntering) return;

        // СЕКОГАШ: Стандарден spread напад (твојот код)
        const bulletCount = 7;
        const spread = 300;
        for (let i = 0; i < bulletCount; i++) {
            const bullet = this.bossBullets.create(this.x, this.y + 50, 'bossBullet');
            bullet.setScale(0.3);
            const velocityX = -spread/2 + (spread/(bulletCount-1)) * i;
            bullet.setVelocity(velocityX, 300);
        }

        // САМО ВО ВТОРА ФАЗА: Дополнителен спирален напад
        if (this.isPhaseTwo) {
            for (let i = 0; i < 8; i++) {
                const angle = this.spiralAngle + (i * Math.PI / 4);
                const vx = Math.cos(angle) * 200;
                const vy = Math.sin(angle) * 200;

                const b = this.bossBullets.create(this.x, this.y, 'bossBullet');
                b.setScale(0.2);
                b.setTint(0xffff00); // Поразлична боја за овие куршуми
                b.setVelocity(vx, vy);
            }
            this.spiralAngle += 0.4; // Ротирај го аголот за следното пукање
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.updateHealthBar();

        // Логиката за втора фаза се активира во позадина (брзина, пукање)
        if (this.health <= 1000 && !this.isPhaseTwo) {
            this.startPhaseTwo();
        }

        // СЕКОГАШ поцрвенува само кога е погоден
        this.setTint(0xff0000);

        this.scene.tweens.add({
            targets: this,
            scale: 0.85,
            duration: 50,
            yoyo: true
        });

        // По 100мс секогаш чисти ја бојата (clearTint)
        this.scene.time.delayedCall(100, () => {
            if (this.active) {
                this.clearTint();
            }
        });

        if (this.health <= 0) {
            this.die();
        }
    }

    startPhaseTwo() {
        if (this.isPhaseTwo) return;

        this.isPhaseTwo = true;
        this.speed = 250; // Босот станува побрз (ова останува)

        // Ефект на камера за играчот да почувствува дека влегол во втора фаза
        this.scene.cameras.main.shake(500, 0.01);

        // Го менуваме тајмерот за пукање на побрзо
        if (this.shootEvent) {
            this.shootEvent.destroy();
            this.shootEvent = this.scene.time.addEvent({
                delay: 2000,
                loop: true,
                callback: this.shoot,
                callbackScope: this
            });
        }
    }

    updateHealthBar() {
        const width = 400
        const height = 15

        const x = this.scene.scale.width / 2 - width / 2
        const y = 30

        this.healthBar.clear()

        this.healthBar.fillStyle(0xff0000)
        this.healthBar.fillRect(x, y, width, height)

        const hpWidth = (this.health / this.maxHealth) * width

        this.healthBar.fillStyle(0x00ff00)
        this.healthBar.fillRect(x, y, hpWidth, height)
    }

    die() {
        if (this.isDying) return
        this.isDying = true

        // Стопирај го пукањето веднаш
        if (this.shootEvent) {
            this.shootEvent.remove()
        }

        // Исклучи физика за да не прима веќе удари
        this.body.enable = false
        this.setVisible(false) // Скриј го додека чекаш уништување

        // Уништи ги куршумите на босот
        if (this.bossBullets) {
            this.bossBullets.clear(true, true)
        }

        // Уништи health bar
        if (this.healthBar) {
            this.healthBar.destroy()
        }

        // Експлозија
        this.scene.createExplosion(this.x, this.y, {
            scale: 2,
            duration: 1000
        })

        // Повикај victory и уништи го објектот на крајот од фрејмот
        this.scene.time.delayedCall(100, () => {
            this.scene.triggerVictory()
            this.destroy()
        })


    }
}