<template>
    <main>
        <div>
            <h1>{{data.msg}}</h1>
            <button v-if="data.found" @click="startDownload" :disabled="status.downloading">Download</button>
            <h2 v-if="status.downloading">status: {{status.msg}}</h2>
        </div>
    </main>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { download, downloadWithStatus } from '../compositions/filedownloader';

const route = useRoute();
const data = ref({ msg: "Please wait fetching details...", found: false });
const status = ref({ msg: "", finished: false, downloading: false });
const filedata = ref(null);

async function startDownload() {
    data.value.msg = "Starting the download.";
    status.value.downloading = true;
    try {
        await downloadWithStatus(filedata.value.name, filedata.value.chunks, filedata.value.size, status);
        //await download(filedata.name, filedata.chunks);
    } catch (err) {
        console.log(err);
        data.value.msg = "Download failed. " + err.message;
    }
}

onMounted(async () => {
    // fetch links and download using filedownloader
    const id = route.params.id;
    if (!id) {
        data.value.msg = "No id was found in a query";
        return;
    }
    const res = await fetch("https://tartan-general-scion.glitch.me/api/file?id=" + id);
    const json = await res.json();
    if (res.ok) {
        filedata.value = json.data[0];
        console.log(filedata.value);
        if (!filedata.value) {
            data.value.msg = "File was not found";
        } else {
            data.value.msg = "File was found.";
            data.value.found = true;
        }
    } else {
        data.value.msg = json.error;
    }
})
</script>

<style scoped>

</style>