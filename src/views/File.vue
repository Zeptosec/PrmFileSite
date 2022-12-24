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
            <div v-if="filedata && videoExts.includes(filedata.ext)" class="watch">
                <button v-if="!clickedWatch" @click="() => clickedWatch = true"
                    :disabled="status.downloading">Watch</button>
                <video ref="vtag" @loadeddata="loadedVideo(filedata.fileid)" v-if="clickedWatch" crossorigin="" controls>
                    <source :src="`https://vid-str-nigerete123.koyeb.app/video/${route.params.id}`" type="video/mp4" />
                    <track label="English" kind="subtitles" srclang="en"
                        src="https://frxcr-zeptosec.koyeb.app/https://cdn.discordapp.com/attachments/1025526944776867952/1056242126859554867/breaking_bad_s04e07_720p_brrip_sujaidr.vtt" />
                </video>
            </div>

            <div v-if="filedata && audioExts.includes(filedata.ext)" class="watch">
                <button v-if="!status.fileurl" @click="prepareWatch" :disabled="status.downloading">Listen</button>
                <audio v-if="status.fileurl" :src="status.fileurl" controls></audio>
            </div>

            <div v-if="filedata && imageExts.includes(filedata.ext)" class="watch">
                <button v-if="!status.fileurl" @click="prepareWatch" :disabled="status.downloading">Preview</button>
                <img v-if="status.fileurl" :src="status.fileurl" :width="getWidth()" alt="preview image" />
            </div>

            <div v-if="filedata && (filedata.previous || filedata.next)" class="row">
                <button v-if="filedata.previous" @click="gotoLinkFromUID(filedata.previous.fileid)">Previous</button>
                <button v-if="filedata.next" @click="gotoLinkFromUID(filedata.next.fileid)">Next</button>
            </div>
        </div>
    </main>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { onBeforeRouteLeave, useRoute } from 'vue-router';
import { downloadWithStatus, toReadable, downloadFileUrl } from '../compositions/filedownloader';
import router from '../router';
import { supabase } from '../supabase';

const route = useRoute();
const data = ref({ msg: "Please wait fetching details...", found: false });
const status = ref({ msg: "", finished: false, downloading: false, downloadedBytes: 0, fileurl: null });
const filedata = ref(null);
const videoExts = ref(['mp4', 'mkv']);
const audioExts = ref(['mp3', 'wav']);
const imageExts = ref(['png', 'jpg', 'jpeg', 'gif']);
const clickedWatch = ref(false);
let vtag = ref(null);
const props = defineProps({
    theUser: {
        type: Object,
        required: false
    }
})
async function saveTimestampDB() {
    const currentTime = vtag.value.currentTime;
    const fileid = filedata.value.fileid;
    const { count } = await supabase
        .from('VideoMarks')
        .select('*', { count: 'estimated' })
        .eq('userid', props.theUser.id);
    if (count == 0) {
        await supabase.
            from('VideoMarks')
            .insert({ userid: props.theUser.id, currentTime, fileid });
    } else {
        await supabase.
            from('VideoMarks')
            .update({ currentTime, fileid })
            .eq('userid', props.theUser.id);
    }
}

async function getTimeFromDB() {
    const { data } = await supabase
        .from('VideoMarks')
        .select('currentTime')
        .eq('fileid', filedata.value.fileid)

    if (data.length == 0)
        return null;
    else
        return data[0].currentTime;
}

async function saveTimestamp(next = null) {
    if (vtag.value) {
        localStorage.setItem(filedata.value.fileid, vtag.value.currentTime);
        if (props.theUser) {
            await saveTimestampDB();
        }
    }
    if (next)
        next();
}

onBeforeRouteLeave((to, from, next) => {
    saveTimestamp(next);
})
onBeforeUnmount(() => {
    saveTimestamp();
});

const loadedVideo = async (uid) => {
    let val = localStorage.getItem(uid);
    let dbTime = 0;
    if (props.theUser)
        dbTime = await getTimeFromDB();
    if (val == null) val = 0;
    if (dbTime == null) dbTime = 0;
    if (dbTime > val) {
        val = dbTime;
    }
    vtag.value.currentTime = val;
    vtag.value.addEventListener('pause', w => saveTimestamp());
    saveTimestamp();
}

const prepareWatch = async () => {
    await startDownload(false);
    status.value.downloading = false;
}

function gotoLinkFromUID(uid) {
    saveTimestamp();
    router.push(`/file/${uid}`);
    clickedWatch.value = false;
    fetchFiles(uid);
}

async function startDownload(isDownload = true) {
    data.value.msg = "Starting the download.";
    status.value.downloading = true;
    if (status.value.fileurl != null) {
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

async function fetchFiles(newid = null) {
    status.value = { msg: "", finished: false, downloading: false, downloadedBytes: 0, fileurl: null };
    data.value = { msg: "Please wait fetching details...", found: false };
    filedata.value = null;
    // fetch links and download using filedownloader
    let id = route.params.id;
    if (newid) id = newid;
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
}

onMounted(fetchFiles)
</script>

<style scoped>
.row {
    display: flex;
    align-items: middle;
    justify-content: center;
    gap: 10px;
    margin-top: 10px;
}

.watch {
    margin-top: 8px;
}

video {
    width: 70%;
}

@media only screen and (max-width: 900px) {
    video {
        width: 80%;
    }
}

@media only screen and (max-width: 600px) {
    video {
        width: 90%;
    }
}

.main {
    background-color: #fff3;
    padding-bottom: 21px;
}
</style>