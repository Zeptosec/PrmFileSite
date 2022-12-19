<template>
    <div>
        <table>
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
            <tr v-for="(val, ind) in files" :key="ind" @click="selectFile(val)"
                :class="selected.id === val.id ? 'selected' : ''">
                <td>{{ val.id }}</td>
                <td>{{ val.name }}</td>
            </tr>
        </table>
    </div>
</template>

<script setup>
import { ref } from 'vue';
const props = defineProps({
    files: { type: Array, required: true },
    selected: { type: Object, required: true }
});
const sorted = ref({ col: 'id', dir: false });
const emit = defineEmits(['sort', 'select']);

const selectFile = (file) => {
    emit('select', file);
}

const sortBy = (col) => {
    if (sorted.value.col == col) {
        sorted.value.dir = !sorted.value.dir;
    } else {
        sorted.value.col = col;
        sorted.value.dir = false;
    }
    emit('sort', sorted.value);
}
</script>

<style scoped>
@import url('https://css.gg/arrow-down.css');
@import url('https://css.gg/arrow-up.css');

.selected {
    background-color: rgb(81, 255, 119);
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

td {
    user-select: none;
    cursor: pointer;
}
</style>