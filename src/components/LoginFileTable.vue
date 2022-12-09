<template>
    <div class="filetable">
        <Teleport to="#app">
            <div class="cp-info" @contextmenu="e => e.preventDefault()"
                :style="{ 'position': 'absolute', 'display': display, 'top': position.y+ 'px', 'left': position.x+'px' }">
                Link copied!</div>
        </Teleport>
        <div v-if="files.length > 0">
            <h2>Here is a list of your uploaded files</h2>
            <p><b>Left click Name to download</b></p>
            <p><b>Right click Name to copy link</b></p>
            <table>
                <thead>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Size</th>
                    <th>Previous (ID)</th>
                    <th>Next (ID)</th>
                </thead>
                <tr v-for="(file, ind) in files" :key="ind">
                    <td>{{ file.fileid ? file.id : "---" }}</td>
                    <td @contextmenu="rightClickCopy($event, file.location, file.size)" class="pointer"
                        @click="clickRow(file)">{{ file.name }}</td>
                    <td>{{ toReadable(file.size) }}</td>
                    <td><input v-if="file.fileid" :class="file.prevError == null ? '' : file.prevError ? 'incorrect' : 'correct'"
                            @change="e => onChangePrevious(e.target.value, file)" :value="file.previous" type="number">
                    </td>
                    <td><input v-if="file.fileid" :class="file.nextError == null ? '' : file.nextError ? 'incorrect' : 'correct'"
                        @change="e => onChangeNext(e.target.value, file)" :value="file.next"
                        type="number"></td>
                </tr>
            </table>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { toReadable } from '../compositions/filedownloader';
import { chunkSize } from '../compositions/fileuploader';
import { getLinkFromFile } from '../compositions/filedownloader';
import router from '../router';
import { supabase } from '../supabase';
const display = ref("none");
const position = ref({ x: 0, y: 0 });
const timeout = ref();

const props = defineProps({
    files: { type: Array, required: true },
    Showfolders: { type: Boolean }
});

function getFileUIDFromID(id) {
    if (!id) return null;
    const val = props.files.find(w => w.id == id);
    if (!val) return null;
    else return val;
}

async function onChangePrevious(value, file) {
    if (value == "" || value == file.id) {
        file.prevError = null;
        return;
    }
    const val = getFileUIDFromID(value);
    if (val) {
        if (val.fileid != null) {
            const { error } = await supabase
                .from('Files')
                .update({ previous: val.fileid })
                .eq('id', file.id);
            if (error) {
                console.log(error);
                file.prevError = true;
            } else {
                file.previous = value;
                file.prevError = false;
            }
        } else {
            file.prevError = true;
            //i dunno print an error that theres no file id
            console.log("File doesnt have a fileid because its too small..")
        }
    } else {
        file.prevError = true;
    }
}

async function onChangeNext(value, file) {
    if (value == "" || value == file.id) {
        file.nextError = null;
        return;
    }
    const val = getFileUIDFromID(value);
    if (val) {
        if (val.fileid != null) {
            const { error } = await supabase
                .from('Files')
                .update({ next: val.fileid })
                .eq('id', file.id);
            if (error) {
                console.log(error);
                file.nextError = true;
            } else {
                file.next = value;
                file.nextError = false;
            }
        } else {
            file.nextError = true;
            //i dunno print an error that theres no file id
            console.log("File doesnt have a fileid because its too small..")
        }
    } else {
        file.nextError = true;
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
.incorrect {
    border-color: red;
}

.correct {
    border-color: rgb(0, 204, 0);
}

td input {
    width: 50px;
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

.filetable {
    background-color: #fff3;
}
</style>