import Phaser from 'phaser'
import FastEnemy from '../enemies/FastEnemy'
import NormalEnemy from '../enemies/NormalEnemy'
import MiniBoss from '../enemies/MiniBoss'
import FinalBoss from '../enemies/FinalBoss'


export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene')
    }

    preload() {
        this.load.image('player', 'igrac.png')
        this.load.image('fastEnemy', 'meteor.png')
        this.load.image('normalEnemy', 'normalEnemy.png')
        this.load.image('miniBoss', 'miniBoss.png')
        this.load.image('restartkopce', 'restart-kopce.png')
        this.load.image('backtomenukopce', 'back-to-menu-kopce.png')
        this.load.image('finalBoss', 'finalBoss.png')
        this.load.image('bossBullet', 'bossBullet.png')

        this.load.image('bullet', 'kursum.png')
        this.load.image('bg', 'pozadina.jpg')

        this.load.image('full_heart', 'full_heart.png')
        this.load.image('empty_heart', 'empty_heart.png')

        this.load.image('explosion', 'explosion.png')

        this.load.image('repair', 'power-up-repair.png')
        this.load.image('attack-speed', 'power-up-attack-speed.png')
        this.load.image('damageIncrease', 'power-up-dmg.png')
        this.load.image('double-dmg', 'power-up-double-dmg.png')
    }

    create() {

        this.finalBossStarted = false

        // scrolling background
        this.bg = this.add.tileSprite(350, 450, 700, 900, 'bg')

        // player
        this.player = this.physics.add.sprite(450, 800, 'player').setScale(0.2)
        this.player.setCollideWorldBounds(true)
        // input
        this.cursors = this.input.keyboard.createCursorKeys()
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

        // groups
        this.bullets = this.physics.add.group()

        // група за enemies
        this.enemies = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            runChildUpdate: true,  // важи за сите children -> ќе повика update()
        })

        // група за miniboss
        this.miniBossGroup = this.physics.add.group({
            classType: MiniBoss,
            runChildUpdate: true
        })

        // grupa za boss
        this.finalBossGroup = this.physics.add.group({
            runChildUpdate: true
        })

        //group power-ups
        this.powerUps = this.physics.add.group()

        // Player health
        this.playerHealth = 1      // почетно 1 heart
        this.maxHealth = 3         // максимален health

        // Hearts graphics
        this.hearts = this.add.group()

        // draw initial hearts
        for (let i = 0; i < this.maxHealth; i++) {
            const texture = i < this.playerHealth ? 'full_heart' : 'empty_heart' // полн или празен
            const heart = this.add.image(125 + i * 30, 870, texture)
            heart.setScale(0.15).setDepth(1000)
            this.hearts.add(heart)
        }

        // Hearts
        this.heartCounterText = this.add.text(20, 860, `Hearts: `, {
            fontSize: '20px',
            fill: '#fff'
        }).setDepth(1000)
        // score
        this.score = 0
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontSize: '20px',
            fill: '#fff'
        }).setDepth(1000)
        // Time
        this.timeText = this.add.text(20, 50, 'Time: 00:00', {
            fontSize: '18px',
            fill: '#fff'
        }).setDepth(1000)

        // MiniBoss kill counter
        this.miniBossKilled = 0
        this.miniBossKilledText = this.add.text(20, 80, 'MiniBoss Killed: 0', {
            fontSize: '18px',
            fill: '#fff'
        }).setDepth(1000)


        // difficulty scaling
        this.difficultyLevel = 0

        this.enemySpeedMultiplier = 1
        this.enemyHealthMultiplier = 1

        // counters
        this.startTime = this.time.now

        // spawn enemies
        this.time.addEvent({
            delay: 1500,
            loop: true,
            callback: this.spawnEnemy,
            callbackScope: this
        })
        // spawn miniboss
        this.startMiniBossTimer()

        //power-up collisions
        this.physics.add.overlap(this.player, this.powerUps, this.collectPowerUp, null, this)

        // collision
        this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletHit, null, this)
        this.physics.add.overlap(this.bullets, this.miniBossGroup, this.handleBulletHit, null, this)

        // player collision
        this.physics.add.overlap(this.player, this.enemies, this.playerHit, null, this)
        this.physics.add.overlap(this.player, this.miniBossGroup, this.playerHit, null, this)


        //powerups
        this.baseDamage = 10
        this.damageBonus = 0
        this.playerDamageMultiplier = 1
        this.fireRateMultiplier = 1
        this.doubleDamageTimer = null
        this.attackSpeedTimer = null

        // automatic shooting
        this.baseFireDelay = 200

        this.shootEvent = this.time.addEvent({
            delay: this.baseFireDelay,
            loop: true,
            callback: this.shoot,
            callbackScope: this
        })


        // powerup timers HUD
        this.powerupTimers = {
            doubleDamage: 0,
            attackSpeed: 0
        }

        this.powerupBars = this.add.group()

        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {

                if (this.powerupTimers.doubleDamage > 0) {
                    this.powerupTimers.doubleDamage--
                }

                if (this.powerupTimers.attackSpeed > 0) {
                    this.powerupTimers.attackSpeed--
                }

                this.updatePowerupBars()
            }
        })
        // za game over
        this.isGameOver = false;

    }

    collectPowerUp(player, power) {

        switch (power.powerType) {

            case 'repair':
                if (this.playerHealth < this.maxHealth) {
                    this.playerHealth++
                    this.updateHearts()
                }
                break

            case 'double-dmg':
                this.playerDamageMultiplier = 2

                this.powerupTimers.doubleDamage = 10
                this.updatePowerupBars()

                if (this.doubleDamageTimer) {
                    this.doubleDamageTimer.remove(false)
                }

                this.doubleDamageTimer = this.time.delayedCall(10000, () => {
                    this.playerDamageMultiplier = 1
                    this.powerupTimers.doubleDamage = 0
                    this.updatePowerupBars()
                    this.doubleDamageTimer = null
                })

                break

            case 'damageIncrease':

                // permanent +2 damage
                this.damageBonus += 2

                break

            case 'attack-speed':
                this.fireRateMultiplier = 1.5

                if (this.shootEvent) {
                    this.shootEvent.timeScale = this.fireRateMultiplier
                }

                this.powerupTimers.attackSpeed = 10
                this.updatePowerupBars()

                if (this.attackSpeedTimer) {
                    this.attackSpeedTimer.remove(false)
                }

                this.attackSpeedTimer = this.time.delayedCall(10000, () => {

                    this.fireRateMultiplier = 1

                    if (this.shootEvent) {
                        this.shootEvent.timeScale = 1
                    }

                    this.powerupTimers.attackSpeed = 0
                    this.updatePowerupBars()

                    this.attackSpeedTimer = null
                })

                break
        }

        power.destroy()
    }

    spawnPowerUp(x, y) {

        // 10% chance да се појави било што
        if (Phaser.Math.FloatBetween(0, 1) > 0.9) return

        const types = ['repair', 'double-dmg', 'damageIncrease', 'attack-speed']
        const type = Phaser.Utils.Array.GetRandom(types)

        const power = this.powerUps.create(x, y, type)

        power.powerType = type

        power.setScale(0.5)
        power.setVelocity(
            Phaser.Math.Between(-80, 80),
            Phaser.Math.Between(-200, -120)
        )

        power.body.setGravityY(400)
        power.setAngularVelocity(Phaser.Math.Between(-200, 200))
    }

    spawnEnemy() {
        const x = Phaser.Math.Between(50, 650)
        const roll = Phaser.Math.Between(1, 100)

        let enemy = null

        if (roll <= 70) {
            enemy = new NormalEnemy(this, x, -50)
        } else if (roll <= 98) {
            enemy = new FastEnemy(this, x, -50)
        } else {
            // roll == 99-100 → SKIP spawn
            return
        }

        // применување на difficulty multiplier при spawn
        enemy.speed *= this.enemySpeedMultiplier
        enemy.maxHealth = Math.floor(enemy.maxHealth * this.enemyHealthMultiplier)
        enemy.health = enemy.maxHealth

        this.enemies.add(enemy)

        // важно: velocity по додавање во група
        enemy.body.setVelocityY(enemy.speed)
    }

    spawnMiniBoss() {
        // ако веќе има еден, не spawn-увај
        if (this.miniBossGroup.countActive(true) >= 1) return

        const x = this.scale.width / 2

        const miniboss = new MiniBoss(this, x, -120)

        // APPLY DIFFICULTY HERE
        miniboss.speed *= this.enemySpeedMultiplier
        miniboss.maxHealth = Math.floor(miniboss.maxHealth * this.enemyHealthMultiplier)
        miniboss.health = miniboss.maxHealth

        this.miniBossGroup.add(miniboss)
    }

    startMiniBossTimer() {
        this.time.delayedCall(10000, () => {
            this.spawnMiniBoss()
        })
    }

    shoot() {
        const bullet = this.bullets.create(this.player.x, this.player.y - 20, 'bullet')
        bullet.setScale(0.1)
        bullet.setVelocityY(-500)
    }

    getPlayerDamage() {
        return (this.baseDamage + this.damageBonus) * this.playerDamageMultiplier
    }

    handleBulletHit(bullet, enemy) {
        if (!enemy || !enemy.active) return
        bullet.destroy()

        this.flashEnemy(enemy)

        enemy.takeDamage(this.getPlayerDamage())


        if (enemy.health <= 0) {
            // експлозија
            if (enemy instanceof MiniBoss) {
                // поголема, драматична експлозија
                this.createExplosion(enemy.x, enemy.y, {
                    scale: 1.2,
                    duration: 500
                })
                // camera shake
                this.cameras.main.shake(300, 0.01)
            }
            else {
                // обична експлозија
                this.createExplosion(enemy.x, enemy.y, {
                    scale: 0.4,
                    duration: 250
                })
            }

            // score
            this.score += enemy instanceof MiniBoss ? 100 : 10
            this.scoreText.setText('Score: ' + this.score)

            if (enemy instanceof MiniBoss) {
                // increase difficulty
                this.enemySpeedMultiplier += 0.1
                this.enemyHealthMultiplier += 0.2

                this.miniBossKilled += 1
                // ажурирај го текстот на екран
                this.miniBossKilledText.setText('MiniBoss Killed: ' + this.miniBossKilled)
                if (this.miniBossKilled < 5) {
                    this.startMiniBossTimer()
                }

                // нов MiniBoss spawn после 30 сек
                if (this.miniBossKilled >= 5 && !this.finalBossStarted) {
                    this.finalBossStarted = true;

                    // ⏳ Чекај 10 секунди ПРЕД да се појави текстот
                    this.time.delayedCall(10000, () => {

                        let count = 5;

                        const countdownText = this.add.text(
                            this.scale.width / 2,
                            this.scale.height / 2,
                            'FINAL BOSS INCOMING\n' + count,
                            {
                                fontSize: '45px',
                                color: '#ff0000',
                                fontStyle: 'bold',
                                align: 'center',
                                stroke: '#ffffff',
                                strokeThickness: 3
                            }
                        ).setOrigin(0.5).setDepth(2000);

                        const timerEvent = this.time.addEvent({
                            delay: 1000,
                            callback: () => {
                                count--;

                                if (count > 0) {
                                    countdownText.setText('FINAL BOSS INCOMING\n' + count);

                                    this.tweens.add({
                                        targets: countdownText,
                                        scale: 1.3,
                                        duration: 200,
                                        yoyo: true
                                    });

                                } else {
                                    countdownText.destroy();
                                    timerEvent.remove();
                                    this.spawnFinalBoss();
                                }
                            },
                            repeat: 4
                        });
                    });
                }
            }

            this.spawnPowerUp(enemy.x, enemy.y)

        }


    }

    spawnFinalBoss() {
        const x = this.scale.width / 2

        // Го креираме босот (Constructor-от во FinalBoss.js сега се грижи за x, y)
        const boss = new FinalBoss(this, x, -200)
        this.finalBossGroup.add(boss)
        this.finalBoss = boss


        // Судир на играчот со куршумите на босот
        this.physics.add.overlap(
            this.player,
            boss.bossBullets,
            (player, bullet) => {
                bullet.destroy()
                this.playerHit(player, boss)
            },
            null,
            this
        )

        // Судир на куршумите на играчот со босот
        this.physics.add.overlap(
            this.bullets,
            this.finalBossGroup,
            (bullet, boss) => {
                if (boss.isDying) return
                bullet.destroy()
                boss.takeDamage(this.getPlayerDamage())
            },
            null,
            this
        )
    }

    flashPlayer() {
        if (!this.player || !this.player.active) return

        this.player.setTint(0xff0000) // кратко црвено
        this.time.delayedCall(150, () => {
            if (this.player && this.player.active) this.player.clearTint()
        })
    }

    flashEnemy(enemy) {
        if (!enemy || !enemy.active) return

        enemy.setTint(0xff0000)
        this.time.delayedCall(100, () => {
            if (enemy && enemy.active) enemy.clearTint()
        })
    }

    createExplosion(x, y, options = {}) {
        const {
            scale = 1,
            quantity = 1,
            duration = 300
        } = options

        const explosion = this.add.image(x, y, 'explosion')
        explosion.setScale(scale)

        this.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: scale * 1.5,
            duration: duration,
            onComplete: () => explosion.destroy()
        })
    }

    update() {

        //za game over
        if (this.isGameOver) return

        // scroll background
        this.bg.tilePositionY -= 1.5

        // player movement
        this.player.setVelocityX(0)
        if (this.cursors.left.isDown) this.player.setVelocityX(-300)
        if (this.cursors.right.isDown) this.player.setVelocityX(300)


        // пресметка на минути и секунди
        const elapsedMs = this.time.now - this.startTime
        const totalSeconds = Math.floor(elapsedMs / 1000)
        const minutes = Math.floor(totalSeconds / 60)
        const seconds = totalSeconds % 60

        // формат mm:ss со водечки 0
        const formattedTime =
            String(minutes).padStart(2, '0') + ':' +
            String(seconds).padStart(2, '0')

        // ажурирај HUD
        this.timeText.setText('Time: ' + formattedTime)

    }

    updateHearts() {
        // уништи ги сите тековни hearts
        this.hearts.clear(true, true)

        // draw current hearts
        for (let i = 0; i < this.maxHealth; i++) {
            const texture = i < this.playerHealth ? 'full_heart' : 'empty_heart' // полн или празен
            const heart = this.add.image(125 + i * 30, 870, texture)
            heart.setScale(0.15).setDepth(1000)
            this.hearts.add(heart)
        }
    }

    updatePowerupBars() {

        // избриши старо
        this.powerupBars.clear(true, true)

        const startX = 300
        const y = 860
        const size = 12
        const gap = 3

        // DOUBLE DAMAGE BAR
        for (let i = 0; i < this.powerupTimers.doubleDamage; i++) {

            const rect = this.add.rectangle(
                startX + i * (size + gap),
                y,
                size,
                size,
                0xff4444
            ).setOrigin(0, 0).setDepth(1000)

            this.powerupBars.add(rect)
        }

        // ATTACK SPEED BAR
        for (let i = 0; i < this.powerupTimers.attackSpeed; i++) {

            const rect = this.add.rectangle(
                startX + i * (size + gap),
                y + 18,
                size,
                size,
                0x44aaff
            ).setOrigin(0, 0).setDepth(1000)

            this.powerupBars.add(rect)
        }
    }

    playerHit(player, enemy) {
        if (!player.active || !enemy || !enemy.active) return

        // одземи 1 живот
        if (this.playerHealth > 0) {
            this.playerHealth--
            this.updateHearts()
        }

        // za game over
        if (this.playerHealth <= 0 && !this.isGameOver) {
            this.triggerGameOver()
        }

        // кратко flash на player
        this.flashPlayer()


        // експлозија
        if (enemy instanceof MiniBoss) {
            // поголема, драматична експлозија
            this.createExplosion(enemy.x, enemy.y, {
                scale: 1.2,
                duration: 500
            })
            // camera shake
            this.cameras.main.shake(300, 0.01)


        } else {
            // обична експлозија
            this.createExplosion(enemy.x, enemy.y, {
                scale: 0.4,
                duration: 250
            })
        }

        if (enemy.disableSafe) {
            enemy.disableSafe()
        }

    }

    triggerGameOver() {

        this.isGameOver = true
        this.physics.pause()

        if (this.shootEvent) {
            this.shootEvent.remove(false)
        }

        this.time.removeAllEvents()

        const centerX = this.scale.width / 2
        const centerY = this.scale.height / 2

        // DARK OVERLAY
        const overlay = this.add.rectangle(
            centerX,
            centerY,
            this.scale.width,
            this.scale.height,
            0x000000,
            0.85
        ).setDepth(2000)

        overlay.alpha = 0

        // Fade-in overlay
        this.tweens.add({
            targets: overlay,
            alpha: 0.85,
            duration: 500
        })

        // GAME OVER TEXT
        const gameOverText = this.add.text(centerX, centerY - 120, 'GAME OVER', {
            fontSize: '72px',
            fontStyle: 'bold',
            color: '#ff3c3c',
            stroke: '#ffffff',
            strokeThickness: 4
        })
            .setOrigin(0.5)
            .setDepth(2001)
            .setAlpha(0)
            .setScale(0.8)

        this.tweens.add({
            targets: gameOverText,
            alpha: 1,
            scale: 1,
            duration: 500,
            ease: 'Back.Out'
        })

        // FINAL SCORE
        const finalScore = this.add.text(centerX, centerY - 40, `Final Score: ${this.score}`, {
            fontSize: '28px',
            color: '#ffffff'
        })
            .setOrigin(0.5)
            .setDepth(2001)
            .setAlpha(0)

        this.tweens.add({
            targets: finalScore,
            alpha: 1,
            delay: 300,
            duration: 400
        })

        // BUTTON STYLE FUNCTION
        const createButton = (y, text, callback, color) => {

            const button = this.add.text(centerX, y, text, {
                fontSize: '30px',
                fontStyle: 'bold',
                color: '#ffffff',
                backgroundColor: color,
                padding: { x: 40, y: 15 }
            })
                .setOrigin(0.5)
                .setDepth(2001)
                .setInteractive({ useHandCursor: true })
                .setAlpha(0)
                .setScale(0.8)

            // hover effect
            button.on('pointerover', () => {
                this.tweens.add({
                    targets: button,
                    scale: 1.1,
                    duration: 150
                })
            })

            button.on('pointerout', () => {
                this.tweens.add({
                    targets: button,
                    scale: 1,
                    duration: 150
                })
            })

            button.on('pointerdown', callback)

            this.tweens.add({
                targets: button,
                alpha: 1,
                scale: 1,
                delay: 500,
                duration: 400,
                ease: 'Back.Out'
            })

            return button
        }

        // // RESTART BUTTON
        // createButton(
        //     centerY + 40,
        //     'RESTART',
        //     () => this.scene.restart(),
        //     '#00c853'
        // )
        let restartButton = this.add.image(centerX, centerY + 40, 'restartkopce').setScale(0.2).setDepth(2001);
        restartButton.setInteractive({ useHandCursor: true });

// click
        restartButton.on('pointerdown', () => this.scene.restart());

// hover effect
        restartButton.on('pointerover', () => {
            this.tweens.add({
                targets: restartButton,
                scale: 0.25, // малку го зголеми
                duration: 150
            });
        });

        restartButton.on('pointerout', () => {
            this.tweens.add({
                targets: restartButton,
                scale: 0.2,
                duration: 150
            });
        });


        // BACK BUTTON
        // createButton(
        //     centerY + 120,
        //     'BACK TO MENU',
        //     () => {
        //         this.scene.stop('MainScene')
        //         this.scene.start('MenuScene')
        //     },
        //     '#2962ff'
        // )

        let backButton = this.add.image(centerX, centerY + 120, 'backtomenukopce') // замени со твојата слика
            .setScale(0.2)
            .setDepth(2001)
            .setInteractive({ useHandCursor: true });

// click
        backButton.on('pointerdown', () => {
            this.scene.stop('MainScene');
            this.scene.start('MenuScene');
        });

// hover effect
        backButton.on('pointerover', () => {
            this.tweens.add({
                targets: backButton,
                scale: 0.25, // малку го зголеми
                duration: 150
            });
        });

        backButton.on('pointerout', () => {
            this.tweens.add({
                targets: backButton,
                scale: 0.2, // враќа на оригинална големина
                duration: 150
            });
        });
    }

    triggerVictory() {

        // this.physics.pause()
        //
        // const centerX = this.scale.width / 2
        // const centerY = this.scale.height / 2
        //
        // this.add.text(centerX, centerY, 'YOU WIN!', {
        //     fontSize: '60px',
        //     color: '#00ffcc'
        // }).setOrigin(0.5)


            this.isGameOver = true
            this.physics.pause()

            if (this.shootEvent) {
                this.shootEvent.remove(false)
            }

            this.time.removeAllEvents()

            const centerX = this.scale.width / 2
            const centerY = this.scale.height / 2

            // DARK OVERLAY
            const overlay = this.add.rectangle(
                centerX,
                centerY,
                this.scale.width,
                this.scale.height,
                0x000000,
                0.85
            ).setDepth(2000)

            overlay.alpha = 0

            // Fade-in overlay
            this.tweens.add({
                targets: overlay,
                alpha: 0.85,
                duration: 500
            })

            // GAME OVER TEXT
            const gameOverText = this.add.text(centerX, centerY - 120, 'YOU WIN!', {
                fontSize: '72px',
                fontStyle: 'bold',
                color: '#54b114',
                stroke: '#ffffff',
                strokeThickness: 4
            })
                .setOrigin(0.5)
                .setDepth(2001)
                .setAlpha(0)
                .setScale(0.8)

            this.tweens.add({
                targets: gameOverText,
                alpha: 1,
                scale: 1,
                duration: 500,
                ease: 'Back.Out'
            })

            // FINAL SCORE
            const finalScore = this.add.text(centerX, centerY - 40, `Final Score: ${this.score}`, {
                fontSize: '28px',
                color: '#ffffff'
            })
                .setOrigin(0.5)
                .setDepth(2001)
                .setAlpha(0)

            this.tweens.add({
                targets: finalScore,
                alpha: 1,
                delay: 300,
                duration: 400
            })

            // BUTTON STYLE FUNCTION
            const createButton = (y, text, callback, color) => {

                const button = this.add.text(centerX, y, text, {
                    fontSize: '30px',
                    fontStyle: 'bold',
                    color: '#ffffff',
                    backgroundColor: color,
                    padding: { x: 40, y: 15 }
                })
                    .setOrigin(0.5)
                    .setDepth(2001)
                    .setInteractive({ useHandCursor: true })
                    .setAlpha(0)
                    .setScale(0.8)

                // hover effect
                button.on('pointerover', () => {
                    this.tweens.add({
                        targets: button,
                        scale: 1.1,
                        duration: 150
                    })
                })

                button.on('pointerout', () => {
                    this.tweens.add({
                        targets: button,
                        scale: 1,
                        duration: 150
                    })
                })

                button.on('pointerdown', callback)

                this.tweens.add({
                    targets: button,
                    alpha: 1,
                    scale: 1,
                    delay: 500,
                    duration: 400,
                    ease: 'Back.Out'
                })

                return button
            }

            // RESTART BUTTON
            // createButton(
            //     centerY + 40,
            //     'RESTART',
            //     () => this.scene.restart(),
            //     '#00c853'
            // )
        let restartButton = this.add.image(centerX, centerY + 40, 'restartkopce').setScale(0.2).setDepth(2001);
        restartButton.setInteractive({ useHandCursor: true });

// click
        restartButton.on('pointerdown', () => this.scene.restart());

// hover effect
        restartButton.on('pointerover', () => {
            this.tweens.add({
                targets: restartButton,
                scale: 0.25, // малку го зголеми
                duration: 150
            });
        });

        restartButton.on('pointerout', () => {
            this.tweens.add({
                targets: restartButton,
                scale: 0.2,
                duration: 150
            });
        });


        // BACK BUTTON
        // createButton(
        //     centerY + 120,
        //     'BACK TO MENU',
        //     () => {
        //         this.scene.stop('MainScene')
        //         this.scene.start('MenuScene')
        //     },
        //     '#2962ff'
        // )

        let backButton = this.add.image(centerX, centerY + 120, 'backtomenukopce') // замени со твојата слика
            .setScale(0.2)
            .setDepth(2001)
            .setInteractive({ useHandCursor: true });

// click
        backButton.on('pointerdown', () => {
            this.scene.stop('MainScene');
            this.scene.start('MenuScene');
        });

// hover effect
        backButton.on('pointerover', () => {
            this.tweens.add({
                targets: backButton,
                scale: 0.25, // малку го зголеми
                duration: 150
            });
        });

        backButton.on('pointerout', () => {
            this.tweens.add({
                targets: backButton,
                scale: 0.2, // враќа на оригинална големина
                duration: 150
            });
        });

        }




}
