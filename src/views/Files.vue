<template>
    <main>
        <div class="filetable">
            <LoginFileTable @sort="(w) => changeSort(w)" @publicChange="(f, v) => changePublic(f, v)"
                @filter-text="w => filterRezults(w)" :files="files" :theUser="theUser" />

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
const searchStr = ref(null);
const ordering = ref({ col: "id", dir: false });
const props = defineProps({
    theUser: {
        type: Object,
        required: false
    }
});

const changeSort = (val) => {
    ordering.value.col = val.col;
    ordering.value.dir = val.dir;
    getPageData();
}

const changePublic = async (file, val) => {
    const { error } = await supabase
        .from("Files")
        .update({ isPublic: val })
        .eq('id', file.id);
}

let tout2 = null;
watch(currentPage, () => {
    clearTimeout(tout2);
    getPageData()
});

const filterRezults = (text) => {
    searchStr.value = text;
    tout2 = setTimeout(getPageData, 100);
    currentPage.value = 1;
}

const canGoNext = () => {
    // heard something about the number 1000 being the limit??
    if (fileCount.value == 1000) {
        return true;
    }
    return Math.floor(fileCount.value / amountPerPage.value) >= currentPage.value;
}

async function getPageData() {
    //console.log(currentPage.value);
    let rez;
    if (searchStr.value) {
        rez = await supabase
            .from('Files')
            .select('id, size, chunks, name, fileid, previous(id), next(id), isPublic', { count: 'estimated' })
            .like("name", `%${searchStr.value}%`)
            .order(ordering.value.col, { ascending: ordering.value.dir })
            .range((currentPage.value - 1) * amountPerPage.value, currentPage.value * amountPerPage.value);
    } else {
        rez = await supabase
            .from('Files')
            .select('id, size, chunks, name, fileid, previous(id), next(id), isPublic', { count: 'estimated' })
            .order(ordering.value.col, { ascending: ordering.value.dir })
            .range((currentPage.value - 1) * amountPerPage.value, currentPage.value * amountPerPage.value);
    }

    const { data, count, error } = rez;
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
            previous: data[i].previous,
            isPublic: data[i].isPublic
        });
    }
    if (tmp.length == 0) {
        msg.value = "Nothing was found";
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