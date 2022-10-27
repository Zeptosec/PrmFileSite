<template>
    <div class="filetable">
        <Teleport to="#app">
            <div class="cp-info" @contextmenu="e => e.preventDefault()"
                :style="{ 'position': 'absolute', 'display': display, 'top': position.y+ 'px', 'left': position.x+'px' }">
                Link copied!</div>
        </Teleport>
        <div v-if="files.length > 0">
            <h2>Here is a list of your uploaded files</h2>
            <p><b>Left click to download</b></p>
            <p><b>Right click to copy link</b></p>
            <table>
                <thead>
                    <th>Nr.</th>
                    <th>Name</th>
                    <th>Size</th>
                </thead>
                <tr v-for="(file, ind) in files" :key="ind" class="pointer"
                    @click="clickRow(file)"
                    @contextmenu="rightClickCopy($event, file.location, file.size)">
                    <td>{{ind+1}}</td>
                    <td>{{file.name}}</td>
                    <td>{{toReadable(file.size)}}</td>
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
const display = ref("none");
const position = ref({ x: 0, y: 0 });
const timeout = ref();

const props = defineProps({
    files: { type: Array, required: true },
});

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

.filetable{
    background-color: #fff3;
}
</style>