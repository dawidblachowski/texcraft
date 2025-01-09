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
          </div>
          <Tree
            :filter="true"
            class="w-full h-full"
            selectionMode="single"
            v-model:selectionKeys="selectedFile"
            :value="formatFileTree(fileTree)"
            nodeKey="key"
          ></Tree>
        </SplitterPanel>

        <!-- Editor Panel -->
        <SplitterPanel class="flex" :size="40">
          <div v-if="!selectedFile || Object.keys(selectedFile).length === 0">
            Najpierw wybierz plik!
          </div>
          <div id="editor" class="editor"></div>
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
        <Accordion>
          <!-- Create New File Panel -->
          <AccordionPanel header="Utwórz nowy plik">
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
                <Button label="Anuluj" icon="pi pi-times" class="p-button-text" @click="newFileDialogVisible = false" />
                <Button label="Utwórz" icon="pi pi-check" class="p-button-success" @click="createNewFile" />
              </div>
            </div>
          </AccordionPanel>

          <!-- Upload File Panel -->
          <AccordionPanel header="Wyślij plik z komputera">
            <div class="p-fluid form-section">
              <div class="field">
                <label for="fileUpload">Wybierz plik</label>
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
          </AccordionPanel>
        </Accordion>
      </Dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import TopBar from "../components/TopBar.vue";
import httpClient from "../utils/httpClient";
import { useRoute } from "vue-router";

interface File {
  id: string;
  filename: string;
  filePath: string;
  mimeType: string;
  projectId: string;
  createdAt: string;
}

const newFileDialogVisible = ref(false);
const toast = useToast();
const route = useRoute();
const projectId = route.params.id as string;
const fileTree = ref([]);
interface SelectedFile {
  key: string;
}

const selectedFile = ref<SelectedFile | undefined>(undefined);
const pdfContent = ref("");
const uploadedFile = ref<File | { id: string; filename: string; filePath: string; mimeType: string; projectId: string; createdAt: string; } | null | File>(null);
const newFileName = ref("");

const getFileTree = async () => {
  const response = await httpClient.get(`/project/${projectId}/files/structure`);
  fileTree.value = response.data;
};

onMounted(async () => {
  await getFileTree();
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

const onDrop = (event: DragEvent) => {
  if (event.dataTransfer?.files.length) {
    uploadedFile.value = event.dataTransfer.files[0];
  }
};

const createNewFile = async () => {
  if (newFileName.value) {
    try {
      await httpClient.post(`/project/${projectId}/files/tex`, {
        fileName: newFileName.value,
        filePath: selectedFile.value ? selectedFile.value.key : "",
      });
      await getFileTree();
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
        detail: "Nie udało się utworzyć pliku",
        life: 3000,
      });
    }
  }
  newFileDialogVisible.value = false;
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
  formData.append("file", uploadedFile.value);
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
    await getFileTree();
    uploadedFile.value = null;
    newFileDialogVisible.value = false;
  } catch (error) {
    console.error(error);
    toast.add({
      severity: "error",
      summary: "Błąd",
      detail: "Nie udało się przesłać pliku!",
      life: 3000,
    });
  }
};

const formatFileTree = (fileTree: Array<File>) => {
  return fileTree.reduce((acc: any[], item) => {
    if (item.filePath === "") {
      acc.push({ label: item.filename, key: item.id, icon: "pi pi-file" });
      return acc;
    }
    const path = item.filePath.split("/");
    let current = acc;
    path.forEach((folder, index) => {
      const existing = current.find((node) => node.label === folder);
      if (existing) {
        current = existing.children || [];
      } else {
        const newNode = {
          label: folder,
          key: `${item.id}-${index}`,
          icon: "pi pi-folder",
          selectable: false,
          children: [],
        };
        current.push(newNode);
        current = newNode.children;
      }
    });
    current.push({ label: item.filename, key: item.id, icon: "pi pi-file" });
    return acc;
  }, []);
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
