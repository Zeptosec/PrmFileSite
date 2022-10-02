<script setup>
import { RouterLink, RouterView } from 'vue-router'
import router from './router';
import { supabase } from './supabase';
import useUser from './modules/useUser';
import { onMounted } from 'vue';
const { theUser, loadUser } = useUser();
//import HelloWorld from './components/HelloWorld.vue'

onMounted(async () => {
  await loadUser();
})

function loggedin(u){
  theUser.value = u.value
}

async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    alert(error);
    return;
  }
  console.log('signed out');
  theUser.value = null;
  router.push('/');
}

</script>

<template>
  <div class="wrapper">
    <RouterLink to="/" class="brnd">PFS</RouterLink>
    <nav class="w-right">
      <div class="flex" v-if="theUser == null">
        <RouterLink to="/register">Register</RouterLink>
        <RouterLink to="/login">Login</RouterLink>
      </div>
      <div v-else class="flex">
        <a @click="logout">Logout</a>
        <span>{{theUser.email}}</span>
        <RouterLink to="/files">Files</RouterLink>
      </div>
    </nav>
  </div>

  <div class="m-a">
    <RouterView @logged-in="loggedin" :theUser="theUser" />
  </div>
</template>

<style scoped>
.w-right {
  float: right;
}

.flex {
  display: flex;
  gap: 10px;
}

.flex span {
  margin: auto 0px;
}

.wrapper {
  overflow: hidden;
  background-color: #0F0F0F11;
  padding: 10px 10px;
}

.wrapper a {
  float: left;
  color: black;
  text-align: center;
  padding: 12px;
  text-decoration: none;
  font-size: 18px;
  line-height: 25px;
  transition: .3s;
  cursor: pointer;
  border-radius: 50% 0px / 50% 0px;
}

.wrapper a .brnd {
  font-size: 25px;
  font-weight: bold;
}

.wrapper a:hover {
  background-color: rgba(0, 140, 255, 0.55);
  color: black;
}

.wrapper a.active {
  background-color: dodgerblue;
  color: white;
}
</style>

<style>
:root {
  --color1: rgba(55, 165, 255, 0.35);
  --color2: rgba(96, 181, 250, 0.35);
  --primary: #00e2ff;
  --secondary: #004eff;
  --rotation: 135deg;
  --size: 10px;
}

html {
  height: 100%;
  width: 100%;
  background-color: #b6d6f5;
  background-blend-mode: multiply;
  background-image: repeating-linear-gradient(var(--rotation),
      var(--color1) calc(var(--size) * 0),
      var(--color1) calc(var(--size) * 9),
      var(--color2) calc(var(--size) * 9),
      var(--color2) calc(var(--size) * 12),
      var(--color1) calc(var(--size) * 12)),
    repeating-linear-gradient(calc(var(--rotation) + 90deg),
      var(--color1) calc(var(--size) * 0),
      var(--color1) calc(var(--size) * 9),
      var(--color2) calc(var(--size) * 9),
      var(--color2) calc(var(--size) * 12),
      var(--color1) calc(var(--size) * 12));
}

.m-a {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

#app {
  height: calc(100% - 69px);
  font-family: Helvetica, Arial, sans-serif;
}

body {
  height: 100%;
  margin: 0;
  padding: 0;
}

button {
  padding: 10px;
  background-color: var(--primary);
  border-radius: 5px;
  border-width: 0;
  transition: 0.2s;
}

button:hover {
  background-color: var(--secondary);
  color: white;
}

button:active {
  background-color: blue;
  color: white;
}
</style>
