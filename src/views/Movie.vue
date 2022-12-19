<template>
    <main>
        <div v-if="pageData">
            <div class="m-small">
                <h2>{{ movie.name }}</h2>
                <h2>seasons</h2>
            </div>
            <div class="form">
                <h3>Search</h3>
                <input type="text" @input="w => SearchField(w.target.value)">
            </div>
            <table v-if="pageData.length > 0">
                <thead>
                    <th @click="sortBy('id')">
                        <div>
                            <p>ID</p>
                            <div v-if="sorted.col == 'id'">
                                <i v-if="!sorted.dir" class="gg-arrow-down"></i>
                                <i v-else class="gg-arrow-up"></i>
                            </div>
                        </div>
                    </th>
                    <th @click="sortBy('name')">
                        <div>
                            <p>Name</p>
                            <div v-if="sorted.col == 'name'">
                                <i v-if="!sorted.dir" class="gg-arrow-down"></i>
                                <i v-else class="gg-arrow-up"></i>
                            </div>
                        </div>
                    </th>
                </thead>
                <tr v-for="(row, ind) in pageData" :key="ind" @click="router.push(`/season/${row.id}`)">
                    <td>{{ row.id }}</td>
                    <td>{{ row.name }}</td>
                </tr>
            </table>
            <h3 class="error" v-else>Nothing found</h3>
            <div class="row">
                <button v-if="currentPage > 1" @click="() => currentPage -= 1">Previous</button>
                <button v-if="pageData.length == 51" @click="() => currentPage += 1">Next</button>
            </div>

            <h3 class="error">{{ delmsg }}</h3>
        </div>
        <div v-else>
            <h2>{{ msg }}</h2>
        </div>
    </main>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { supabase } from '../supabase';
import { useRoute } from 'vue-router';
import router from '../router';

const route = useRoute();
const searchStr = ref(null);
const msg = ref(null);
const currentPage = ref(1);
const amountPerPage = ref(50);
const pageData = ref(null);
const sorted = ref({ col: 'id', dir: false });
const delmsg = ref(null);
const movie = ref(null);

let tout2 = null;
watch(currentPage, () => {
    clearTimeout(tout2);
    getPageData();
});

let tout = null;
const SearchField = (text) => {
    if (tout)
        clearTimeout(tout);
    tout = setTimeout(() => {
        if (!text) text = null;
        searchStr.value = text;
        tout2 = setTimeout(getPageData, 100);
        currentPage.value = 1;
    }, 1000);
}

const sortBy = (col) => {
    if (sorted.value.col == col) {
        sorted.value.dir = !sorted.value.dir;
    } else {
        sorted.value.col = col;
        sorted.value.dir = false;
    }
    getPageData();
}

async function getPageData() {
    msg.value = "Loading...";
    let rez;
    if (searchStr.value) {
        rez = await supabase
            .from('Seasons')
            .select('id, name')
            .like("name", `%${searchStr.value}%`)
            .order(sorted.value.col, { ascending: sorted.value.dir })
            .range((currentPage.value - 1) * amountPerPage.value, currentPage.value * amountPerPage.value);
    } else {
        rez = await supabase
            .from('Seasons')
            .select('id, name')
            .order(sorted.value.col, { ascending: sorted.value.dir })
            .range((currentPage.value - 1) * amountPerPage.value, currentPage.value * amountPerPage.value);
    }

    const { data, error } = rez;
    if (error) {
        msg.value = error;
        console.log(error);
        return;
    }
    if (!data) {
        msg.value = "No seasons found";
        return;
    }
    pageData.value = data;
}
onMounted(async () => {
    const { data, error } = await supabase
        .from("Movies")
        .select('id, name')
        .eq('id', route.params.id);
    if(error) {
        msg.value = error;
        return;
    }
    if (data.length == 0) {
        msg.value = "Movie not found";
    } else {
        movie.value = data[0];
        getPageData();
    }

})
</script>

<style scoped>
@import url('https://css.gg/arrow-down.css');
@import url('https://css.gg/arrow-up.css');
@import url('https://css.gg/pen.css');
@import url('https://css.gg/close.css');

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