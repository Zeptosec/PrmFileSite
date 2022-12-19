<template>
    <main>
        <div v-if="season">
            <div class="m-small">
                <h2>{{ season.name }}</h2>
                <h2>episodes</h2>
            </div>

            <div class="items">
                <RouterLink v-for="(val, ind) in season.episodeIds" :key="ind" :to="`/file/${val}`">
                    <button>{{ ind + 1 }}</button>
                </RouterLink>
            </div>

            <h3 class="error">{{ delmsg }}</h3>
        </div>
        <div v-else>
            <h2>{{ msg }}</h2>
        </div>
    </main>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { supabase } from '../supabase';
import { useRoute } from 'vue-router';

const route = useRoute();
const msg = ref(null);
const delmsg = ref(null);
const season = ref(null);

onMounted(async () => {
    const { data, error } = await supabase
        .from("Seasons")
        .select('episodeIds, name')
        .eq('id', route.params.id);
    if (error) {
        msg.value = error;
        return;
    }
    if (data.length == 0) {
        msg.value = "Season not found";
    } else {
        season.value = data[0];
    }

})
</script>

<style scoped>
@import url('https://css.gg/arrow-down.css');
@import url('https://css.gg/arrow-up.css');
@import url('https://css.gg/pen.css');
@import url('https://css.gg/close.css');


.items {
    max-width: 350px;
    display: flex;
    justify-content: center;
    margin: 10px auto;
    gap: 5px;
    flex-wrap: wrap;
}

.items button {
    width: 66px;
}

.m-small>h2 {
    margin: 2px;
}

td {
    cursor: pointer;
}

.row {
    display: flex;
    align-items: middle;
    justify-content: center;
    gap: 10px;
    margin: 10px 0;
}

.form {
    margin-top: 20px;
    display: grid;
    grid-template-columns: 200px;
    gap: 10px;
    justify-content: center;
}

.form h3 {
    margin: 0px auto;
}

input {
    padding: 4px;
    border-radius: 8px;
    border: 1px solid gray;
    outline: none;
}

.operations {
    display: flex;
    gap: 17px;
    justify-content: center;
}

.operations>div {
    width: 22px;
    height: 22px;
    cursor: pointer;
}

.operations>div {
    transition: 0.1s ease-in;
}

.operations>div:hover {
    color: #279e2d;
}

.operations>div:first-child>i:first-child {
    margin-top: 7px;
    margin-left: 6px;
}

.text-center {
    text-align: center;
}

th>div:first-child {
    display: flex;
}

th:nth-child(-n+2) {
    user-select: none;
    cursor: pointer;
}

th p {
    margin: auto 0;
}
</style>