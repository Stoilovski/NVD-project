import Phaser from 'phaser'

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, config) {
        super(scene, x, y, texture)
        scene.add.existing(this)
        scene.physics.add.existing(this)

        this.scene = scene
        this.speed = config.speed
        this.maxHealth = config.health
        this.health = this.maxHealth
        this.setScale(config.scale || 0.3)

        const radius = Math.min(this.width, this.height) * 0.5
        this.body.setCircle(
            radius,
            this.width / 2 - radius,
            this.height / 2 - radius
        )

        this.healthBar = scene.add.graphics()
        this.updateHealthBar()
    }

    update() {
        if (!this.active) return
        this.updateHealthBar()

        if (this.y > this.scene.scale.height + 50) {
            this.disableSafe()

            if (this.isMiniBoss) {
                this.scene.startMiniBossTimer()
            }
        }

    }

    takeDamage(amount) {
        if (!this.active) return
        this.health -= amount
        if (this.health <= 0) this.disableSafe()
        else this.updateHealthBar()
    }

    updateHealthBar() {
        if (!this.active) return
        const width = 40
        const height = 5
        const x = this.x - width / 2
        const y = this.y - this.displayHeight / 2 - 10

        this.healthBar.clear()
        this.healthBar.fillStyle(0xff0000)
        this.healthBar.fillRect(x, y, width, height)

        const hpWidth = (this.health / this.maxHealth) * width
        this.healthBar.fillStyle(0x00ff00)
        this.healthBar.fillRect(x, y, hpWidth, height)
    }

    disableSafe() {
        if (!this.active) return
        this.active = false
        this.visible = false
        this.body.enable = false
        if (this.healthBar) {
            this.healthBar.destroy()
            this.healthBar = null
        }
        this.scene.enemies.remove(this, false, false)
    }
}
