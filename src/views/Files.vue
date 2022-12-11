<template>
    <main>
        <div class="filetable">
            <LoginFileTable v-if="files.length > 0" :files="files" />
            <div v-else>
                <h2>{{ msg }}</h2>
            </div>
            <div class="row">
                <button v-if="currentPage > 1" @click="() => currentPage -= 1">Previous</button>
                <button v-if="canGoNext()" @click="() => currentPage += 1">Next</button>
            </div>
        </div>
    </main>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { supabase } from '../supabase';
import { chunkSize } from '../compositions/fileuploader';
import { getLinkFromFile } from '../compositions/filedownloader';
import LoginFileTable from '../components/LoginFileTable.vue';

const msg = ref("Fething files...");
const files = ref([]);
const currentPage = ref(1);
const amountPerPage = ref(50);
const fileCount = ref(0);

watch(currentPage, getPageData);

const canGoNext = () => {
    // heard something about the number 1000 being the limit??
    if(fileCount.value == 1000){
        return true;
    }
    return Math.floor(fileCount.value / amountPerPage.value) >= currentPage.value;
}

function getFileIDFromUID(searchFiles, fileuid) {
    if (!fileuid) return "";
    const val = searchFiles.find(w => w.fileid === fileuid);
    if (val) return val.id;
    else return "";
}

async function getPageData() {
    //console.log(currentPage.value);
    const { data, count, error } = await supabase
        .from('Files')
        .select('id, size, chunks, name, fileid, path, previous(id), next(id)', { count: 'estimated' })
        .order('id', { ascending: false })
        .range((currentPage.value - 1) * amountPerPage.value, currentPage.value * amountPerPage.value);
    fileCount.value = count;
    if (error) {
        msg.value = error;
        return;
    }
    if (!data) {
        msg.value = "Currently you have no files stored.";
        return;
    }
    let tmp = [];
    for (let i = 0; i < data.length; i++) {
        let lnk = "";
        let direct = false;
        if (data[i].size > chunkSize) {
            lnk = "/file/" + data[i].fileid;
        } else {
            lnk = getLinkFromFile({ location: data[i].chunks[0], name: data[i].name });
            direct = true;
        }

        tmp.push({
            location: lnk,
            name: data[i].name,
            size: data[i].size,
            direct,
            id: data[i].id,
            fileid: data[i].fileid,
            next: data[i].next,
            previous: data[i].previous
        });
    }
    files.value = tmp;
}

onMounted(getPageData);
</script>

<style scoped>
h2 {
    margin: 0px;
    padding: 15px 0;
}

.row {
    display: flex;
    align-items: middle;
    justify-content: center;
    gap: 10px;
    margin: 10px 0;
}

.filetable {
    background-color: #fff3;
}
</style>