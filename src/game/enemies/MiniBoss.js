import Enemy from './Enemy'

export default class MiniBoss extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'miniBoss', {
            speed: 30,      // vertical speed
            health: 300,    // start health
            scale: 0.4      // sprite scale
        })

        // flag obavezen za proverka dali e miniboss vo enemy.js
        this.isMiniBoss = true

        this.startX = x
        this.moveRange = 120

        // ensure Arcade physics body is enabled
        this.setActive(true)
        this.setVisible(true)
        this.body.setCollideWorldBounds(true)

        // optional: hit radius / circle
        const radius = Math.min(this.width, this.height) * 0.53
        this.body.setCircle(
            radius,
            this.width / 2 - radius,
            this.height / 2 - radius
        )
    }

    update() {
        if (!this.active) return

        // horizontal sinusoidal movement
        this.x = this.startX + Math.sin(this.scene.time.now / 1000) * this.moveRange

        // vertical movement
        this.body.setVelocityY(this.speed)

        // update health bar and check if destroyed
        super.update()
    }

    takeDamage(amount) {
        if (!this.active) return
        super.takeDamage(amount)
    }

}
