<template>
    <main>
        <div class="page" v-if="pageData != null">
            <h2>Select seasons in order</h2>
            <button v-if="seltype === 0" @click="changeType(1)">select a single file</button>
            <button v-if="seltype === 1" @click="changeType(0)">select seasons</button>

            <div class="form">
                <h3>Search</h3>
                <input type="text" @input="w => SearchField(w.target.value)">
            </div>
            <OrderTable v-if="seltype === 0" :files="pageData" :index-of="indexOf" @changeOrder="w => changeOrder(w.id)"
                @sort="w => sort(w)" />
            <FileSelect v-if="seltype === 1" :files="pageData" @sort="w => sort(w)" @select="w => selected = w"
                :selected="selected" />
            <div class="row">
                <button v-if="currentPage > 1" @click="() => currentPage -= 1">Previous</button>
                <button @click="() => currentPage += 1">Next</button>
            </div>
            <div class="form">
                <h3>Movie name</h3>
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
import FileSelect from '../../components/FileSelect.vue';
import OrderTable from '../../components/OrderTable.vue';
import { supabase } from '../../supabase';
import { useRoute } from 'vue-router';

const route = useRoute();
const id = route.params.id;
const searchStr = ref(null);
const msg = ref(null);
const currentPage = ref(1);
const amountPerPage = ref(50);
const pageData = ref(null);
const order = ref([]);
const sorted = ref({ col: 'id', dir: false });
const seltype = ref(0);

const isCreating = ref(false);
const seasonName = ref("");
const createError = ref(null);
const error = ref(null);
const selected = ref({});
const props = defineProps({
    theUser: { type: Object, required: true }
})

let tout2 = null;
watch(currentPage, () => {
    clearTimeout(tout2);
    getPageData();
});

function changeType(type) {
    seltype.value = type;
    pageData.value = null;
    SearchField(null);
}

async function Update() {
    isCreating.value = true;
    createError.value = null;
    seasonName.value = seasonName.value.trim();
    if (seasonName.value.length > 50) {
        createError.value = "Movie name is too long";
    } else if (seasonName.value.length == 0) {
        createError.value = "Movie name can't be empty";
    }
    if (seltype === 0) {
        if (order.value.length == 0) {
            createError.value = "No episodes were selected";
        }
    } else {
        if (selected.value == null) {
            createError.value = "No file was selected";
        }
    }
    console.log(seltype.value);


    if (!createError.value) {
        let updateObj;
        if (seltype.value === 0) {
            updateObj = { name: seasonName.value, seasonsIds: order.value, fileid: null, userid: props.theUser.id };
        } else {
            updateObj = { name: seasonName.value, fileid: selected.value.fileid, seasonsIds: null, userid: props.theUser.id }
        }
        console.log(updateObj);
        const { error } = await supabase
            .from('Movies')
            .update(updateObj)
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
    return order.value.indexOf(val.id);
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
        if (seltype.value === 0) {
            rez = await supabase
                .from('Seasons')
                .select('id, name')
                .eq('userid', props.theUser.id)
                .like("name", `%${searchStr.value}%`)
                .order(sorted.value.col, { ascending: sorted.value.dir })
                .range((currentPage.value - 1) * amountPerPage.value, currentPage.value * amountPerPage.value);
        } else {
            rez = await supabase
                .from('Files')
                .select('id, name, fileid')
                .not('fileid', 'is', null)
                .like("name", `%${searchStr.value}%`)
                .order(sorted.value.col, { ascending: sorted.value.dir })
                .range((currentPage.value - 1) * amountPerPage.value, currentPage.value * amountPerPage.value);
        }
    } else {
        if (seltype.value === 0) {
            rez = await supabase
                .from('Seasons')
                .select('id, name')
                .eq('userid', props.theUser.id)
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

const getFileByFID = async (fid) => {
    const { data, error } = await supabase
        .from('Files')
        .select('id, name')
        .eq('fileid', fid);
    if (error) {
        throw Error(error);
    } else {
        return { id: data[0].id, name: data[0].name, fileid: fid };
    }
}

onMounted(async () => {
    const { data, error } = await supabase
        .from("Movies")
        .select('name, seasonsIds, fileid, userid')
        .eq('id', id);
    if (data.length == 0) {
        msg.value = "Movie doesn't exist";
        return;
    }
    if (error) {
        msg.value = error;
        console.log(error);
        fatal.value = true;
        return;
    } else {
        if (data[0].userid != props.theUser.id) {
            msg.value = "You do not own this movie";
            return;
        }
        if (data[0].seasonsIds) {
            order.value = data[0].seasonsIds;
            seltype.value = 0;
        } else if(data[0].fileid) {
            let selfile = {};
            try {
                selfile = await getFileByFID(data[0].fileid);
            } catch (err) {
                msg.value = err.message;
                console.log(err);
                return;
            }
            selected.value = selfile;
            seltype.value = 1;
        } else {
            msg.value = "Movie doesn't have any seasons or a file";
        }
        seasonName.value = data[0].name;
    }
    getPageData();
});

</script>

<style scoped>
.form {
    display: grid;
    grid-template-columns: 200px;
    gap: 10px;
    justify-content: center;
    margin-top: 15px;
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

.page {
    padding-bottom: 25px;
}
</style>