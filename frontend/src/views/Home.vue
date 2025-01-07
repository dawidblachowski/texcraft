<template>
    <div class="w-screen h-screen flex flex-col">
        <TopBar />
        <div class="flex w-full">
            <div class="p-4 flex flex-col gap-4">
                <Button @click="newProjectDialog = true">Nowy Projekt</Button>
                <Button :severity="link.id==selectedTab ? 'primary' : 'secondary'" v-for="link in leftMenu" :key="link.name" @click="link.action">
                    <i :class="link.icon"></i>
                    {{ link.name }}
                </Button>
            </div>
            <div class="flex-grow p-4">
                <h1 class="text-2xl font-bold">{{ tableTitle }}</h1>
                <DataTable :value="projects" tableStyle="min-width: 50rem" v-if="!projectsLoading">
                    <Column field="title" header="Nazwa">
                        <template #body="{ data }">
                            <router-link :to="'/projects/' + data.id">{{ data.title }}</router-link>
                        </template>
                    </Column>
                    <Column field="description" header="Opis"></Column>
                    <Column field="createdAt" header="Data utworzenia"></Column>
                    <Column field="updatedAt" header="Data modyfikacji"></Column>
                    <Column field="user.email" header="Właściciel"></Column>
                    <Column header="Akcje">
                        <template #body="{ data }">
                            <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" @click="deleteProject(data.id)" />
                        </template>
                    </Column>
                </DataTable>
                <DataTable v-else :value="[{}, {}, {}, {}]">
                    <Column header="Nazwa">
                        <template #body>
                            <Skeleton></Skeleton>
                        </template>
                    </Column>
                    <Column header="Opis">
                        <template #body>
                            <Skeleton></Skeleton>
                        </template>
                    </Column>
                    <Column header="Data utworzenia">
                        <template #body>
                            <Skeleton></Skeleton>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
        <Dialog header="Nowy projekt" v-model:visible="newProjectDialog" :draggable="false" :modal="true" :closable="true" :closeOnEscape="true">
            <div class="p-fluid">
                <div class="field">
                    <label for="name">Nazwa Projektu: </label>
                    <InputText id="name" v-model="newProjectName" />
                </div>
                <div class="field mt-2 flex justify-end">
                    <Button label="Dodaj" icon="pi pi-check" @click="saveNewProject" />
                </div>
            </div>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import TopBar from '../components/TopBar.vue';
import { onMounted, ref, watch } from 'vue';
import axios from '../utils/httpClient'
import { useToast } from 'primevue/usetoast';

const projectsLoading = ref(true);

const onAllProjectsClick = () => {
    tableTitle.value = "Wszystkie Projekty";
    projectsLoading.value = true;
    selectedTab.value = 0;
}

const onMyProjectsClick = () => {
    tableTitle.value = "Moje Projekty";
    projectsLoading.value = true;
    selectedTab.value = 1;
}

const onSharedProjectsClick = () => {
    tableTitle.value = "Udostępnione";
    projectsLoading.value = true;
    selectedTab.value = 2;
}

const onArchiveProjectsClick = () => {
    tableTitle.value = "Archiwum";
    projectsLoading.value = true;
    selectedTab.value = 3;
}

const toast = useToast();
const leftMenu = ref([
    { id: 0, name: "Wszystkie Projekty", icon: "pi pi-home", action: onAllProjectsClick },
    { id: 1, name: "Moje Projekty", icon: "pi pi-user", action: onMyProjectsClick },
    { id: 2, name: "Udostępnione", icon: "pi pi-share-alt", action: onSharedProjectsClick },
    { id: 3, name: "Archiwum", icon: "pi pi-book", action: onArchiveProjectsClick } ,
]) 

const newProjectDialog = ref(false);
const newProjectName = ref('');
const projects = ref([]);
const tableTitle = ref('Wszystkie Projekty');
const selectedTab = ref(0);

watch(selectedTab, async (newValue) => {
    if (newValue == 0) {
        await fetchAllProjects();
    } else if (newValue == 1) {
        await fetchMyProjects();
    } else if (newValue == 2) {
        await fetchSharedProjects();
    } else if (newValue == 3) {
        await fetchArchiveProjects();
    }
})

const fetchAllProjects = async () => {
    projectsLoading.value = true;
    const response = await axios.get('/project');
    projects.value = response.data;
    projectsLoading.value = false;
}

const fetchMyProjects = async () => {
    projectsLoading.value = true;
    const response = await axios.get('/project/my');
    projects.value = response.data;
    projectsLoading.value = false;
}

const fetchSharedProjects = async () => {
    projectsLoading.value = true;
    const response = await axios.get('/project/shared');
    projects.value = response.data;
    projectsLoading.value = false;
}

const fetchArchiveProjects = async () => {
    projectsLoading.value = true;
    const response = await axios.get('/project/archive');
    projects.value = response.data;
    projectsLoading.value = false;
}

const saveNewProject = async () => {
    console.log("Not implemented yet");
}   

const deleteProject = async (id: number) => {
    console.log("Not implemented yet");
}

onMounted(async () => {
    await fetchAllProjects();
})

</script>