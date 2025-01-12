<template>
  <div class="w-screen h-screen flex flex-col">
    <TopBar />
    <div class="flex w-full h-full">
      <Splitter class="flex-auto">
        <!-- File Tree Panel -->
        <SplitterPanel class="flex flex-col gap-4 h-full" :size="20" :minSize="20">
          <div class="flex w-full gap-4 p-2">
            <Button label="Nowy" icon="pi pi-plus" class="w-1/2 p-button-success" @click="newFileDialogVisible=true" />
            <Button label="Render" icon="pi pi-file" class="w-1/2 p-button-info" @click="renderProject" />
            <Button label="Nowy Katalog" icon="pi pi-folder" class="w-1/2 p-button-warning" @click="newDirectoryDialogVisible=true" />
          </div>
            <h2 class="text-xl font-bold mt-4 ml-4">{{ project?.title }}</h2>
            <h3 class="text-xl font-bold mt-1 ml-4">Pliki</h3>
          <Tree
            :filter="true"
            class="w-full h-full"
            selectionMode="single"
            v-model:selectionKeys="selectedFileSelectionKeys"
            @nodeSelect="handleFileSelection"
            :value="formatFileTree(fileTree)"
            nodeKey="key"
            :loading="filesLoading"
          ></Tree>
        </SplitterPanel>

        <!-- Editor Panel -->
        <SplitterPanel class="flex" :size="40">
          <div v-if="!selectedFile">
            Najpierw wybierz plik!
          </div>
          <div class="w-full h-full" v-else>
            <MonacoEditor :key="selectedFile.key" :fileId="selectedFile.key" :projectId="projectId" :socket="socket" />
          </div>
        </SplitterPanel>

        <!-- PDF Viewer Panel -->
        <SplitterPanel class="flex" :size="40">
          <embed v-if="pdfContent !== ''" :src="pdfContent" width="100%" height="100%" />
        </SplitterPanel>
      </Splitter>

      <!-- File Upload Dialog -->
      <Dialog
        v-model:visible="newFileDialogVisible"
        header="Dodaj Nowy Plik"
        :draggable="false"
        :modal="true"
        :closable="true"
        :closeOnEscape="true"
        class="dialog-container"
      >
      <h2 style="">Utwórz nowy plik</h2>
            <div class="p-fluid form-section">
              <div class="field">
                <label for="filename">Nazwa pliku</label>
                <InputText
                  id="filename"
                  v-model="newFileName"
                  placeholder="Wprowadź nazwę pliku"
                />
              </div>
              <div class="field mt-4 flex justify-content-end gap-2">
                <Button label="Utwórz" icon="pi pi-check" class="p-button-success" @click="createNewFile" />
              </div>
            </div>
            <div class="p-fluid form-section">
              <div class="field">
                <label for="fileUpload">...lub wyślij plik z komputera</label>
                <FileUpload
                  id="fileUpload"
                  name="file"
                  mode="basic"
                  chooseLabel="Przeglądaj"
                  :customUpload="true"
                  @select="onSelectFile"
                  class="w-full"
                />
              </div>
              <div id="dragDrop" class="drag-drop-area mt-2" @drop.prevent="onDrop" @dragover.prevent>
                <i class="pi pi-upload drag-icon"></i>
                <span>Lub przeciągnij plik tutaj</span>
              </div>
              <div class="field mt-4 flex justify-content-end gap-2">
                <Button label="Anuluj" icon="pi pi-times" class="p-button-text" @click="newFileDialogVisible = false" />
                <Button label="Wyślij" icon="pi pi-upload" class="p-button-primary" @click="uploadFile" />
              </div>
            </div>
      </Dialog>

      <!-- Directory Upload Dialog -->
      <Dialog
        v-model:visible="newDirectoryDialogVisible"
        header="Dodaj Nowy Katalog"
        :draggable="false"
        :modal="true"
        :closable="true"
        :closeOnEscape="true"
        class="dialog-container"
      >
        <div class="p-fluid form-section">
          <div class="field">
            <label for="directoryname">Nazwa katalogu</label>
            <InputText
              id="directoryname"
              v-model="newDirectoryName"
              placeholder="Wprowadź nazwę katalogu"
            />
          </div>
          <div class="field mt-4 flex justify-content-end gap-2">
            <Button label="Anuluj" icon="pi pi-times" class="p-button-text" @click="newDirectoryDialogVisible = false" />
            <Button label="Utwórz" icon="pi pi-check" class="p-button-success" @click="createNewDirectory" />
          </div>
        </div>
      </Dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useToast } from "primevue/usetoast";
import TopBar from "../components/TopBar.vue";
import httpClient from "../utils/httpClient";
import { useRoute } from "vue-router";
import { io } from "socket.io-client";
import { useAuthStore } from "../stores/auth.store";
import MonacoEditor from "../components/MonacoEditor.vue";
import type { TreeSelectionKeys } from "primevue/tree";

interface File {
  id: string;
  filename: string;
  filePath: string;
  mimeType: string;
  projectId: string;
  createdAt: string;
  parentId: string | null;
  isDirectory: boolean;
}

