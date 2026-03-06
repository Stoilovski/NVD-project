import Enemy from './Enemy'

export default class NormalEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'normalEnemy', {
            speed: 100,
            health: 40,
            scale: 0.25
        })
    }
}
