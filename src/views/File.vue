<template>
    <main>
        <div>
            <h1>{{data}}</h1>
        </div>
    </main>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { download } from '../compositions/filedownloader';

const route = useRoute();
const data = ref("Please wait fetching details...");
onMounted(async () => {
    // fetch links and download using filedownloader
    const id = route.params.id;
    if (!id) {
        data.value = "No id was found in a query";
        return;
    }
    const res = await fetch("https://tartan-general-scion.glitch.me/api/file?id=" + id);
    const json = await res.json();
    if (res.ok) {
        const filedata = json.data[0];
        console.log(filedata);
        if (!filedata) {
            data.value = "File was not found";
        } else {
            data.value = "File was found. Starting the download.";
            try {
                await download(filedata.name, filedata.chunks);
                console.log("Download was successful.")
            } catch (err) {
                data.value = "Download failed. " + err.message;
            }
        }
    } else {
        data.value = json.error;
    }
})
</script>

<style scoped>

</style>