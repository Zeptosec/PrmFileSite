<template>
    <main>
        <div>
            <h2>Here is a list of your uploaded files</h2>
            <ol>
                <li v-for="(file, ind) in files" :key="ind">
                    <p><a :href="file.location">{{file.name}}</a></p>
                </li>
            </ol>
        </div>
    </main>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { supabase } from '../supabase';

const msg = ref("");
const files = ref([])

onMounted(async () => {
    const { data, error } = await supabase
        .from('StoredFiles')
        .select('*');
    if (error) {
        msg.value = error;
        return;
    }
    files.value = data;
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