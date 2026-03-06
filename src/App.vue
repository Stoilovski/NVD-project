<template>
  <div class="page-bg">
    <div class="game-wrapper">
      <router-view />
    </div>
  </div>
</template>

<script setup>
</script>

<style>
body{
  margin: 0;
}
.page-bg {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;

  /* BACKGROUND НА СТРАНАТА */
  background: url('/final-background.jpg') center/cover no-repeat;
}

.game-wrapper {
  width: 700px;
  height: 900px;
  border: 3px solid #738f8f;
  border-radius: 20px;
  overflow: hidden;

  /* SHADOW / FLOAT EFFECT */
  box-shadow:
      0 25px 60px rgba(0, 0, 0, 0.8),
      0 0 40px rgba(0, 255, 255, 0.3);

  transition: transform 0.3s ease;
}

</style>