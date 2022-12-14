<script setup>
import useFileList from '../compositions/filelist';
import { uploadFilesWithStatus2 } from '../compositions/fileuploader';
import DropZone from '../components/DropZone.vue';
import FilePreview from '../components/FilePreview.vue';
import { ref } from 'vue';
import FileTable from '../components/FileTable.vue';
const { files, addFiles, removeFile } = useFileList();
const apiEndPoint = /*"http://localhost:3001";*/"https://tartan-general-scion.glitch.me";
const isUploading = ref(false);
const errMsg = ref(null);
const status = ref({ files: [], finished: true, hasErrors: false });
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

const beforeUnloadListener = (event) => {
  event.preventDefault();
  return event.returnValue = "Are you sure you want to leave?";
};

async function upload2() {
  isUploading.value = true;
  errMsg.value = "Waking up the server...";
  addEventListener("beforeunload", beforeUnloadListener, {capture: true});

  try {
    let res = await fetch(apiEndPoint);
    if (res.ok) {
      errMsg.value = "Server awake. Starting the upload...";
    } else {
      errMsg.value = "Server did not respond!";
      return;
    }
    // upload files function

    await uploadFilesWithStatus2(files.value, `${apiEndPoint}/api/upload`, props.theUser, status);
    console.log(status.value);
    files.value = [];
    errMsg.value = "Upload was successful";
  } catch (err) {
    console.log(err);
  } finally {
    removeEventListener("beforeunload", beforeUnloadListener, {capture: true});
    isUploading.value = false;
  }
}

</script>

<template>
  <main>
    <div>
      <DropZone class="drop-area" @files-dropped="addFiles" #default="{dropZoneActive}">
        <label for="file-input">
          <span v-if="dropZoneActive">
            <div>Drop Files Here</div>
          </span>
          <span v-else>
            <div>Drag Your Files Here or <em><b>click here</b></em></div>
          </span>
        </label>
        <input type="file" id="file-input" multiple @change="onInputChange" />
        <ul class="file-list" v-show="files.length">
          <FilePreview v-for="file of files" :key="file.id" :file="file" tag="li" @remove="removeFile" />
        </ul>
      </DropZone>
      <button v-show="files.length > 0 && status.finished" :disabled="isUploading" @click.prevent="upload2"
        class="upload-button">Upload</button>
      <h2 v-show="errMsg" class="error">{{errMsg}}</h2>
      <div v-if="(status && !status.finished) || status.hasErrors">
        <h3>File uploading status</h3>
        <i><b>uploaded files will be shown down below</b></i>
        <table>
          <thead>
            <th>filename</th>
            <th>status</th>
          </thead>
          <tr v-for="(statuses, ind) in status.files" :key="ind">
            <!-- No clue how to do it with less v-if's it's for a future me problem-->
            <td v-if="!statuses.value.finished">{{statuses.value.name}}</td>
            <td v-if="!statuses.value.finished && !statuses.value.error">
              {{Math.round(statuses.value.uploadedBytes/statuses.value.size*10000)/100}}%</td>
            <td v-if="statuses.value.error" class="error">{{statuses.value.error}}</td>
            <!-- <td v-if="statuses.value.finished">{{statuses.value.name}}</td>
            <td v-if="statuses.value.finished" class="success">uploaded</td> -->
          </tr>
        </table>
      </div>
      <FileTable :files="status.files" />
      <!-- <ul>
        <li v-for="(link, ind) in downloadLinks" :key="ind">
          <p><a :href="link.location">{{link.name}}</a></p>
        </li>
      </ul> -->
    </div>
  </main>
</template>

<style>
table {
  border-collapse: collapse;
  max-width: 800px;
  text-align: left;
  margin: 18px auto;
}

td,
th {
  border: 1px solid #ddd;
  padding: 5px;
}

tr:hover {
  background-color: #ddd;
}

tr {
  background-color: #f2f2f2;
}

th {
  background-color: #279e2d;
  color: white;
}

.error {
  color: #cc2211;
}

.success {
  color: #12b61a;
}

ul {
  list-style-type: none;
  padding-left: 0px;
}

.file-list {
  display: flex;
  flex-wrap: wrap;
}

.file-list>* {
  flex: 1 1 160px;
}

.drop-area {
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