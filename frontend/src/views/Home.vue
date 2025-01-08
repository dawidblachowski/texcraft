<template>
    <div class="w-screen h-screen flex flex-col">
        <TopBar />
        <div class="flex w-full">
            <div class="p-4 flex flex-col gap-4">
                <Button @click="newProjectDialog = true">Nowy Projekt</Button>
                <Divider />
                <div class="text-lg font-bold">Projekty</div>
                <Button :severity="link.id==selectedTab ? 'primary' : 'secondary'" v-for="link in leftMenu" :key="link.name" @click="link.action">
                    <i :class="link.icon"></i>
                    {{ link.name }}
                </Button>
            </div>
            <div class="flex-grow p-4">
                <h1 class="text-2xl font-bold">{{ tableTitle }}</h1>
                <div v-if="!projectsLoading">
                <p v-if="projects.length==0">Nie znaleziono żadnych rekordów w bazie</p>
                <DataTable :value="projects" tableStyle="min-width: 50rem" v-else  paginator :rows="10" :rowsPerPageOptions="[5, 10, 20, 50]" >
                    <Column field="title" header="Nazwa" sortable>
                        <template #body="{ data }">
                            <router-link :to="'/projects/' + data.id">{{ data.title }}</router-link>
                        </template>
                    </Column>
                    <Column field="description" header="Opis" sortable></Column>
                    <Column field="createdAt" header="Data utworzenia" sortable></Column>
                    <Column field="updatedAt" header="Data modyfikacji" sortable></Column>
                    <Column field="user.email" header="Właściciel" sortable></Column>
                    <Column header="Akcje">
                        <template #body="{ data }">
                            <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" @click="deleteProjectDialog=true;actualProject=data" />
                        </template>
                    </Column>
                </DataTable>
                </div>
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
        <Dialog header="Na pewno chcesz usunąć projekt?" v-model:visible="deleteProjectDialog" :draggable="false" :modal="true" :closable="true" :closeOnEscape="true" v-if="actualProject">
            <div class="p-fluid">
                <div class="field">
                    Nazwa Projektu: {{ actualProject.title }}
                </div>
                <div class="field mt-2 flex justify-end">
                    <Button :disabled="deletingProject" severity="danger" label="Usuń" icon="pi pi-times" @click="deleteProject" />
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

interface Project {
    id: number;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    user: {
        email: string;
    }
}

const newProjectDialog = ref(false);
const newProjectName = ref('');
const projects = ref([]);
const tableTitle = ref('Wszystkie Projekty');
const selectedTab = ref(0);
const deleteProjectDialog = ref(false);
const actualProject = ref<Project | null>(null);
const deletingProject = ref(false);

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
    try {
        const response = await axios.get('/project');
        projects.value = response.data;
    } catch (error) {
        projects.value = [];
        toast.add({ severity: 'error', summary: 'Błąd', detail: 'Nie udało się pobrać wszystkich projektów' });
    }
    projectsLoading.value = false;
}

const fetchMyProjects = async () => {
    projectsLoading.value = true;
    try {
        const response = await axios.get('/project/my');
        projects.value = response.data;
    } catch (error) {
        projects.value = [];
        toast.add({ severity: 'error', summary: 'Błąd', detail: 'Nie udało się pobrać moich projektów' });
    }
    projectsLoading.value = false;
}

const fetchSharedProjects = async () => {
    projectsLoading.value = true;
    try {
        const response = await axios.get('/project/shared');
        projects.value = response.data;
    } catch (error) {
        projects.value = [];
        toast.add({ severity: 'error', summary: 'Błąd', detail: 'Nie udało się pobrać udostępnionych projektów' });
    }
    projectsLoading.value = false;
}

const fetchArchiveProjects = async () => {
    projectsLoading.value = true;
    try {
        const response = await axios.get('/project/archive');
        projects.value = response.data;
    } catch (error) {
        projects.value = [];
        toast.add({ severity: 'error', summary: 'Błąd', detail: 'Nie udało się pobrać archiwalnych projektów' });
    }
    projectsLoading.value = false;
}

const saveNewProject = async () => {
    try {
        await axios.post('/project', { title: newProjectName.value });
        toast.add({ severity: 'success', summary: 'Sukces', detail: 'Pomyślnie dodano nowy projekt' });
        newProjectDialog.value = false;
        newProjectName.value = '';
        await fetchAllProjects();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Błąd', detail: 'Nie udało się dodać nowego projektu' });
    }
}   

const deleteProject = async () => {
    deletingProject.value = true;
    try {
        await axios.delete(`/project/${actualProject.value?.id}`);
        toast.add({ severity: 'success', summary: 'Sukces', detail: 'Pomyślnie usunięto projekt' });
        deleteProjectDialog.value = false;
        await fetchAllProjects();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Błąd', detail: 'Nie udało się usunąć projektu' });
    } finally {
        deletingProject.value = false;
    }
}

onMounted(async () => {
    await fetchAllProjects();
})

</script>