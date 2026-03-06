import Enemy from './Enemy'

export default class FastEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'fastEnemy', {
            speed: 200,
            health: 20,
            scale: 0.22
        })
    }
}
