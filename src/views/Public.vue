<template>
    <div>
        <h2 v-if="files.length == 0">Loading...</h2>
        <FileTable v-else :files="files" :heading="'Here are the public files'" />
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { chunkSize } from '../compositions/fileuploader';
import { getLinkFromFile } from '../compositions/filedownloader';
import axios from 'axios';
import FileTable from '../components/FileTable.vue';
const files = ref([])
const msg = ref(null);

async function getPageData() {
    let data = null;
    try {
        const res = await axios.get(`https://tartan-general-scion.glitch.me/public`);
        data = res.data.data;
    } catch(err){
        console.log(err);
    }

    if (!data) {
        msg.value = "No files found.";
        return;
    }
    for (let i = 0; i < data.length; i++) {
        let lnk = "";
        if (data[i].size > chunkSize) {
            lnk = "/file/" + data[i].fileid;
        } else {
            lnk = getLinkFromFile({ location: data[i].chunks[0], name: data[i].name });
            direct = true;
        }
        const tmpf = ref({
            savedFileData: {
                size: data[i].size,
                name: data[i].name,
                link: lnk,
            }
        });
        files.value.push(tmpf);
    }
    if (data.length == 0) {
        msg.value = "Nothing was found";
    }
}

onMounted(getPageData);

</script>

<style scoped>

</style>