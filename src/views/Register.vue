<script setup>
import { ref } from 'vue';
import router from '../router';
import { supabase } from '../supabase';

const emit = defineEmits(['logged-in']);
const email = ref("");
const pass = ref("");
const reppass = ref("");

const failVal = ref({});
const failMsg = ref([]);

const validateEmail = (email) => {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
};

async function register(e) {
  e.preventDefault();
  failVal.value = {};
  failMsg.value = [];
  if (!validateEmail(email.value)) {
    failVal.email = true;
    failMsg.value.push("Email is not valid!");
  }
  if (pass.value !== reppass.value) {
    failVal.pass = true;
    failVal.reppass = true;
    failMsg.value.push("Passwords do NOT match");
  }
  if (pass.value.length < 8) {
    failVal.pass = true;
    failVal.reppass = true;
    failMsg.value.push("Password length must be at least 8");
  }
  if (failMsg.value.length === 0) {
    try {
      const { error } = await supabase.auth.signUp({ email: email.value, password: pass.value })
      if (error) throw error
      failMsg.value.push("We sent you an email to confirm your email address. Sometimes it's located in trash.");
      pass.value = "";
      reppass.value = "";
    } catch (err) {
      failMsg.value.push(err.message);
    }
  }
}

</script>

<template>
  <div class="userform">
    <form @submit="register">
      <label for="mail">Email</label>
      <input v-model="email" :class="{ incorrect: failVal.email }" id="mail" type="email">
      <label for="pass">Password</label>
      <input v-model="pass" id="pass" :class="{ incorrect: failVal.pass }" type="password">
      <label for="reppass">Repeat Password</label>
      <input v-model="reppass" id="reppass" :class="{ incorrect: failVal.reppass }" type="password">
      <button>Register</button>
    </form>
    <ul class="error">
      <li v-for="(msg, ind) in failMsg" :key="ind">{{msg}}</li>
    </ul>
  </div>
</template>

<style scoped>
.userform {
  max-width: 400px;
  margin: 20px auto;
  padding: 20px;
  background: #fff8;
  border-radius: 5px;
}

.incorrect {
  border-color: #fa1111 !important;
  border-width: 2px !important;
}

.userform label {
  display: block;
  font-size: 20px;
}

label {
  cursor: default;
}

.userform input {
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
  margin-bottom: 20px;
  margin-top: 10px;
  padding: 10px;
  width: 100%;
}
</style>