const newFileDialogVisible = ref(false);
const newDirectoryDialogVisible = ref(false);
const toast = useToast();
const route = useRoute();
const projectId = route.params.id as string;
const fileTree = ref([]);
const selectedFileSelectionKeys = ref<string[]>([]);

const selectedFile = ref<TreeSelectionKeys | undefined>(undefined);
const pdfContent = ref("");
const uploadedFile = ref<Blob | null>(null);
const newFileName = ref("");
const newDirectoryName = ref("");
const filesLoading = ref(true);

const authStore = useAuthStore();

const accessToken = ref(authStore.accessToken);
const socket = io('http://localhost:5173', {
  auth: {
    token: accessToken.value
  },
});

socket.on('connect', () => {
  console.log('Connected to server');
  
  socket.emit('joinProjectFileList', projectId);

  socket.on('fileList', (files) => {
    fileTree.value = files;
    filesLoading.value = false;
  });

});

const project = ref<{ title: string } | null>(null);

const fetchProject = async () => {
  try {
    const response = await httpClient.get(`/project/${projectId}`);
    project.value = response.data;
  } catch (error) {
    console.error("Failed to fetch project:", error);
  }
};

onMounted(() => {
  fetchProject();
});

const renderProject = () => {
  toast.add({
    severity: "info",
    summary: "Info",
    detail: "Not implemented yet",
    life: 3000,
  });
};

const onSelectFile = (event: any) => {
  uploadedFile.value = event.files?.[0] || null;
};

const onDrop = async (event: DragEvent) => {
  if (event.dataTransfer?.files.length) {
    uploadedFile.value = event.dataTransfer.files[0] as Blob;
    await uploadFile();
  }
};

const createNewFile = async () => {
  if (newFileName.value) {
    try {
      await httpClient.post(`/project/${projectId}/files/tex`, {
        fileName: newFileName.value,
        filePath: "",
      });
      toast.add({
        severity: "success",
        summary: "Sukces",
        detail: "Plik został utworzony",
        life: 3000,
      });
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Błąd",
        detail: (error as any).response?.data?.message || "Nie udało się utworzyć pliku",
        life: 3000,
      });
    }
  }
  newFileDialogVisible.value = false;
};

const createNewDirectory = async () => {
  if (newDirectoryName.value) {
    try {
      await httpClient.post(`/project/${projectId}/directories`, {
        directoryName: newDirectoryName.value,
        directoryPath: "",
      });
      toast.add({
        severity: "success",
        summary: "Sukces",
        detail: "Katalog został utworzony",
        life: 3000,
      });
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Błąd",
        detail: (error as any).response?.data?.message || "Nie udało się utworzyć katalogu",
        life: 3000,
      });
    }
  }
  newDirectoryDialogVisible.value = false;
};

const uploadFile = async () => {
  if (!uploadedFile.value) {
    toast.add({
      severity: "warn",
      summary: "Brak Pliku",
      detail: "Najpierw wybierz plik do wysłania!",
      life: 3000,
    });
    return;
  }

  const formData = new FormData();
  formData.append("file", uploadedFile.value as Blob);
  try {
    await httpClient.post(`/project/${projectId}/files/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    toast.add({
      severity: "success",
      summary: "Sukces",
      detail: "Plik został przesłany!",
      life: 3000,
    });
    uploadedFile.value = null;
    newFileDialogVisible.value = false;
  } catch (error) {
    console.error(error);
    toast.add({
      severity: "error",
      summary: "Błąd",
      detail: (error as any).response?.data?.message || "Nie udało się przesłać pliku!",
      life: 3000,
    });
  }
};

const getItemImage = (mimeType: string | null) => {
  if (!mimeType) {
    return "pi pi-file";
  }
  if (mimeType.includes("image")) {
    return "pi pi-image";
  } else if (mimeType.includes("pdf")) {
    return "pi pi-file-pdf";
  } else if (mimeType.includes("text")) {
    return "pi pi-file";
  } else {
    return "pi pi-file";
  }
};

const formatFileTree = (fileTree: Array<File>) => {
  const buildTree = (nodes: Array<File>, parentId: string | null = null): Array<any> => {
    const children = nodes
      .filter(node => node.parentId === parentId)
      .map(node => ({
        label: node.filename,
        key: node.id,
        icon: node.isDirectory ? "pi pi-folder" : getItemImage(node.mimeType),
        selectable: !node.isDirectory,
        children: buildTree(nodes, node.id),
      }));

    return children;
  };

  return buildTree(fileTree);
};

const handleFileSelection = (node: any) => {
  selectedFile.value = node;
};

</script>

<style scoped>
.drag-drop-area {
  border: 2px dashed var(--primary-color);
  border-radius: 4px;
  padding: 1rem;
  text-align: center;
  color: var(--text-secondary-color);
  background-color: var(--surface-b);
  cursor: pointer;
}
.drag-drop-area:hover {
  border-color: var(--primary-color-dark);
}
.drag-icon {
  font-size: 2rem;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}
.dialog-container {
  max-width: 500px;
  width: 90%;
}
.form-section {
  margin-top: 1rem;
}
</style>
