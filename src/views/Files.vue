<template>
    <main>
        <div>
            <div v-if="files.length > 0">
                <h2>Here is a list of your uploaded files</h2>
                <ol>
                    <li v-for="(file, ind) in files" :key="ind">
                        <p><a :href="file.location">{{file.name}}</a></p>
                    </li>
                </ol>
            </div>
            <div v-else>
                <h2>{{msg}}</h2>
            </div>
        </div>
    </main>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { supabase } from '../supabase';
import { chunkSize } from '../compositions/fileuploader';

const msg = ref("Fething files...");
const files = ref([])

onMounted(async () => {
    const { data, error } = await supabase
        .from('Files')
        .select('*')
        .order('created_at', { ascending: false });
    console.log(data);
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
        if (data[i].size > chunkSize) {
            lnk = "/file/" + data[i].fileid;
        } else {
            lnk = data[i].chunks[0];
        }
        tmp.push({
            location: lnk,
            name: data[i].name
        });
    }
    files.value = tmp;
    //console.log(data);
})
</script>

<style scoped>
div {
    background-color: #fff3;
}

h2 {
    margin: 0px;
    padding: 15px 0;
}
</style>