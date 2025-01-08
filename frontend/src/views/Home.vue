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
                            <div class="flex gap-2">
                                <Button icon="pi pi-pencil" class="p-button-rounded p-button-primary" @click="editProjectDialog=true;actualProject=data" />
                                <Button icon="pi pi-share-alt" class="p-button-rounded p-button-info" @click="shareProjectDialog=true;actualProject=data" />
                                <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" @click="deleteProjectDialog=true;actualProject=data" />
                            </div>
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
                <FloatLabel variant="in">
                    <InputText fluid id="name" v-model="newProjectName" />
                    <label for="name">Nazwa Projektu: </label>
                </FloatLabel>
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
        <Dialog header="Edytuj projekt" v-model:visible="editProjectDialog" :draggable="false" :modal="true" :closable="true" :closeOnEscape="true" v-if="actualProject">
            <div class="p-fluid">
                <FloatLabel variant="in">
                    <InputText fluid id="name" v-model="actualProject.title" />
                    <label for="name">Nazwa Projektu: </label>
                </FloatLabel>
                <FloatLabel variant="in" class="field mt-2">
                    <Textarea v-model="actualProject.description" id="description" rows="5" cols="30" />
                    <label for="description">Opis Projektu: </label>
                </FloatLabel>
                <div class="field mt-2 flex justify-end">
                    <Button label="Edytuj" icon="pi pi-pencil" severity="warn" @click="editProject" />
                </div>
            </div>
        </Dialog>
        <Dialog header="Udostępnianie projektu" v-model:visible="shareProjectDialog" :draggable="false" :modal="true" :closable="true" :closeOnEscape="true" v-if="actualProject">
            <div class="p-fluid">
            <div v-if="!projectDetailsLoading">
                <div v-if="projectDetails.sharedWith.length != 0">
                    <p class="font-bold mb-2">Udostępniono dla:</p>
                    <ul class="list-disc pl-5">
                        <li v-for="user in projectDetails.sharedWith" :key="user.email" class="flex justify-between items-center">
                            <span>{{ user.email }}</span>
                            <Button icon="pi pi-times" class="p-button-rounded p-button-danger p-button-text" @click="removeUserFromShare(user.email, projectDetails.id)" />
                        </li>
                    </ul>
                </div>
                <div v-else>
                    <p>Jeszcze nie udostępniono nikomu.</p>
                </div>  
            </div>
            <Skeleton v-else></Skeleton>
            <Divider />
            <p class="font-bold">Dodaj adres email osoby, z którą chcesz udostępnić projekt</p>
            <FloatLabel variant="in">
                <InputText fluid id="email" v-model="shareEmail" />
                <label for="email">Email: </label>
            </FloatLabel>
            <div class="field mt-2 flex justify-end">
                <Button label="Udostępnij" icon="pi pi-share-alt" severity="info" @click="shareProject" />
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
    id: string;
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
const editProjectDialog = ref(false);
const shareProjectDialog = ref(false);
interface ProjectDetails {
    sharedWith: { email: string }[];
    id: string;
}

const projectDetails = ref<ProjectDetails>({ sharedWith: [], id: '' });
const projectDetailsLoading = ref(false);
const shareEmail = ref('');

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

const getProjectDetails = async (projectId: string) => {
    projectDetailsLoading.value = true;
    try {
        const response = await axios.get(`/project/${projectId}`);
        return response.data;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Błąd', detail: 'Nie udało się pobrać szczegółów projektu' });
        return [];
    } finally {
        projectDetailsLoading.value = false;
    }
}

const editProject = async () => {
    try {
        await axios.put(`/project/${actualProject.value?.id}`, { title: actualProject.value?.title, description: actualProject.value?.description });
        toast.add({ severity: 'success', summary: 'Sukces', detail: 'Pomyślnie zaktualizowano projekt' });
        editProjectDialog.value = false;
        await fetchAllProjects();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Błąd', detail: 'Nie udało się zaktualizować projektu' });
    }
}

const removeUserFromShare = async (userEmail: string, projectId: string) => {
    try {
        await axios.delete(`/project/share/${projectId}/${userEmail}`);
        toast.add({ severity: 'success', summary: 'Sukces', detail: 'Pomyślnie usunięto użytkownika z udostępnienia' });
        projectDetails.value = await getProjectDetails(projectId);
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Błąd', detail: 'Nie udało się usunąć użytkownika z udostępnienia' });
    }
}

const shareProject = async () => {
    if (!shareEmail.value || !actualProject.value) return;
    try {
        await axios.post(`/project/share/${actualProject.value.id}/${shareEmail.value}`);
        toast.add({ severity: 'success', summary: 'Sukces', detail: 'Pomyślnie udostępniono projekt' });
        shareEmail.value = '';
        projectDetails.value = await getProjectDetails(actualProject.value.id);
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Błąd', detail: 'Nie udało się udostępnić projektu' });
    }
}

watch(shareProjectDialog, async (newValue) => {
    if (newValue && actualProject.value) {
        projectDetails.value = await getProjectDetails(actualProject.value.id);
    }
});

onMounted(async () => {
    await fetchAllProjects();
})

</script>