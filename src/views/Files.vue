<template>
    <main>
        <FileTable v-if="files.length > 0" :files="files" />
        <div v-else>
            <h2>{{msg}}</h2>
        </div>
    </main>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { supabase } from '../supabase';
import { chunkSize } from '../compositions/fileuploader';
import FileTable from '../components/FileTable.vue';

const msg = ref("Fething files...");
const files = ref([])

onMounted(async () => {
    const { data, error } = await supabase
        .from('Files')
        .select('*')
        .order('created_at', { ascending: false });
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
            lnk = data[i].chunks[0];
            direct = true;
        }
        tmp.push({
            location: lnk,
            name: data[i].name,
            size: data[i].size,
            direct
        });
    }
    files.value = tmp;
    //console.log(data);
})
</script>

<style scoped>

h2 {
    margin: 0px;
    padding: 15px 0;
}
</style>