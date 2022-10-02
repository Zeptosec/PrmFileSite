<script setup>
import useFileList from '../compositions/filelist';
import { uploadFiles } from '../compositions/fileuploader';
import DropZone from '../components/DropZone.vue';
import FilePreview from '../components/FilePreview.vue';
import { ref } from 'vue';
import { supabase } from '../supabase';
const { files, addFiles, removeFile } = useFileList();
const apiEndPoint = "https://permafilestore.cyclic.app";
const isUploading = ref(false);
const downloadLinks = ref([]);
const errMsg = ref(null);

const props = defineProps({
  theUser: {
    type: Object,
    required: false
  }
  
})

function onInputChange(e) {
  addFiles(e.target.files)
  e.target.value = null // reset so that selecting the same file again will still cause it to fire this change
}

async function upload() {
  errMsg.value = null;
  isUploading.value = true;
  try {
    let locs = await uploadFiles(files.value, `${apiEndPoint}/api/upload`);
    downloadLinks.value = [...downloadLinks.value, ...locs];
    if (props.theUser) {
      let objs = [];
      for(let i = 0; i < locs.length; i++){
        objs.push({
          name: locs[i].name, location: locs[i].location, userid: props.theUser.id
        })
      }
      const { error } = await supabase
        .from('StoredFiles')
        .insert(objs);
      if (error) {
        throw Error(error);
      }
    }
    files.value = [];
  } catch (err) {
    console.log(err);
    errMsg.value = err.message;
  } finally {
    isUploading.value = false;
  }
}

</script>

<template>
  <main>
    <DropZone class="drop-area" @files-dropped="addFiles" #default="{dropZoneActive}">
      <label for="file-input">
        <span v-if="dropZoneActive">
          <div>Drop Files Here</div>
        </span>
        <span v-else>
          <div>Drag Your Files Here or <em><b>click here</b></em></div>
        </span>
      </label>
      <input type="file" id="file-input" @change="onInputChange" />
      <ul class="file-list" v-show="files.length">
        <FilePreview v-for="file of files" :key="file.id" :file="file" tag="li" @remove="removeFile" />
      </ul>
    </DropZone>
    <button v-show="files.length > 0" :disabled="isUploading" @click.prevent="upload"
      class="upload-button">Upload</button>
    <h2 v-show="errMsg" class="error">{{errMsg}}</h2>
    <ul>
      <li v-for="(link, ind) in downloadLinks" :key="ind">
        <p><a :href="link.location">{{link.name}}</a></p>
      </li>
    </ul>
  </main>
</template>

<style>
.error {
  color: #cc2211;
}

ul {
  list-style-type: none;
  padding-left: 0px;
}

.file-list {
  display: flex;
  flex-wrap: wrap;
}

.drop-area {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 50px;
  background: #ffffff55;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  transition: .2s ease;
}

.drop-area[data-active=true] {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  background: #ffffffcc;
}

label {
  font-size: 36px;
  cursor: pointer;
  display: block;
}

span {
  display: block;
}

.smaller {
  font-size: 16px;
}

input[type=file]:not(:focus-visible) {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

.image-list {
  display: flex;
  list-style: none;
  flex-wrap: wrap;
  padding: 0;
}

.upload-button {
  display: block;
  appearance: none;
  border: 0;
  border-radius: 50px;
  padding: 0.75rem 3rem;
  margin: 1rem auto;
  font-size: 1.25rem;
  font-weight: bold;
  background: #369;
  color: #fff;
  text-transform: uppercase;
}

.upload-button:disabled {
  background: #232323;
}

button {
  cursor: pointer;
}
</style>