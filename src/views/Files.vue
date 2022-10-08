<template>
    <main>
        <div>
            <Teleport to="#app">
                <div class="cp-info"
                    :style="{ 'position': 'absolute', 'display': display, 'top': position.y+ 'px', 'left': position.x+'px' }">
                    Link copied!</div>
            </Teleport>
            <div v-if="files.length > 0">
                <h2>Here is a list of your uploaded files</h2>

                <table>
                    <thead>
                        <th>Nr.</th>
                        <th>Name</th>
                        <th>Size</th>
                    </thead>
                    <tr v-for="(file, ind) in files" :key="ind" class="pointer"
                        @click="clickRow(file.location, file.direct)"
                        @contextmenu="rightClickCopy($event, file.location, file.direct)">
                        <td>{{ind+1}}</td>
                        <td>{{file.name}}</td>
                        <td>{{file.size}}</td>
                    </tr>
                </table>
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
import { toReadable } from '../compositions/filedownloader';
import router from '../router';

const msg = ref("Fething files...");
const files = ref([])
const display = ref("none");
const position = ref({ x: 0, y: 0 });
const timeout = ref();

function rightClickCopy(event, loc, direct) {
    event.preventDefault();
    const clipboardData =
        event.clipboardData ||
        window.clipboardData ||
        event.originalEvent?.clipboardData ||
        navigator.clipboard;
    if (!direct) {
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

function clickRow(loc, direct) {
    if (direct) {
        window.open(loc, '_blank');
    } else {
        let routeData = router.resolve(loc);
        window.open(routeData.href, '_blank');
    }
}

onMounted(async () => {
    const { data, error } = await supabase
        .from('Files')
        .select('*')
        .order('created_at', { ascending: false });
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
        let direct = false;
        if (data[i].size > chunkSize) {
            lnk = "/file/" + data[i].fileid;
        } else {
            lnk = data[i].chunks[0];
            direct = true;
        }
        tmp.push({
            location: lnk,
            name: data[i].name,
            size: toReadable(data[i].size),
            direct
        });
    }
    files.value = tmp;
    //console.log(data);
})
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

.pointer {
    cursor: pointer;
}

div {
    background-color: #fff3;
}

h2 {
    margin: 0px;
    padding: 15px 0;
}
</style>