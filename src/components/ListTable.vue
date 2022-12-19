<template>
    <div>
        <table>
            <thead>
                <th v-for="(val, ind) in headers" @click="sortBy(ind)">
                    <div>
                        <p>{{ val }}</p>
                        <div v-if="sorted.col == ind">
                            <i v-if="!sorted.dir" class="gg-arrow-down"></i>
                            <i v-else class="gg-arrow-up"></i>
                        </div>
                    </div>
                </th>
                <th v-if="options">Options</th>
            </thead>
            <tr v-for="(row, rind) in rows" :key="rind">
                <td v-for="(val, cind) in row" :key="cind">{{ val }}</td>
                <td v-if="options">{{ options[rind] }}</td>
            </tr>
        </table>
    </div>
</template>

<script setup>

const props = defineProps({
    headers: { type: Array, required: true },
    rows: { type: Array, required: true },
    options: { type: Array }
})

const emit = defineEmits(['sort']);

</script>

<style lang="scss" scoped>

</style>