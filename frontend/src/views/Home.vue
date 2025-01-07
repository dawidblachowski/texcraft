<template>
    <div class="w-screen h-screen flex flex-col">
        <TopBar />
        <div class="flex w-full">
            <div class="p-4 flex flex-col gap-4">
                <Button @click="newProjectDialog = true">Nowy Projekt</Button>
                <Button severity="secondary" v-for="link in leftMenu" :key="link.name">
                    <i :class="link.icon"></i>
                    {{ link.name }}
                </Button>
            </div>
            <div class="flex-grow p-4">
                <DataTable :value="projects" tableStyle="min-width: 50rem" v-if="!projectsLoading">
                    <Column field="title" header="Title">
                        <template #body="{ data }">
                            <router-link :to="'/projects/' + data.id">{{ data.title }}</router-link>
                        </template>
                    </Column>
                    <Column field="description" header="Description"></Column>
                    <Column field="createdAt" header="Created"></Column>
                    <Column header="Actions">
                        <template #body="{ data }">
                            <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" @click="deleteProject(data.id)" />
                        </template>
                    </Column>
                </DataTable>
                <DataTable v-else :value="[{}, {}, {}, {}]">
                    <Column header="Title">
                        <template #body>
                            <Skeleton></Skeleton>
                        </template>
                    </Column>
                    <Column header="Description">
                        <template #body>
                            <Skeleton></Skeleton>
                        </template>
                    </Column>
                    <Column header="Created">
                        <template #body>
                            <Skeleton></Skeleton>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
        <Dialog header="New Project" :visible="newProjectDialog" @hide="newProjectDialog = false">
            <div class="p-fluid">
                <div class="field">
                    <label for="name">Project Name</label>
                    <InputText id="name" v-model="newProjectName" />
                </div>
                <div class="field">
                    <Button label="Save" icon="pi pi-check" @click="saveNewProject" />
                </div>
            </div>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import TopBar from '../components/TopBar.vue';
import { ref } from 'vue';
import axios from '../utils/httpClient'
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const leftMenu = ref([
    { name: "Wszystkie Projekty", icon: "pi pi-home", link: "/" },
    { name: "Moje Projekty", icon: "pi pi-user", link: "/" },
])

const newProjectDialog = ref(false);
const newProjectName = ref('');
const projectsLoading = ref(true);
const projects = ref([]);

const saveNewProject = async () => {
    console.log("Not implemented yet");
}   

const deleteProject = async (id: number) => {
    console.log("Not implemented yet");
}

</script>