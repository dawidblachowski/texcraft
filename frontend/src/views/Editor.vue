<template>
    <div class="w-screen h-screen flex flex-col">
      <TopBar />
      <div class="flex w-full h-full">
        <Splitter class="flex-auto">
          <SplitterPanel class="flex flex-col gap-4" :size="20" :minSize="20">
            <div class="flex w-full gap-4 p-2">
              <Button label="Nowy" icon="pi pi-plus" class="w-1/2 p-button-success" @click="newFileDialogVisible=true" />
              <Button
                label="Render"
                icon="pi pi-file"
                class="w-1/2 p-button-info"
                @click="renderProject"
              />
            </div>
            <Tree
              :filter="true"
              class="w-full"
              selectionMode="single"
              v-model:selectionKeys="selectedFile"
              :value="formatFileTree(fileTree)"
              nodeKey="key"
            ></Tree>
          </SplitterPanel>
          <SplitterPanel class="flex" :size="40">
            <div v-if="!selectedFile || Object.keys(selectedFile).length === 0">
              Najpierw wybierz plik!
            </div>
            {{ selectedFile }}
            <div id="editor" class="editor"></div>
          </SplitterPanel>
          <SplitterPanel class="flex" :size="40">
            <embed
              v-if="pdfContent !== ''"
              :src="pdfContent"
              width="100%"
              height="100%"
            />
            {{ formatFileTree(fileTree) }}
          </SplitterPanel>
        </Splitter>
        <Dialog
    v-model:visible="newFileDialogVisible"
    header="Nowy Plik"
    :draggable="false"
    :modal="true"
    :closable="true"
    :closeOnEscape="true"
    class="dialog-container"
  >
    <div class="p-accordion-container">
      <!-- Use v-model if you want to control the active panel from your script -->
      <Accordion>
        <!-- Panel 1 -->
        <AccordionPanel value="0">
          <AccordionHeader>Utwórz nowy plik</AccordionHeader>
          <AccordionContent>
            <div class="p-fluid form-section">
              <div class="field">
                <label for="filename">Nazwa pliku</label>
                <InputText
                  id="filename"
                  v-model="newFileName"
                  placeholder="Wprowadź nazwę pliku"
                />
              </div>
              <div class="field">
                <Button
                  label="Utwórz"
                  icon="pi pi-check"
                  @click="createNewFile"
                  class="w-full p-button-success"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>

        <!-- Panel 2 -->
        <AccordionPanel value="1">
          <AccordionHeader>Wyślij plik z komputera</AccordionHeader>
          <AccordionContent>
            <div class="p-fluid form-section">
              <div class="field">
                <label for="fileUpload">Wybierz plik</label>
                <FileUpload
                  id="fileUpload"
                  mode="basic"
                  name="file"
                  @upload="onFileUpload"
                  class="w-full"
                />
              </div>
              <div class="field">
                <label for="dragDrop">Przeciągnij i upuść plik</label>
                <div
                  id="dragDrop"
                  class="drag-drop-area"
                  @drop.prevent="onDrop"
                  @dragover.prevent
                >
                  <i class="pi pi-upload drag-icon"></i>
                  <span>Przeciągnij plik tutaj</span>
                </div>
              </div>
              <div class="field">
                <Button
                  label="Wyślij"
                  icon="pi pi-upload"
                  @click="uploadFile"
                  class="w-full p-button-primary"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </div>
  </Dialog>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, watch } from "vue";
  import type { TreeSelectionKeys } from "primevue/tree";
  import TopBar from "../components/TopBar.vue";
  import httpClient from "../utils/httpClient";
  import { useRoute } from "vue-router";
  import { useToast } from "primevue/usetoast";
  
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
  
  const getFileTree = async () => {
    const response = await httpClient.get(
      `/project/${projectId}/files/structure`
    );
    fileTree.value = response.data;
    formatFileTree(fileTree.value);
  };
  
  onMounted(async () => {
    await getFileTree();
  });
  
  const renderProject = async () => {
    toast.add({
      severity: "info",
      summary: "Info",
      detail: "Not implemented yet",
      life: 3000,
    });
  };
  
  const selectedFile = ref<TreeSelectionKeys | undefined>({}); // Initialize with an empty object
  const pdfContent = ref("");
  
  const newFileName = ref("");
  const uploadedFile = ref<File | null>(null);
  
  const onFileUpload = (event: any) => {
    uploadedFile.value = event.files[0];
  };
  
  const onDrop = (event: DragEvent) => {
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      uploadedFile.value = event.dataTransfer.files[0];
    }
  };
  
  const createNewFile = async () => {
    if (newFileName.value) {
      // Logic to create a new blank file with the given filename
    } else if (uploadedFile.value) {
      // Logic to upload the selected file
    }
    newFileDialogVisible.value = false;
  };
  
  const uploadFile = async () => {
    if (uploadedFile.value) {
      // Logic to upload the selected file
    }
    newFileDialogVisible.value = false;
  };
  
  const formatFileTree = (fileTree: Array<File>) => {
    return fileTree.reduce(
      (
        acc: Array<{
          label: string;
          key: string;
          icon: string;
          children?: any[];
        }>,
        item
      ) => {
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
        current.push({
          label: item.filename,
          key: item.id,
          icon: "pi pi-file",
        });
        return acc;
      },
      []
    );
  };
  </script>
  
  <style scoped>
  .drag-drop-area {
    border: 2px dashed var(--primary-color);
    border-radius: 5px;
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
  
  .accordion-container {
    width: 400px;
    margin: 0 auto;
  }
  
  .dialog-container {
    max-width: 600px;
    width: 100%;
  }
  
  .form-section {
    margin-top: 1rem;
  }
  </style>
  