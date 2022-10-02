<script setup>
import { onMounted, ref } from 'vue';
const file = ref(null);
const apiEndPoint = "http://localhost:3000"
const isUploading = ref(false);
const uploadFile = (event) => {
  console.log(event.target.files[0].name);
  file.value = event.target.files[0];
}
const submitFile = async () => {
  isUploading.value = true;
  if (file.value == null) return;
  try {
    //console.log(file.value);
    var data = new FormData();
    data.append('file', file.value);
    const res = await fetch(`${apiEndPoint}/upload`, {
      method: 'POST',
      body: data
    })
    if (res.ok) {
      const json = await res.json();
      //console.log(json.msg);
    }
  } finally {
    isUploading.value = false;
  }
}
</script>

<template>
  <div>
    <input :disabled="isUploading" type="file" @change="uploadFile">
    <button :disabled="isUploading" @click="submitFile">Upload!</button>
  </div>
</template>

<style scoped>

</style>