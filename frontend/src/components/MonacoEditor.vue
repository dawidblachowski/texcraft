<template>
  <div class="w-full h-full"> 
    <div ref="editorContainer" class="w-full h-full"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import * as monaco from 'monaco-editor';
import SocketIOProvider from '../utils/socketIoProvider';
import latex from 'monaco-latex';
monaco.languages.register({ id: 'latex' }); 
monaco.languages.setMonarchTokensProvider('latex', latex);


const props = defineProps<{
  projectId: string;
  fileId: string;
  socket: Socket;
}>();


const ydoc = new Y.Doc();
const provider = new SocketIOProvider(ydoc, props.projectId, props.fileId, props.socket);
const type = ydoc.getText(props.fileId);

const editorContainer = ref<HTMLElement | null>(null);

onMounted(() => {
  if(!editorContainer.value) {
    console.error("Editor container is null");
    return;
  }
  const editor = monaco.editor.create(editorContainer.value, {
    value: "", 
    language: "latex",
    theme: "vs-dark",
    automaticLayout: true,
  });

  const model = editor.getModel();
  if(model) {
    new MonacoBinding(type, model, new Set([editor]), provider.awareness);
  }
  else {
    console.error("Model is null");
  }

});

onBeforeUnmount(() => {
  provider.awareness.setLocalState(null);
});
</script>

<style>
.yRemoteSelection {
    background-color: rgb(250, 129, 0, .5)
}
.yRemoteSelectionHead {
    position: absolute;
    border-left: orange solid 2px;
    border-top: orange solid 2px;
    border-bottom: orange solid 2px;
    height: 100%;
    box-sizing: border-box;
}
.yRemoteSelectionHead::after {
    position: absolute;
    content: attr(data-user-id); /* Display user ID */
    border: 3px solid orange;
    border-radius: 4px;
    left: -4px;
    top: -5px;
    background-color: white;
    padding: 2px;
    font-size: 10px;
}
</style>
