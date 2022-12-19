<template>
    <main>
        <div v-if="pageData">
            <h2>Here's a list of your created seasons</h2>
            <RouterLink to="/newseason">
                <button>New season</button>
            </RouterLink>
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
                    <th>Operations</th>
                </thead>
                <tr v-for="(row, ind) in pageData" :key="ind">
                    <td>{{ row.id }}</td>
                    <td>{{ row.name }}</td>
                    <td>
                        <div class="operations">
                            <div @click="edit(row)">
                                <i class="gg-pen"></i>
                            </div>
                            <div @click="delRow(row)">
                                <i class="gg-close"></i>
                            </div>
                        </div>
                    </td>
                </tr>
            </table>
            <h3 class="error" v-else>Nothing found</h3>
            <div class="row">
                <button v-if="currentPage > 1" @click="() => currentPage -= 1">Previous</button>
                <button v-if="pageData.length > 0" @click="() => currentPage += 1">Next</button>
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
import { supabase } from '../../supabase';
import router from '../../router';

const searchStr = ref(null);
const msg = ref(null);
const currentPage = ref(1);
const amountPerPage = ref(50);
const pageData = ref(null);
const sorted = ref({ col: 'id', dir: false });
const delmsg = ref(null);

const props = defineProps({
    theUser: { type: Object, required: true }
})

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


function edit(row) {
    router.push(`/editseason/${row.id}`);
}

async function delRow(row) {
    let conf = confirm(`You're about to delete ${row.name}`)
    if (conf) {
        const { data, error } = await supabase
            .from('Movies')
            .select('name')
            .contains('seasonsIds', [row.id])
        if (data.length == 0) {
            const rez = await supabase
                .from('Seasons')
                .delete()
                .eq('id', row.id)
            if (rez.error) {
                delmsg.value = rez.error;
            } else {
                delmsg.value = `Deleted id: ${row.id}`;
                pageData.value = pageData.value.filter(w => w.id !== row.id);
            }
        } else {
            delmsg.value = `Can't delete because this season belongs to movies: ${data.map(w => w.name).join(", ")}`;
        }
    }
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
            .eq('userid', props.theUser.id)
            .like("name", `%${searchStr.value}%`)
            .order(sorted.value.col, { ascending: sorted.value.dir })
            .range((currentPage.value - 1) * amountPerPage.value, currentPage.value * amountPerPage.value);
    } else {
        rez = await supabase
            .from('Seasons')
            .select('id, name')
            .eq('userid', props.theUser.id)
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
        msg.value = "Currently you have no files stored.";
        return;
    }
    pageData.value = data;
}
onMounted(getPageData)
</script>

<style scoped>
@import url('https://css.gg/arrow-down.css');
@import url('https://css.gg/arrow-up.css');
@import url('https://css.gg/pen.css');
@import url('https://css.gg/close.css');

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