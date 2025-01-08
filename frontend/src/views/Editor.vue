<template>
    <div class="w-screen h-screen flex flex-col">
        <TopBar />
        <div class="flex w-full h-full">
            <Splitter class="flex-auto">
                <SplitterPanel class="flex flex-col gap-4" :size="20" :minSize="20">
                    <Button label="New File" icon="pi pi-plus" class="w-full" />
                    <Button label="Render" icon="pi pi-file" class="w-full" @click="renderProject" /> 
                    <Tree :filter="true"  class="w-full" selectionMode="single" v-model:selectionKeys="selectedFile"></Tree>
                </SplitterPanel>
                <SplitterPanel class="flex" :size="40">
                    <div v-if="!selectedFile || Object.keys(selectedFile).length === 0">Najpierw wybierz plik!</div>
                    <div id="editor" class="editor"></div>
                </SplitterPanel>
                <SplitterPanel class="flex" :size="40">
                    <embed v-if="pdfContent!==''" :src="pdfContent" width="100%" height="100%" />
                    <h1 v-else>Najpierw kliknij render</h1>
                </SplitterPanel>
            </Splitter>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import TopBar from '../components/TopBar.vue';
import httpClient from '../utils/httpClient';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';

const toast = useToast();   

const route = useRoute();
const projectId = route.params.id as string;

const fileTree = ref([]);

const renderProject = async () => {
    toast.add({severity:'info', summary:'Info', detail:'Not implemented yet', life: 3000});
}   

const selectedFile = ref({});
const pdfContent = ref('');

const formatFileTree = (fileTree) => {
    toast.add({severity:'info', summary:'Info', detail:'Not implemented yet', life: 3000});
}



</script>

<style scoped>
</style>