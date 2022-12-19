<template>
    <main>
        <div v-if="pageData != null && !fatal">
            <h2>Select episodes in order</h2>
            <div class="form">
                <h3>Search</h3>
                <input type="text" @input="w => SearchField(w.target.value)">
            </div>
            <OrderTable v-if="pageData.length > 0" :files="pageData" :index-of="indexOf" @changeOrder="w => changeOrder(w.fileid)"
                @sort="w => sort(w)" />
            <h3 class="error" v-else>Nothing found</h3>
            <div class="row">
                <button v-if="currentPage > 1" @click="() => currentPage -= 1">Previous</button>
                <button @click="() => currentPage += 1">Next</button>
            </div>
            <div class="form">
                <h3>Season name</h3>
                <input v-model="seasonName" type="text">
                <button :disabled="isCreating" @click="Update">Update</button>
                <h3 ref="error" v-if="createError" class="error">{{ createError }}</h3>
            </div>
        </div>
        <div v-else>
            <h2>{{ msg }}</h2>
        </div>
    </main>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import OrderTable from '../../components/OrderTable.vue';
import { supabase } from '../../supabase';

const route = useRoute();
const id = route.params.id;
const searchStr = ref(null);
const msg = ref(null);
const currentPage = ref(1);
const amountPerPage = ref(50);
const pageData = ref(null);
const order = ref([]);
const sorted = ref({ col: 'id', dir: false });
const fatal = ref(false);

const isCreating = ref(false);
const seasonName = ref("");
const createError = ref(null);
const error = ref(null);
const props = defineProps({
    theUser: { type: Object, required: true }
})

let tout2 = null;
watch(currentPage, () => {
    clearTimeout(tout2);
    getPageData();
});

async function Update() {
    isCreating.value = true;
    createError.value = null;
    seasonName.value = seasonName.value.trim();
    if (seasonName.value.length > 50) {
        createError.value = "Season name is too long";
    } else if (seasonName.value.length == 0) {
        createError.value = "Season name can't be empty";
    } else if (order.value.length == 0) {
        createError.value = "No episodes were selected";
    }

    if (!createError.value) {
        const { error } = await supabase
            .from('Seasons')
            .update({ name: seasonName.value, episodeIds: order.value })
            .eq('id', id);
        if (error) {
            createError.value = error;
        } else {
            createError.value = "Updated";
        }
    }

    if (createError.value) {
        setTimeout(() => error.value.scrollIntoView({ behavior: "smooth" }), 20);
    }
    isCreating.value = false;
}

function indexOf(val) {
    return order.value.indexOf(val.fileid);
}

const changeOrder = (id) => {
    let ind = order.value.indexOf(id);
    if (ind != -1) {
        order.value.splice(ind, 1);
    } else {
        order.value.push(id);
    }
}

const sort = (val) => {
    sorted.value = val;
    getPageData();
}

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

async function getPageData() {
    msg.value = "Loading...";
    let rez;
    if (searchStr.value) {
        rez = await supabase
            .from('Files')
            .select('id, name, fileid')
            .not('fileid', 'is', null)
            .like("name", `%${searchStr.value}%`)
            .order(sorted.value.col, { ascending: sorted.value.dir })
            .range((currentPage.value - 1) * amountPerPage.value, currentPage.value * amountPerPage.value);
    } else {
        rez = await supabase
            .from('Files')
            .select('id, name, fileid')
            .not('fileid', 'is', null)
            .order(sorted.value.col, { ascending: sorted.value.dir })
            .range((currentPage.value - 1) * amountPerPage.value, currentPage.value * amountPerPage.value);
    }

    const { data, error } = rez;
    if (error) {
        msg.value = error;
        return;
    }
    if (!data) {
        msg.value = "Currently you have no files stored.";
        return;
    }
    pageData.value = data;
}


onMounted(async () => {
    const { data, error } = await supabase
    .from("Seasons")
    .select('name, episodeIds')
    .eq('id', id);
    getPageData();
    if(error){
        msg.value = error;
        console.log(error);
        fatal.value = true;
    } else {
        order.value = data[0].episodeIds;
        seasonName.value = data[0].name;
    }
});

</script>

<style scoped>
.form {
    display: grid;
    grid-template-columns: 200px;
    gap: 10px;
    justify-content: center;
}

.form h3 {
    margin: 0px auto;
}

.form button {
    margin: auto;
}

input {
    padding: 4px;
    border-radius: 8px;
    border: 1px solid gray;
    outline: none;
}

.row {
    display: flex;
    align-items: middle;
    justify-content: center;
    gap: 10px;
    margin: 10px 0;
}
</style>