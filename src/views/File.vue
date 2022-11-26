<template>
    <main>
        <div class="main">
            <h1>{{ data.msg }}</h1>
            <div v-if="filedata">
                <h3>name: {{ filedata.name }}</h3>
                <h3>size: {{ filedata.readableSize }}</h3>
            </div>
            <button v-if="data.found" @click="startDownload" :disabled="status.downloading">Download</button>
            <div v-if="status.downloading">
                <h2>{{ status.msg }}</h2>
                <h3>{{ toReadable(status.downloadedBytes) }} / {{ filedata.readableSize }}</h3>
                <h4>Speed: {{ status.speed }}</h4>
            </div>
            <div class="watch">
                <button v-if="filedata && videoExts.includes(filedata.ext) && !status.fileurl" @click="prepareWatch">Watch</button>
                <video v-if="status.fileurl" :src="status.fileurl" width="600" controls></video>
            </div>
        </div>
    </main>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { downloadWithStatus, toReadable, downloadFileUrl } from '../compositions/filedownloader';

const route = useRoute();
const data = ref({ msg: "Please wait fetching details...", found: false });
const status = ref({ msg: "", finished: false, downloading: false, downloadedBytes: 0, fileurl: null });
const filedata = ref(null);
const videoExts = ref(['mp4', 'wav']);

const prepareWatch = async () => {
    await startDownload(false);
    status.value.downloading = false;
}

const beforeUnloadListener = (event) => {
    event.preventDefault();
    return event.returnValue = "Are you sure you want to leave?";
};

async function startDownload(isDownload = true) {
    data.value.msg = "Starting the download.";
    status.value.downloading = true;
    if(status.value.fileurl != null){
        downloadFileUrl(filedata.value.name, status.value.fileurl);
        data.value.msg = "Done";
        return;
    }
    status.value.msg = "Waking up the server...";
    addEventListener("beforeunload", beforeUnloadListener, { capture: true });
    try {
        await downloadWithStatus(filedata.value.name, filedata.value.chunks, filedata.value.size, status, isDownload);
        //await download(filedata.name, filedata.chunks);
    } catch (err) {
        console.log(err);
        data.value.msg = "Download failed. " + err.message;
    } finally {
        removeEventListener("beforeunload", beforeUnloadListener, { capture: true });
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
        json.data[0].readableSize = toReadable(json.data[0].size);
        filedata.value = json.data[0];
        filedata.value.ext = filedata.value.name.split('.').pop().toLowerCase();
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
.watch {
    margin-top: 8px;
}
.main {
    background-color: #fff3;
    padding-bottom: 21px;
}
</style>