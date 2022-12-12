<template>
    <div>
        <Teleport to="#app">
            <div class="cp-info" @contextmenu="e => e.preventDefault()"
                :style="{ 'position': 'absolute', 'display': display, 'top': position.y+ 'px', 'left': position.x+'px' }">
                Link copied!</div>
        </Teleport>
        <div>
            <h2>Here is a list of your uploaded files</h2>
            <p><b>Left click Name to download</b></p>
            <p><b>Right click Name to copy link</b></p>
            <table class="table" >
                <input :class="searchSuccess == null ? '' : searchSuccess ? 'correct' : 'incorrect'" type="text"
                    name="filter" id="filter" @input="w => SearchField(w.target.value)">
                <thead v-if="files.length > 0">
                    <th>ID</th>
                    <th>Name</th>
                    <th>Size</th>
                    <th>Previous (ID)</th>
                    <th>Next (ID)</th>
                    <th>Public</th>
                </thead>
                <tr v-if="files.length > 0" v-for="(file, ind) in files" :key="ind">
                    <td>{{ file.fileid ? file.id : "---" }}</td>
                    <td @contextmenu="rightClickCopy($event, file.location, file.size)" class="pointer"
                        @click="clickRow(file)">{{ file.name }}</td>
                    <td>{{ toReadable(file.size) }}</td>
                    <td><input v-if="file.fileid"
                            :class="file.prevError == null ? '' : file.prevError ? 'incorrect' : 'correct'"
                            @change="e => onChangePrevious(e.target.value, file)"
                            :value="file.previous ? file.previous.id : ''" type="number">
                    </td>
                    <td><input v-if="file.fileid"
                            :class="file.nextError == null ? '' : file.nextError ? 'incorrect' : 'correct'"
                            @change="e => onChangeNext(e.target.value, file)" :value="file.next ? file.next.id : ''"
                            type="number"></td>
                    <td>
                        <input @change="w => emit('publicChange',file, w.target.checked)" :checked="file.isPublic" type="checkbox" name="">
                    </td>
                </tr>
            </table>
            <p v-if="files.length == 0">Nothing was found</p>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { toReadable } from '../compositions/filedownloader';
import { chunkSize } from '../compositions/fileuploader';
import { getLinkFromFile } from '../compositions/filedownloader';
import router from '../router';
import { supabase } from '../supabase';
const display = ref("none");
const position = ref({ x: 0, y: 0 });
const timeout = ref();
const searchSuccess = ref(null);

const props = defineProps({
    files: { type: Array, required: true },
    Showfolders: { type: Boolean }
});

const emit = defineEmits(['filterText', 'publicChange']);

let tout = null;
const SearchField = (text) => {
    if (tout)
        clearTimeout(tout);
    tout = setTimeout(() => {
        if (!text) text = null;
        emit('filterText', text);
    }, 1000);
}

async function onChangePrevious(value, file) {
    if (value == "" || value == file.id) {
        file.prevError = null;
        value = null;
    }
    const { error } = await supabase
        .from('Files')
        .update({ previous: value })
        .eq('id', file.id);
    if (error) {
        console.log(error);
        file.prevError = true;
    } else {
        file.previous = { id: value };
        file.prevError = false;
    }
}

async function onChangeNext(value, file) {
    if (value == "" || value == file.id) {
        value = null;
        file.nextError = null;
    }
    const { error } = await supabase
        .from('Files')
        .update({ next: value })
        .eq('id', file.id);
    if (error) {
        console.log(error);
        file.nextError = true;
    } else {
        file.next = { id: value };
        file.nextError = false;
    }
}

function rightClickCopy(event, loc, size) {
    event.preventDefault();
    const clipboardData =
        event.clipboardData ||
        window.clipboardData ||
        event.originalEvent?.clipboardData ||
        navigator.clipboard;
    if (size > chunkSize) {
        loc = window.location.origin + loc;
    }
    clipboardData.writeText(loc);
    display.value = "block";
    var scrollLeft = (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
    var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;

    position.value.x = event.clientX - 56 + scrollLeft;
    position.value.y = event.clientY - 15 + scrollTop;
    clearInterval(timeout.value);
    timeout.value = setTimeout(() => {
        display.value = "none";
    }, 500)
}

function clickRow(file) {
    if (file.size <= chunkSize) {

        window.open(getLinkFromFile(file), '_blank');
    } else {
        let routeData = router.resolve(getLinkFromFile(file));
        window.open(routeData.href, '_blank');
    }
}
</script>

<style scoped>
.table {
    position: relative;
    width: 100%;
}

.incorrect {
    border-color: red;
}

.correct {
    border-color: rgb(0, 204, 0);
}

td input {
    width: 50px;
}

#filter {
    position: absolute;
    top: -35px;
    border-width: 1px;
    border-radius: 5px;
    border-style: solid;
    right: 0px;
    width: 180px;
    padding: 3px;
}

#filter:focus {
    outline: none;
}

.cp-info {
    font-size: larger;
    font-weight: bold;
    cursor: default;
    border-radius: 10px;
    padding: 5px;
    background-color: cyan;
}

h2 {
    margin: 0px;
    padding: 15px 0;
}

.pointer {
    cursor: pointer;
}
</style>