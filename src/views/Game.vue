<template>
  <div id="game-container"></div>
</template>

<script setup>
import { onMounted } from 'vue'
import Phaser from 'phaser'
import config from '../game/config'

onMounted(() => {
  new Phaser.Game(config)
})
</script>

<style>


#game-container {
  width: 700px;
  height: 900px;
}
</style>
