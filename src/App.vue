<script setup>
import { RouterLink, RouterView } from 'vue-router';
import router from './router';
import { supabase } from './supabase';
import useUser from './modules/useUser';
import { onMounted, ref } from 'vue';
const { theUser, loadUser } = useUser();
const bookMark = ref(null);

const userLoader = async () => {
  loadUser();
  if (theUser.value) {
    await getBookmarkCount();
  }
}

supabase.auth.onAuthStateChange((event, session) => {
  userLoader();
})

async function getBookmarkCount() {
  const { data } = await supabase
    .from('VideoMarks')
    .select('fileid')
    .eq('userid', theUser.value.id)
  if (data.length == 0)
    bookMark.value = null;
  else
    bookMark.value = data[0];
}

onMounted(userLoader)

function loggedin(u) {
  theUser.value = u.value
  if (theUser.value) {
    getBookmarkCount();
  }
}

async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    alert(error);
    return;
  }
  //console.log('signed out');
  theUser.value = null;
  router.push('/');
}
const more = ref(false);
function changeMore() {
  more.value = !more.value;
}

let tout = null;
document.addEventListener('mouseup', () => {
  if (!more.value) return;
  clearTimeout(tout);
  setTimeout(() => {
    tout = more.value = false;
  }, 50)
})
</script>

<template>
  <div class="wrapper">
    <RouterLink to="/" class="brnd sm-content"><span>Perma File Store</span></RouterLink>
    <nav class="w-right">
      <div class="flex" v-if="theUser == null">
        <RouterLink to="/register">Register</RouterLink>
        <RouterLink to="/login">Login</RouterLink>
        <div @click="changeMore"><a>{{ more ? 'Less' : 'More' }}</a></div>
        <div @click="changeMore" :class="more ? 'more2' : 'more'">
          <RouterLink to="/public">Public</RouterLink>
          <RouterLink to="/movies">Movies</RouterLink>
        </div>
      </div>
      <div v-else class="flex">
        <a @click="logout">Logout</a>
        <span class="sm-disable">{{ theUser.email }}</span>
        <RouterLink to="/files">Files</RouterLink>
        <div @click="changeMore"><a>{{ more ? 'Less' : 'More' }}</a></div>
        <div @click="changeMore" :class="more ? 'more2' : 'more'">
          <RouterLink to="/public">Public</RouterLink>
          <RouterLink to="/movies">Movies</RouterLink>
          <RouterLink to="/listmovies">Your Movies</RouterLink>
          <RouterLink to="/listseasons">Your Seasons</RouterLink>
          <RouterLink v-if="bookMark" :to="`/file/${bookMark.fileid}`">Continue Watching</RouterLink>
        </div>
      </div>
    </nav>
  </div>

  <div class="m-a">
    <RouterView @logged-in="loggedin" :theUser="theUser" />
  </div>
</template>

<style scoped>
@media only screen and (max-width: 600px) {
  .sm-disable {
    display: none;
  }

}

@media only screen and (max-width: 435px) {

  .sm-content span {
    display: none;
  }

  .sm-content:after {
    content: 'PFS';
  }

}

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

.more {
  position: absolute;
  right: 0px;
  top: 69px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  user-select: none;
  background-color: #1facff;
  z-index: 10;

  max-height: 0;
  transition: max-height 0.15s ease-out;
  overflow: hidden;
}

.more2 {
  position: absolute;
  right: 0px;
  top: 69px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  user-select: none;
  background-color: #1facff;
  z-index: 10;

  max-height: 500px;
  transition: max-height 0.3s ease-in;
  overflow: hidden;
}

.more a,
.more2 a {
  width: -webkit-fill-available;
  text-align: left;
}

.wrapper a {
  float: left;
  color: black;
  padding: 12px;
  text-decoration: none;
  font-size: 18px;
  line-height: 25px;
  transition: .3s;
  cursor: pointer;
  border-radius: 30px 0px / 30px 0px;
  user-select: none;
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
  background-size: auto;
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

main {
  height: 100%;
  display: grid;
  align-items: center;
}

.m-a {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 0 auto;
  height: 100%;
  flex-direction: column;
  justify-content: center;
}

.item1 {
  grid-row: 1 / span 3
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
